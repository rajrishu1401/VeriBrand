"""
Database layer using SQLite
Simple and fast for hackathon - no external DB needed
"""

import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional


class Database:
    def __init__(self, db_path="veribrand.db"):
        self.db_path = db_path
        self.init_db()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        return conn
    
    def init_db(self):
        """Initialize database tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Guidelines table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS guidelines (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                content BLOB NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Submissions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                content_type TEXT NOT NULL,
                creator_name TEXT NOT NULL,
                status TEXT DEFAULT 'draft',
                trust_score INTEGER,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewer_comment TEXT
            )
        """)
        
        # Audit flags table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_flags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                submission_id TEXT NOT NULL,
                issue_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                flagged_text TEXT NOT NULL,
                rule_citation TEXT NOT NULL,
                explanation TEXT NOT NULL,
                suggested_fix TEXT NOT NULL,
                confidence TEXT NOT NULL,
                FOREIGN KEY (submission_id) REFERENCES submissions(id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def store_guideline(self, filename: str, content: bytes) -> str:
        """Store uploaded guideline"""
        guideline_id = str(uuid.uuid4())
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO guidelines (id, filename, content) VALUES (?, ?, ?)",
            (guideline_id, filename, content)
        )
        
        conn.commit()
        conn.close()
        
        return guideline_id

    def get_latest_guideline_id(self) -> Optional[str]:
        """Get the ID of the most recently uploaded guideline"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM guidelines ORDER BY uploaded_at DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        return row["id"] if row else None
    
    def store_submission(self, content: str, content_type: str, creator_name: str) -> str:
        """Store content submission"""
        submission_id = str(uuid.uuid4())
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO submissions (id, content, content_type, creator_name) VALUES (?, ?, ?, ?)",
            (submission_id, content, content_type, creator_name)
        )
        
        conn.commit()
        conn.close()
        
        return submission_id
    
    def store_audit_results(self, submission_id: str, flags: List[Dict], trust_score: int):
        """Store audit flags for a submission"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Update trust score
        cursor.execute(
            "UPDATE submissions SET trust_score = ? WHERE id = ?",
            (trust_score, submission_id)
        )
        
        # Insert flags
        for flag in flags:
            cursor.execute("""
                INSERT INTO audit_flags 
                (submission_id, issue_type, severity, flagged_text, rule_citation, 
                 explanation, suggested_fix, confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                submission_id,
                flag['issue_type'],
                flag['severity'],
                flag['flagged_text'],
                flag['rule_citation'],
                flag['explanation'],
                flag['suggested_fix'],
                flag['confidence']
            ))
        
        conn.commit()
        conn.close()
    
    def get_submission(self, submission_id: str) -> Optional[Dict]:
        """Get submission with audit results"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Get submission
        cursor.execute("SELECT * FROM submissions WHERE id = ?", (submission_id,))
        submission = cursor.fetchone()
        
        if not submission:
            conn.close()
            return None
        
        # Get flags
        cursor.execute("SELECT * FROM audit_flags WHERE submission_id = ?", (submission_id,))
        flags = cursor.fetchall()
        
        conn.close()
        
        return {
            "id": submission["id"],
            "content": submission["content"],
            "content_type": submission["content_type"],
            "creator_name": submission["creator_name"],
            "status": submission["status"],
            "trust_score": submission["trust_score"],
            "submitted_at": submission["submitted_at"],
            "reviewer_comment": submission["reviewer_comment"],
            "flags": [dict(flag) for flag in flags],
            "total_issues": len(flags)
        }
    
    def update_submission_status(self, submission_id: str, action: str, comment: Optional[str] = None) -> bool:
        """Update submission status (approve/reject/request_changes)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE submissions SET status = ?, reviewer_comment = ? WHERE id = ?",
            (action, comment, submission_id)
        )
        
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return affected > 0
    
    def get_all_guidelines(self) -> List[Dict]:
        """Get all uploaded guidelines (id, filename, uploaded_at)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, filename, uploaded_at FROM guidelines ORDER BY uploaded_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def get_all_submissions(self) -> List[Dict]:
        """Get all submissions with status, trust_score, submitted_at, creator_name, total_flags"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.id, s.creator_name, s.content_type, s.status, s.trust_score,
                   s.submitted_at, s.reviewer_comment,
                   SUBSTR(s.content, 1, 120) as content_snippet,
                   COUNT(af.id) as total_flags
            FROM submissions s
            LEFT JOIN audit_flags af ON af.submission_id = s.id
            GROUP BY s.id
            ORDER BY s.submitted_at DESC
        """)
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def seed_demo_data(self):
        """Clear submissions + audit_flags and insert 5 realistic demo submissions"""
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM audit_flags")
        cursor.execute("DELETE FROM submissions")

        demo_submissions = [
            {
                "id": "demo-001",
                "content": "Introducing our BEST EVER product — guaranteed to make you look 10 years younger overnight! Buy now and get 50% off. Limited time offer!",
                "content_type": "email",
                "creator_name": "Alice Chen",
                "status": "rejected",
                "trust_score": 24,
                "submitted_at": "2026-11-15 09:12:00",
                "reviewer_comment": "Multiple superlative and guaranteed claims violate brand guidelines.",
                "flags": [
                    {"issue_type": "Superlative Claim", "severity": "critical", "flagged_text": "BEST EVER", "rule_citation": "Brand Policy §3.1", "explanation": "Unqualified superlatives are not permitted.", "suggested_fix": "Remove 'BEST EVER' or add qualifying context.", "confidence": "high"},
                    {"issue_type": "Guarantee Claim", "severity": "critical", "flagged_text": "guaranteed to make you look 10 years younger overnight", "rule_citation": "Brand Policy §4.2", "explanation": "Unsubstantiated health claims are prohibited.", "suggested_fix": "Replace with realistic, substantiated benefit language.", "confidence": "high"},
                    {"issue_type": "Urgency Language", "severity": "warning", "flagged_text": "Limited time offer", "rule_citation": "Brand Policy §5.1", "explanation": "Urgency language can mislead consumers.", "suggested_fix": "Specify the actual end date of the offer.", "confidence": "medium"},
                ]
            },
            {
                "id": "demo-002",
                "content": "Experience our award-winning skincare range. Clinically tested on 500 participants, with 89% reporting improved hydration in 4 weeks. Shop now at veribrand.com",
                "content_type": "blog_post",
                "creator_name": "Marcus Lee",
                "status": "approved",
                "trust_score": 91,
                "submitted_at": "2026-11-16 11:30:00",
                "reviewer_comment": "Well-cited claims. Approved.",
                "flags": [
                    {"issue_type": "Stat Verification", "severity": "suggestion", "flagged_text": "89% reporting improved hydration", "rule_citation": "Brand Policy §4.1", "explanation": "Ensure clinical study reference is linked or footnoted.", "suggested_fix": "Add a footnote with study name and date.", "confidence": "low"},
                ]
            },
            {
                "id": "demo-003",
                "content": "Our new energy drink gives you UNLIMITED energy and focus. Doctors recommend it! Zero side effects, totally safe for all ages.",
                "content_type": "text",
                "creator_name": "Priya Sharma",
                "status": "pending",
                "trust_score": 38,
                "submitted_at": "2026-11-17 08:45:00",
                "reviewer_comment": None,
                "flags": [
                    {"issue_type": "Absolute Claim", "severity": "critical", "flagged_text": "UNLIMITED energy", "rule_citation": "Brand Policy §3.2", "explanation": "Absolute performance claims without evidence are prohibited.", "suggested_fix": "Use 'sustained' or 'long-lasting' instead.", "confidence": "high"},
                    {"issue_type": "Endorsement Claim", "severity": "critical", "flagged_text": "Doctors recommend it", "rule_citation": "Brand Policy §6.1", "explanation": "Must cite specific endorsement or remove.", "suggested_fix": "Remove unless you have documented medical endorsements.", "confidence": "high"},
                    {"issue_type": "Safety Claim", "severity": "warning", "flagged_text": "Zero side effects, totally safe for all ages", "rule_citation": "Brand Policy §4.3", "explanation": "Blanket safety claims require substantiation.", "suggested_fix": "Reference clinical safety data or qualify the claim.", "confidence": "medium"},
                ]
            },
            {
                "id": "demo-004",
                "content": "Discover our summer collection — vibrant styles for every occasion. Free shipping on orders over $50. See terms and conditions.",
                "content_type": "email",
                "creator_name": "Jordan Kim",
                "status": "approved",
                "trust_score": 95,
                "submitted_at": "2026-11-17 14:20:00",
                "reviewer_comment": "Clean, compliant copy. Approved.",
                "flags": []
            },
            {
                "id": "demo-005",
                "content": "#1 rated app in the world! Millions of happy customers can't be wrong. Download now — it's completely FREE forever.",
                "content_type": "text",
                "creator_name": "Sophie Okafor",
                "status": "request_changes",
                "trust_score": 61,
                "submitted_at": "2026-11-18 07:05:00",
                "reviewer_comment": "Superlative ranking claim needs citation. 'FREE forever' needs legal review.",
                "flags": [
                    {"issue_type": "Ranking Claim", "severity": "critical", "flagged_text": "#1 rated app in the world", "rule_citation": "Brand Policy §3.3", "explanation": "Ranking claims require a dated, credible source.", "suggested_fix": "Cite the rating source (e.g., 'App Store, Oct 2026').", "confidence": "high"},
                    {"issue_type": "Pricing Claim", "severity": "warning", "flagged_text": "completely FREE forever", "rule_citation": "Brand Policy §5.2", "explanation": "Perpetual pricing claims require legal approval.", "suggested_fix": "Replace with 'Free to download' or add terms.", "confidence": "medium"},
                    {"issue_type": "Vague Claim", "severity": "suggestion", "flagged_text": "Millions of happy customers", "rule_citation": "Brand Policy §3.1", "explanation": "Quantify or substantiate the customer count.", "suggested_fix": "Use actual verified customer count with source.", "confidence": "low"},
                ]
            },
        ]

        for sub in demo_submissions:
            cursor.execute(
                "INSERT INTO submissions (id, content, content_type, creator_name, status, trust_score, submitted_at, reviewer_comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (sub["id"], sub["content"], sub["content_type"], sub["creator_name"],
                 sub["status"], sub["trust_score"], sub["submitted_at"], sub["reviewer_comment"])
            )
            for flag in sub["flags"]:
                cursor.execute("""
                    INSERT INTO audit_flags (submission_id, issue_type, severity, flagged_text, rule_citation, explanation, suggested_fix, confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (sub["id"], flag["issue_type"], flag["severity"], flag["flagged_text"],
                      flag["rule_citation"], flag["explanation"], flag["suggested_fix"], flag["confidence"]))

        conn.commit()
        conn.close()

    def get_analytics(self) -> Dict:
        """Get dashboard analytics"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Total submissions
        cursor.execute("SELECT COUNT(*) as count FROM submissions")
        total_submissions = cursor.fetchone()["count"]
        
        # Average trust score
        cursor.execute("SELECT AVG(trust_score) as avg_score FROM submissions WHERE trust_score IS NOT NULL")
        avg_trust_score = cursor.fetchone()["avg_score"] or 0
        
        # Top issues
        cursor.execute("""
            SELECT issue_type, COUNT(*) as count 
            FROM audit_flags 
            GROUP BY issue_type 
            ORDER BY count DESC 
            LIMIT 5
        """)
        top_issues = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "total_submissions": total_submissions,
            "average_trust_score": round(avg_trust_score, 1),
            "top_issues": top_issues
        }
