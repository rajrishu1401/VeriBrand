"""
VeriBrand Backend API - FastAPI Server
Team KR8 - CodeZen India 2026 Round 2
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import re
import json
import traceback
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import Database
from rag_engine import RAGEngine
from deterministic import DeterministicEngine
from visual_engine import VisualBrandEngine

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
visual_engine = VisualBrandEngine()


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    try:
        submissions = db.get_all_submissions()
        print(f"✅ Database ready ({len(submissions)} submissions)")
    except Exception as e:
        print(f"⚠️ Startup check failed: {e}")

    # Rename legacy demo guideline filename in DB (one-time migration)
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE guidelines SET filename = ? WHERE filename = ?",
            ("Demo Brand Guideline (Sample).txt", "sample_brand_guideline.txt")
        )
        rows_updated = cursor.rowcount
        conn.commit()
        conn.close()
        if rows_updated > 0:
            print(f"✅ Renamed {rows_updated} legacy demo guideline(s) to 'Demo Brand Guideline (Sample).txt'")
    except Exception as e:
        print(f"⚠️ Demo guideline rename migration failed: {e}")

    # Normalize legacy/existing submission statuses in DB
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE submissions SET status = 'rejected' WHERE status IN ('reject', 'REJECT')")
        cursor.execute("UPDATE submissions SET status = 'approved' WHERE status IN ('approve', 'APPROVE')")
        cursor.execute("UPDATE submissions SET status = 'pending' WHERE status IN ('draft', 'DRAFT') OR status IS NULL")
        cursor.execute("UPDATE submissions SET guideline_name = 'Demo Brand Guideline (Sample).txt' WHERE guideline_name IS NULL")
        conn.commit()
        conn.close()
        print("✅ Normalized submission statuses and guideline references in database")
    except Exception as e:
        print(f"⚠️ Submission status normalization failed: {e}")


# ==================== Request/Response Models ====================

class ExtractedRuleItem(BaseModel):
    section: str
    category: str
    rule: str
    enforcement: str
    severity: str


class GuidelineUploadResponse(BaseModel):
    success: bool
    message: str
    guideline_id: str
    rules_extracted: int
    extracted_rules: List[ExtractedRuleItem] = []


class ContentSubmission(BaseModel):
    content: str
    content_type: str = "text"  # text, blog_post, email
    creator_name: str = "Demo User"
    guideline_id: Optional[str] = None
    include_standard_rules: bool = False


class GuidelineCreateRequest(BaseModel):
    title: str
    version: str = "1.0"
    description: Optional[str] = None
    include_standard_rules: bool = True
    prohibited_words: List[str] = []
    allowed_ambassadors: List[str] = []
    prohibit_person_names: bool = False
    prohibited_colors: List[str] = []
    approved_palette: List[str] = []
    prohibit_exclamations: bool = False
    prohibit_questions: bool = False
    prohibit_100_percent: bool = False
    custom_rules_text: Optional[str] = None
    raw_content: Optional[str] = None


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
    guideline_id: Optional[str] = None
    guideline_name: Optional[str] = None


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


class ColorItem(BaseModel):
    hex: str
    rgb: List[int]
    percentage: float


class WCAGResult(BaseModel):
    contrast_ratio: float
    wcag_aa_pass: bool
    wcag_aaa_pass: bool
    background_hex: Optional[str] = None
    foreground_hex: Optional[str] = None


class VisualAuditResponse(BaseModel):
    submission_id: str
    image_dimensions: str
    dominant_palette: List[ColorItem]
    wcag_analysis: WCAGResult
    ocr_text: Optional[str] = ""
    logo_detected: bool = False
    logo_assessment: Optional[str] = ""
    brand_trust_score: int
    flags: List[AuditFlag]
    total_issues: int
    guideline_id: Optional[str] = None
    guideline_name: Optional[str] = None


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
        
        # Parse individual rule items for the UI Extracted Governance Rule Matrix
        import re
        extracted_rule_items = []
        numbered_matches = re.findall(r"^\s*(\d+)[\.\)]\s*(.+)$", text, re.MULTILINE)
        if numbered_matches:
            for num, r_text in numbered_matches:
                clean_r = r_text.strip()
                r_lower = clean_r.lower()
                cat = "Brand Compliance"
                enf = "Deterministic"
                sev = "Critical"

                if "100%" in r_lower or "guarantee" in r_lower or "claim" in r_lower:
                    cat = "Tone & Claims"
                    enf = "Deterministic"
                elif any(w in r_lower for w in ["name", "person", "ambassador", "roshan"]):
                    cat = "Entity & Endorsements"
                    enf = "Semantic RAG"
                    sev = "Warning" if "can be" in r_lower else "Critical"
                elif any(w in r_lower for w in ["red", "blue", "colour", "color", "poster"]):
                    cat = "Visual & Palette"
                    enf = "Deterministic"
                elif "question" in r_lower or "?" in r_lower:
                    cat = "Punctuation & Style"
                    enf = "Deterministic"
                elif "exclai" in r_lower or "exclam" in r_lower or "!" in r_lower:
                    cat = "Punctuation & Formatting"
                    enf = "Deterministic"

                extracted_rule_items.append(ExtractedRuleItem(
                    section=f"Rule {num}",
                    category=cat,
                    rule=clean_r,
                    enforcement=enf,
                    severity=sev
                ))
            rules_count = len(extracted_rule_items)

        if rag_active:
            msg = "Guideline uploaded and indexed successfully (Deterministic + Gemini semantic analysis active)"
        else:
            msg = "Guideline uploaded (Deterministic rules only — check GEMINI_API_KEY for semantic analysis)"
        
        return GuidelineUploadResponse(
            success=True,
            message=msg,
            guideline_id=guideline_id,
            rules_extracted=rules_count,
            extracted_rules=extracted_rule_items
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
        # Retrieve guideline text and metadata if available
        guideline_text = None
        target_gid = submission.guideline_id
        if target_gid == "default" or not target_gid:
            target_gid = db.get_latest_guideline_id()

        guideline_filename = None
        if target_gid:
            g = db.get_guideline(target_gid)
            if g:
                guideline_filename = g.get("filename")
                if g.get("content"):
                    try:
                        guideline_text = g["content"].decode("utf-8", errors="ignore")
                    except Exception:
                        pass
        if not guideline_filename:
            guideline_filename = "Demo Brand Guideline (Sample).txt"

        # Store submission with guideline tracking
        submission_id = db.store_submission(
            submission.content,
            submission.content_type,
            submission.creator_name,
            guideline_id=target_gid,
            guideline_name=guideline_filename
        )

        # Run deterministic checks strictly scoped to guideline
        deterministic_flags = deterministic_engine.check(
            submission.content,
            guideline_text=guideline_text,
            include_standard_rules=submission.include_standard_rules
        )
        
        # Try semantic checks (RAG + Gemini LLM)
        semantic_flags = []
        try:
            semantic_flags = rag_engine.check_content(submission.content, guideline_id=target_gid or "default")
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
                    guideline_id=target_gid or "default"
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
            rewritten_content=rewritten_content,
            guideline_id=target_gid,
            guideline_name=guideline_filename
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


@app.post("/api/audit-image", response_model=VisualAuditResponse)
async def audit_image_endpoint(
    file: UploadFile = File(...),
    creator_name: str = Form("Creator"),
    guideline_id: Optional[str] = Form(None),
    include_standard_rules: bool = Form(False)
):
    """
    Round 3 Feature: Multi-Modal Visual Brand Audit
    Analyzes marketing visuals (PNG, JPG, WebP) for:
    - Dominant hex palette vs approved brand colors
    - WCAG 2.1 AA/AAA text overlay contrast ratio
    - Logo placement, orientation, and clear space
    - Embedded text compliance (OCR via Gemini Vision against selected guideline)
    """
    try:
        content = await file.read()
        filename = file.filename or "creative_asset.png"
        mime_type = file.content_type or "image/png"
        
        # Retrieve guideline text if available
        guideline_text = None
        target_gid = guideline_id
        if target_gid == "default" or not target_gid:
            target_gid = db.get_latest_guideline_id()

        guideline_filename = None
        if target_gid:
            g = db.get_guideline(target_gid)
            if g:
                guideline_filename = g.get("filename")
                if g.get("content"):
                    try:
                        guideline_text = g["content"].decode("utf-8", errors="ignore")
                    except Exception:
                        pass
        if not guideline_filename:
            guideline_filename = "Demo Brand Guideline (Sample).txt"
        
        # Run visual audit engine strictly scoped to guideline
        result = visual_engine.audit_image(
            content,
            mime_type=mime_type,
            guidelines_text=guideline_text,
            include_standard_rules=include_standard_rules
        )
        
        # Store in database as an image submission
        submission_id = db.store_submission(
            f"Visual Asset: {filename} ({result['image_dimensions']})",
            content_type="image",
            creator_name=creator_name,
            guideline_id=target_gid,
            guideline_name=guideline_filename
        )
        
        db.store_audit_results(
            submission_id,
            result["flags"],
            result["brand_trust_score"],
            rewritten_content=result.get("ocr_text")
        )
        
        return VisualAuditResponse(
            submission_id=submission_id,
            image_dimensions=result["image_dimensions"],
            dominant_palette=[ColorItem(**c) for c in result["dominant_palette"]],
            wcag_analysis=WCAGResult(**result["wcag_analysis"]),
            ocr_text=result.get("ocr_text", ""),
            logo_detected=result.get("logo_detected", False),
            logo_assessment=result.get("logo_assessment", "Not analyzed"),
            brand_trust_score=result["brand_trust_score"],
            flags=[AuditFlag(**f) for f in result["flags"]],
            total_issues=result["total_issues"],
            guideline_id=target_gid,
            guideline_name=guideline_filename
        )
    except Exception as e:
        import traceback
        print(f"ERROR in audit_image_endpoint: {str(e)}")
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


@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get governance analytics for dashboard"""
    stats = db.get_analytics()
    feedback = db.get_living_guideline_feedback_loop()
    stats["feedback_loop"] = feedback
    return stats


@app.get("/api/governance/feedback-loop")
async def get_feedback_loop():
    """
    Round 3 Feature: Living Guideline Feedback Loop
    Identifies high-override rules where human brand managers frequently dismiss flags,
    alerting leadership to ambiguous, outdated, or misaligned guidelines.
    """
    return db.get_living_guideline_feedback_loop()


@app.get("/api/guidelines")
async def get_guidelines():
    """Return all uploaded guidelines (id, filename, uploaded_at)"""
    return db.get_all_guidelines()


def parse_rules_from_text(text: str) -> List[ExtractedRuleItem]:
    import re
    extracted = []
    
    # 1. Try numbered rules (e.g. 1. 100% should not be written.)
    numbered_matches = re.findall(r"^\s*(\d+)[\.\)]\s*(.+)$", text, re.MULTILINE)
    if numbered_matches:
        for num, r_text in numbered_matches:
            clean_r = r_text.strip()
            r_lower = clean_r.lower()
            cat = "Brand Compliance"
            enf = "Deterministic"
            sev = "Critical"

            if "100%" in r_lower or "guarantee" in r_lower or "claim" in r_lower:
                cat = "Tone & Claims"
                enf = "Deterministic"
            elif any(w in r_lower for w in ["name", "person", "ambassador", "roshan", "competitor"]):
                cat = "Entity & Endorsements"
                enf = "Semantic RAG"
                sev = "Warning" if "can be" in r_lower else "Critical"
            elif any(w in r_lower for w in ["red", "blue", "colour", "color", "poster", "palette"]):
                cat = "Visual & Palette"
                enf = "Deterministic"
            elif "question" in r_lower or "?" in r_lower:
                cat = "Punctuation & Style"
                enf = "Deterministic"
            elif "exclai" in r_lower or "exclam" in r_lower or "!" in r_lower:
                cat = "Punctuation & Formatting"
                enf = "Deterministic"

            extracted.append(ExtractedRuleItem(
                section=f"Rule {num}",
                category=cat,
                rule=clean_r,
                enforcement=enf,
                severity=sev
            ))
        return extracted

    # 2. Try section matches (e.g. Section 1.2: Avoid absolute claims)
    section_matches = re.findall(r"^(?:Section|Rule)\s*([\d\.]+):?\s*(.+)$", text, re.MULTILINE | re.IGNORECASE)
    if section_matches:
        for sec, r_text in section_matches:
            clean_r = r_text.strip()
            r_lower = clean_r.lower()
            cat = "Brand Compliance"
            enf = "Deterministic"
            sev = "Critical"

            if any(w in r_lower for w in ["tone", "voice", "claim", "absolute", "guarantee"]):
                cat = "Tone & Voice"
            elif any(w in r_lower for w in ["color", "colour", "palette", "wcag", "contrast", "visual"]):
                cat = "Color & Accessibility"
            elif any(w in r_lower for w in ["disclaimer", "legal", "terms"]):
                cat = "Legal Disclaimers"
            elif any(w in r_lower for w in ["name", "naming", "trademark"]):
                cat = "Brand Naming"
                sev = "Warning"
            elif any(w in r_lower for w in ["competitor"]):
                cat = "Competitive Claims"
                enf = "Semantic RAG"

            extracted.append(ExtractedRuleItem(
                section=f"Section {sec}",
                category=cat,
                rule=clean_r,
                enforcement=enf,
                severity=sev
            ))
        return extracted

    # 3. Default fallback rules
    return [
        ExtractedRuleItem(section="Section 1.2", category="Tone & Voice", rule="Avoid absolute promises. Voice must remain objective and data-backed.", enforcement="Deterministic", severity="Critical"),
        ExtractedRuleItem(section="Section 3.1", category="Competitive Claims", rule="Never mention competitors by name directly without documented benchmark citations.", enforcement="Semantic RAG", severity="Critical"),
        ExtractedRuleItem(section="Section 4.4", category="Legal Disclaimers", rule="All promotional claims regarding free tiers must carry terms disclaimer.", enforcement="Deterministic", severity="Critical"),
        ExtractedRuleItem(section="Section 6.2", category="Brand Naming", rule="Always use proper CamelCase 'TechCorp' with capital T and C.", enforcement="Deterministic", severity="Warning"),
        ExtractedRuleItem(section="Section 12.1", category="Color & Accessibility", rule="Primary brand palette restricted to TechCorp Navy (#1E1B4B) and Indigo (#4F46E5).", enforcement="Deterministic", severity="Critical"),
        ExtractedRuleItem(section="Section 12.3", category="WCAG Contrast", rule="All typography must maintain minimum ISO/IEC 40500 WCAG 2.1 Level AA contrast ratio.", enforcement="Deterministic", severity="Critical"),
    ]


@app.get("/api/guidelines/{guideline_id}")
async def get_guideline_detail(guideline_id: str):
    """Return guideline details and its extracted rules"""
    g = db.get_guideline(guideline_id)
    if not g:
        raise HTTPException(status_code=404, detail="Guideline not found")
    
    text = ""
    if isinstance(g.get("content"), (bytes, bytearray)):
        text = g["content"].decode("utf-8", errors="ignore")
    elif isinstance(g.get("content"), str):
        text = g["content"]
    
    rules = parse_rules_from_text(text)
    
    return {
        "id": g["id"],
        "filename": g["filename"],
        "uploaded_at": g["uploaded_at"],
        "content_preview": text[:500],
        "full_content": text,
        "rules_count": len(rules),
        "rules": [r.dict() for r in rules]
    }


@app.post("/api/guidelines/create")
async def create_guideline_endpoint(req: GuidelineCreateRequest):
    """
    Brand Policy Studio: Create or version brand guidelines directly from web form.
    Stores policy in DB, indexes vector embeddings, and extracts rule matrix.
    """
    try:
        if req.raw_content and req.raw_content.strip():
            full_guideline_content = req.raw_content.strip()
        else:
            sections = []
            sections.append(f"{req.title.upper()} — BRAND GOVERNANCE POLICY")
            sections.append(f"Specification Version: {req.version}")
            sections.append(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
            sections.append("-" * 60)

            if req.description:
                sections.append(f"\n1. POLICY OVERVIEW\n{req.description.strip()}")

            rule_num = 1
            rules_text_list = []

            # Standard Baseline
            if req.include_standard_rules:
                rules_text_list.append(f"{rule_num}. Maintain minimum ISO/IEC 40500 WCAG 2.1 AA text contrast (4.5:1 ratio).")
                rule_num += 1
                rules_text_list.append(f"{rule_num}. Avoid absolute guarantees ('guarantee', 'guaranteed') and unverifiable claims.")
                rule_num += 1
                rules_text_list.append(f"{rule_num}. Never mention competitors directly without documented benchmark citations.")
                rule_num += 1
                rules_text_list.append(f"{rule_num}. Promotional offers regarding trials or pricing must carry 'Terms and conditions apply'.")
                rule_num += 1

            # Content & Tone Rules
            if req.prohibit_100_percent:
                rules_text_list.append(f"{rule_num}. 100% should not be written.")
                rule_num += 1

            if req.prohibit_person_names:
                rules_text_list.append(f"{rule_num}. Name of any person should not be mentioned.")
                rule_num += 1

            if req.allowed_ambassadors:
                ambassador_str = ", ".join(req.allowed_ambassadors)
                rules_text_list.append(f"{rule_num}. Name of Our brand ambassador can be mentioned, which is {ambassador_str}.")
                rule_num += 1

            if req.prohibit_questions:
                rules_text_list.append(f"{rule_num}. Question should not be added in marketing copy.")
                rule_num += 1

            if req.prohibit_exclamations:
                rules_text_list.append(f"{rule_num}. Use of exclamation is prohibited.")
                rule_num += 1

            for w in req.prohibited_words:
                if w.strip():
                    rules_text_list.append(f"{rule_num}. Prohibited term: '{w.strip()}' must not appear in marketing claims.")
                    rule_num += 1

            # Visual & Color Rules
            if req.prohibited_colors:
                colors_str = " and ".join(req.prohibited_colors)
                rules_text_list.append(f"{rule_num}. No {colors_str} colour should be used in posters or creative assets.")
                rule_num += 1

            if req.approved_palette:
                palette_str = ", ".join(req.approved_palette)
                rules_text_list.append(f"{rule_num}. Approved Brand Color Palette: {palette_str}.")
                rule_num += 1

            # Additional Custom Rules
            if req.custom_rules_text and req.custom_rules_text.strip():
                for line in req.custom_rules_text.strip().split("\n"):
                    line_clean = line.strip()
                    if line_clean:
                        line_clean = re.sub(r"^\d+[\.\)]\s*", "", line_clean)
                        rules_text_list.append(f"{rule_num}. {line_clean}")
                        rule_num += 1

            sections.append("\n2. ENFORCEABLE GOVERNANCE RULES")
            sections.extend(rules_text_list)
            full_guideline_content = "\n".join(sections)

        # Generate clean filename with version
        clean_title = re.sub(r"[^\w\-]", "_", req.title).lower() if req.title else "custom_brand_policy"
        clean_version = re.sub(r"[^\w\.]", "", req.version) if req.version else "1.0"
        filename = f"{clean_title}_v{clean_version}.txt"

        guideline_id = db.store_guideline(filename, full_guideline_content.encode("utf-8"))

        # Index in RAG vector store
        try:
            rag_engine.index_guideline(guideline_id, full_guideline_content)
        except Exception as e:
            print(f"RAG indexing warning: {e}")

        # Extract rules for immediate matrix display
        extracted_rules = parse_rules_from_text(full_guideline_content)

        return {
            "success": True,
            "guideline_id": guideline_id,
            "filename": filename,
            "title": req.title,
            "version": req.version,
            "rules_count": len(extracted_rules),
            "extracted_rules": [r.dict() for r in extracted_rules],
            "raw_text": full_guideline_content
        }
    except Exception as e:
        import traceback
        print(f"ERROR in create_guideline_endpoint: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/submissions")
async def get_submissions(response: Response):
    """Return all submissions with status, trust_score, creator_name, total_flags"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
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
