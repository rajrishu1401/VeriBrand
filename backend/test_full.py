"""
Fast backend test - no Gemini API calls (upload uses deterministic only via mock)
Tests: health, guidelines list, seed, submissions, approve, export, dashboard stats
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Patch RAGEngine before import so no Gemini calls happen during upload
import unittest.mock as mock

# API key loaded from .env file (do not hardcode here)
from dotenv import load_dotenv
load_dotenv()

# Mock RAG to skip Gemini network calls in the fast test
with mock.patch("rag_engine.RAGEngine.index_guideline", return_value=None), \
     mock.patch("rag_engine.RAGEngine.semantic_audit", return_value=[]):

    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)

    PASS = "✅"; FAIL = "❌"
    results = []

    def chk(name, ok, detail=""):
        results.append(ok)
        print(f"{PASS if ok else FAIL}  {name}" + (f"  [{detail}]" if detail else ""))

    print("═"*55)
    print("  VERIBRAND BACKEND TEST (Fast - no Gemini calls)")
    print("═"*55)

    # 1. Health
    print("\n── 1. HEALTH ──────────────────────────────────────")
    r = client.get("/")
    chk("GET / returns 200", r.status_code == 200)
    chk("VeriBrand in response", "VeriBrand" in str(r.json()))
    print(f"      Response: {r.json()}")

    # 2. Guidelines list
    print("\n── 2. GET /api/guidelines ─────────────────────────")
    r = client.get("/api/guidelines")
    chk("Returns 200", r.status_code == 200)
    chk("Returns list", isinstance(r.json(), list))
    print(f"      Count before upload: {len(r.json())}")

    # 3. Upload guideline
    print("\n── 3. POST /api/upload-guideline ──────────────────")
    with open("docs/sample_brand_guideline.txt", "rb") as f:
        txt = f.read()
    r = client.post("/api/upload-guideline", files={"file": ("brand.txt", txt, "text/plain")})
    chk("Returns 200", r.status_code == 200)
    d = r.json()
    chk("Has guideline_id", bool(d.get("guideline_id")))
    chk("rules_extracted > 0", d.get("rules_extracted", 0) > 0, f"rules={d.get('rules_extracted')}")
    print(f"      Message: {d.get('message','')[:70]}")
    print(f"      Rules: {d.get('rules_extracted')}, ID: {d.get('guideline_id','')[:12]}...")

    # 4. Seed demo data
    print("\n── 4. POST /api/seed-demo ─────────────────────────")
    r = client.post("/api/seed-demo")
    chk("Returns 200", r.status_code == 200)
    chk("success=True", r.json().get("success") == True)
    print(f"      Response: {r.json()}")

    # 5. Submissions list
    print("\n── 5. GET /api/submissions ────────────────────────")
    r = client.get("/api/submissions")
    chk("Returns 200", r.status_code == 200)
    subs = r.json()
    chk("Returns list", isinstance(subs, list))
    chk("Has seeded submissions", len(subs) > 0, f"count={len(subs)}")
    if subs:
        s = subs[0]
        chk("Has id", "id" in s)
        chk("Has trust_score", "trust_score" in s, f"score={s.get('trust_score')}")
        chk("Has status", "status" in s, f"status={s.get('status')}")
        chk("Has creator_name", "creator_name" in s, f"name={s.get('creator_name')}")
        for s in subs[:5]:
            print(f"      {s.get('creator_name','?'):20} score={s.get('trust_score'):3}  status={s.get('status')}")

    # 6. Single submission
    print("\n── 6. GET /api/submission/{id} ────────────────────")
    sid = subs[0]["id"] if subs else None
    if sid:
        r = client.get(f"/api/submission/{sid}")
        chk("Returns 200", r.status_code == 200)
        d = r.json()
        chk("Has trust_score", "trust_score" in d)
        chk("Has status", "status" in d)
        chk("Has creator_name", "creator_name" in d)
        chk("Has audit_flags list", isinstance(d.get("audit_flags"), list), f"flags={len(d.get('audit_flags',[]))}")
        if d.get("audit_flags"):
            f0 = d["audit_flags"][0]
            chk("Flag has severity", "severity" in f0, f0.get("severity","?"))
            chk("Flag has description", "description" in f0)
            chk("Flag has suggested_fix", "suggested_fix" in f0)
            chk("Flag has rule_citation", "rule_citation" in f0)
            chk("Flag has flagged_text", "flagged_text" in f0)
        # 404 test
        r2 = client.get("/api/submission/nonexistent-id")
        chk("404 for unknown id", r2.status_code == 404)

    # 7. Approve workflow
    print("\n── 7. POST /api/approve ───────────────────────────")
    if sid:
        for decision in ["approved", "rejected", "needs_changes"]:
            r = client.post("/api/approve", json={"submission_id": sid, "decision": decision, "reviewer_notes": f"Test {decision}"})
            chk(f"decision={decision} returns 200", r.status_code == 200)
            r2 = client.get(f"/api/submission/{sid}")
            chk(f"Status updated to {decision}", r2.json().get("status") == decision, r2.json().get("status"))

    # 8. Export report
    print("\n── 8. GET /api/export/{id} ────────────────────────")
    if sid:
        r = client.get(f"/api/export/{sid}")
        chk("Returns 200", r.status_code == 200)
        chk("Has Content-Disposition", "content-disposition" in r.headers, str(r.headers.get("content-disposition","")))
        chk("Has JSON body", r.status_code == 200 and len(r.content) > 10)

    # 9. Dashboard stats
    print("\n── 9. GET /api/dashboard/stats ────────────────────")
    r = client.get("/api/dashboard/stats")
    chk("Returns 200", r.status_code == 200)
    d = r.json()
    chk("Has total_submissions", "total_submissions" in d, f"total={d.get('total_submissions')}")
    chk("Has average_trust_score", "average_trust_score" in d, f"avg={d.get('average_trust_score')}")
    chk("Has top_issues", "top_issues" in d, f"count={len(d.get('top_issues',[]))}")
    print(f"      Stats: {d}")

    # 10. Content submission (deterministic only - no Gemini due to mock)
    print("\n── 10. POST /api/submit-content (deterministic) ──")
    bad = {
        "content": "BEST GUARANTEED EXCLUSIVE deal! Revolutionary unprecedented FREE results! Never fails. Always works.",
        "content_type": "ad",
        "creator_name": "Test User"
    }
    r = client.post("/api/submit-content", json=bad)
    chk("Returns 200", r.status_code == 200)
    d = r.json()
    chk("Has trust_score", "trust_score" in d, f"score={d.get('trust_score')}")
    chk("Has submission_id", bool(d.get("submission_id")))
    chk("Has audit_flags", isinstance(d.get("audit_flags"), list), f"flags={len(d.get('audit_flags',[]))}")
    chk("Has flags > 0 for bad content", len(d.get("audit_flags",[])) > 0)
    chk("Trust score < 60 for bad content", d.get("trust_score",100) < 60, f"score={d.get('trust_score')}")

    good = {
        "content": "Our solution streamlines compliance workflows. Results may vary. Terms and conditions apply.",
        "content_type": "general",
        "creator_name": "Good User"
    }
    r = client.post("/api/submit-content", json=good)
    chk("Good content returns 200", r.status_code == 200)
    chk("Good content trust score >= 80", r.json().get("trust_score", 0) >= 80, f"score={r.json().get('trust_score')}")

    print("\n" + "═"*55)
    passed = sum(results)
    total = len(results)
    print(f"  RESULT: {passed}/{total} tests passed")
    if passed == total:
        print("  🎉 ALL TESTS PASSED — Backend fully functional!")
    else:
        print(f"  ⚠️  {total - passed} FAILED — see above for details")
    print("═"*55)
