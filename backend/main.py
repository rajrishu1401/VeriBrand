"""
VeriBrand Backend API - FastAPI Server
Team KR8 - CodeZen India 2026 Round 2
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import Database
from rag_engine import RAGEngine
from deterministic import DeterministicEngine

app = FastAPI(title="VeriBrand API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
db = Database()
rag_engine = RAGEngine()
deterministic_engine = DeterministicEngine()


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    try:
        submissions = db.get_all_submissions()
        print(f"✅ Database ready ({len(submissions)} submissions)")
    except Exception as e:
        print(f"⚠️ Startup check failed: {e}")


# ==================== Request/Response Models ====================

class GuidelineUploadResponse(BaseModel):
    success: bool
    message: str
    guideline_id: str
    rules_extracted: int


class ContentSubmission(BaseModel):
    content: str
    content_type: str = "text"  # text, blog_post, email
    creator_name: str = "Demo User"


class AuditFlag(BaseModel):
    issue_type: str
    severity: str  # critical, warning, suggestion
    flagged_text: str
    rule_citation: str
    explanation: str
    suggested_fix: str
    replacement_text: Optional[str] = None
    confidence: str  # high, medium, low


class AuditResponse(BaseModel):
    submission_id: str
    brand_trust_score: int
    flags: List[AuditFlag]
    total_issues: int
    rewritten_content: Optional[str] = None


class RewriteRequest(BaseModel):
    content: str
    guideline_id: Optional[str] = None


class RewriteResponse(BaseModel):
    original_content: str
    rewritten_content: str
    total_issues_fixed: int


class ApprovalRequest(BaseModel):
    submission_id: str
    action: str  # approve, reject, request_changes
    reviewer_comment: Optional[str] = None


# ==================== API Endpoints ====================

@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    """Health check endpoint (supports GET and HEAD for uptime monitors)"""
    return {
        "service": "VeriBrand API",
        "status": "running",
        "version": "1.0.0",
        "team": "KR8"
    }


@app.post("/api/upload-guideline", response_model=GuidelineUploadResponse)
async def upload_guideline(file: UploadFile = File(...)):
    """
    Upload brand guideline document (PDF, TXT, DOCX)
    Extracts rules and stores them in the database
    """
    try:
        # Read file content
        content = await file.read()
        filename = file.filename
        
        # Process guideline
        guideline_id = db.store_guideline(filename, content)
        
        # Extract text from file
        if filename.endswith('.txt'):
            text = content.decode('utf-8')
        elif filename.endswith('.pdf'):
            from PyPDF2 import PdfReader
            import io
            pdf = PdfReader(io.BytesIO(content))
            text = "\n".join([page.extract_text() for page in pdf.pages])
        else:
            text = content.decode('utf-8', errors='ignore')
        
        # Try RAG indexing with Gemini embeddings
        rules_count = 0
        rag_active = False
        try:
            rules_count = rag_engine.index_guideline(guideline_id, text)
            rag_active = True
        except Exception as rag_error:
            print(f"RAG indexing skipped (Gemini API error): {rag_error}")
            rules_count = 0
        
        # Extract deterministic rules (always works - no API needed)
        det_rules_count = deterministic_engine.extract_rules(text)
        rules_count += det_rules_count
        
        if rag_active:
            msg = "Guideline uploaded and indexed successfully (Deterministic + Gemini semantic analysis active)"
        else:
            msg = "Guideline uploaded (Deterministic rules only — check GEMINI_API_KEY for semantic analysis)"
        
        return GuidelineUploadResponse(
            success=True,
            message=msg,
            guideline_id=guideline_id,
            rules_extracted=rules_count
        )
        
    except Exception as e:
        import traceback
        print(f"ERROR in upload_guideline: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/submit-content", response_model=AuditResponse)
async def submit_content(submission: ContentSubmission):
    """
    Submit content for brand compliance check
    Returns flagged issues with citations and suggestions
    """
    try:
        # Store submission
        submission_id = db.store_submission(
            submission.content,
            submission.content_type,
            submission.creator_name
        )
        
        # Run deterministic checks (fast - always works)
        deterministic_flags = deterministic_engine.check(submission.content)
        
        # Try semantic checks (RAG + Gemini LLM)
        semantic_flags = []
        try:
            latest_id = db.get_latest_guideline_id()
            semantic_flags = rag_engine.check_content(submission.content, guideline_id=latest_id or "default")
        except Exception as rag_error:
            print(f"Semantic checking skipped (Gemini API error): {rag_error}")
        
        # Combine flags
        all_flags = deterministic_flags + semantic_flags
        
        # Calculate Brand Trust Score (0-100)
        critical_count = sum(1 for f in all_flags if f['severity'] == 'critical')
        warning_count = sum(1 for f in all_flags if f['severity'] == 'warning')
        suggestion_count = sum(1 for f in all_flags if f['severity'] == 'suggestion')
        
        # Score formula: 100 - (critical * 20) - (warning * 7) - (suggestion * 2)
        trust_score = max(0, 100 - (critical_count * 20) - (warning_count * 7) - (suggestion_count * 2))
        
        # Round 3 Feature: Generate Intent-Preserving Compliant Rewrite if any issues exist
        rewritten_content = None
        if len(all_flags) > 0:
            try:
                rewritten_content = rag_engine.generate_intent_preserving_rewrite(
                    submission.content,
                    all_flags,
                    guideline_id=latest_id or "default"
                )
            except Exception as rw_err:
                print(f"Rewrite generation error: {rw_err}")
                rewritten_content = None

        # Store audit results with rewritten content
        db.store_audit_results(submission_id, all_flags, trust_score, rewritten_content=rewritten_content)
        
        return AuditResponse(
            submission_id=submission_id,
            brand_trust_score=trust_score,
            flags=[AuditFlag(**flag) for flag in all_flags],
            total_issues=len(all_flags),
            rewritten_content=rewritten_content
        )
        
    except Exception as e:
        import traceback
        print(f"ERROR in submit_content: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rewrite", response_model=RewriteResponse)
async def rewrite_content(request: RewriteRequest):
    """
    Round 3 Feature: Intent-Preserving Brand Compliant Rewrite
    Takes draft marketing content and returns a 100% compliant version
    preserving the author's persuasive intent and core message.
    """
    try:
        content = request.content
        if not content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")

        # Run checks to identify flags
        det_flags = deterministic_engine.check(content)
        sem_flags = []
        guideline_id = request.guideline_id or db.get_latest_guideline_id() or "default"
        try:
            sem_flags = rag_engine.check_content(content, guideline_id=guideline_id)
        except Exception as e:
            print(f"Semantic audit error in rewrite: {e}")

        all_flags = det_flags + sem_flags
        
        rewritten = rag_engine.generate_intent_preserving_rewrite(content, all_flags, guideline_id=guideline_id)
        
        return RewriteResponse(
            original_content=content,
            rewritten_content=rewritten,
            total_issues_fixed=len(all_flags)
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR in rewrite_content: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/submission/{submission_id}")
async def get_submission(submission_id: str):
    """Get submission details and audit results"""
    submission = db.get_submission(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


@app.post("/api/approve")
async def approve_content(request: ApprovalRequest):
    """Approve, reject, or request changes for submitted content"""
    try:
        success = db.update_submission_status(
            request.submission_id,
            request.action,
            request.reviewer_comment
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Submission not found")
        
        return {
            "success": True,
            "message": f"Content {request.action}d successfully",
            "submission_id": request.submission_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rewrite", response_model=RewriteResponse)
async def rewrite_content(request: RewriteRequest):
    """
    Round 3 Feature: Intent-Preserving Brand Compliant Rewrite
    Takes draft marketing content and returns a 100% compliant version
    preserving the author's persuasive intent and core message.
    """
    try:
        content = request.content
        if not content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")

        # Run checks to identify flags
        det_flags = deterministic_engine.check(content)
        sem_flags = []
        guideline_id = request.guideline_id or db.get_latest_guideline_id() or "default"
        try:
            sem_flags = rag_engine.check_content(content, guideline_id=guideline_id)
        except Exception as e:
            print(f"Semantic audit error in rewrite: {e}")

        all_flags = det_flags + sem_flags
        
        rewritten = rag_engine.generate_intent_preserving_rewrite(content, all_flags, guideline_id=guideline_id)
        
        return RewriteResponse(
            original_content=content,
            rewritten_content=rewritten,
            total_issues_fixed=len(all_flags)
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR in rewrite_content: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get governance analytics for dashboard"""
    stats = db.get_analytics()
    return stats


@app.get("/api/guidelines")
async def get_guidelines():
    """Return all uploaded guidelines (id, filename, uploaded_at)"""
    return db.get_all_guidelines()


@app.get("/api/submissions")
async def get_submissions():
    """Return all submissions with status, trust_score, creator_name, total_flags"""
    return db.get_all_submissions()



@app.get("/api/export/{submission_id}")
async def export_submission(submission_id: str):
    """Export a submission with all flags as a downloadable JSON response"""
    from fastapi.responses import JSONResponse
    submission = db.get_submission(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    export_data = {
        "export_version": "1.0",
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "submission": submission
    }
    
    headers = {
        "Content-Disposition": f"attachment; filename=veribrand-export-{submission_id[:8]}.json"
    }
    return JSONResponse(content=export_data, headers=headers)


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
