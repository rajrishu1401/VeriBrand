# VeriBrand - AI-Powered Brand Governance Platform

**Team KR8** | CodeZen India 2026 — Round 2 Submission

| Team Member | Email |
|---|---|
| Rishu Raj (Lead) | rajrishu1401@gmail.com |
| Kuldeep Chaudhary | kuldeepchaudhary.0904@gmail.com |
| Krishna Bhist | b.krishnaworks@gmail.com |
| Daksh Mehrotra | mehrotradaksh2005@gmail.com |

---

## 🎯 What It Does

VeriBrand instantly audits marketing content (ads, emails, social posts) against an organisation's uploaded brand guidelines — returning every violation with the exact rule it breaks, its severity, and a suggested fix. A human brand manager then approves, rejects, or requests changes.

**Core workflow a judge can test right now:**
1. Upload a brand guideline → `/upload`
2. Submit content for audit → `/submit`
3. Review violations and make a decision → `/review`

---

## 🏗️ Architecture

```
Creator submits content
        ↓
   FastAPI Backend
        ↓
  ┌─────────────────────────────────┐
  │       Hybrid Audit Engine       │
  │                                 │
  │  Deterministic    Gemini RAG   │
  │  (regex rules) + (semantic AI) │
  └─────────────────────────────────┘
        ↓
  Trust Score + Citation-anchored flags
        ↓
  Brand Manager reviews → Approve / Reject / Request Changes
        ↓
  Decision logged to SQLite
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | FastAPI (Python 3.11+), Uvicorn |
| **Database** | SQLite (via SQLAlchemy) |
| **Vector DB** | ChromaDB (persistent) |
| **AI — Embeddings** | Google Gemini `gemini-embedding-001` (3072-dim) |
| **AI — Generation** | Google Gemini `gemini-3.5-flash-lite` |
| **Deployment** | Render (backend) + Vercel (frontend) |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gemini API key → [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# Create .env from example
copy .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Create .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

npm run dev -- --port 8080
```

Then open **http://localhost:8080**

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload-guideline` | Upload brand guidelines (PDF/TXT) |
| `POST` | `/api/submit-content` | Submit content for audit |
| `GET` | `/api/submissions` | List all submissions with status |
| `GET` | `/api/submission/{id}` | Get single submission + flags |
| `POST` | `/api/approve` | Record approval decision |
| `GET` | `/api/guidelines` | List all uploaded guidelines |
| `GET` | `/api/export/{id}` | Download audit report as JSON |
| `POST` | `/api/seed-demo` | Seed 5 demo submissions for judges |
| `GET` | `/api/dashboard/stats` | Aggregated metrics for dashboard |
| `GET` | `/` | Health check |

---

## ✅ Completed Features (Round 2)

- [x] **Guideline Upload** — PDF and TXT parsing with text chunking
- [x] **Deterministic Audit** — 15+ rule types (banned words, superlatives, ALL CAPS, missing disclaimers)
- [x] **Gemini Semantic RAG** — `gemini-embedding-001` embeddings + ChromaDB similarity search + `gemini-3.5-flash-lite` for violation analysis
- [x] **Citation-Anchored Flags** — Every flag includes exact rule text, line number, and severity (critical/warning/suggestion)
- [x] **Trust Score** — `100 - critical×20 - warning×7 - suggestion×2`, floored at 0
- [x] **Approval Workflow** — Approve / Reject / Request Changes with manager notes
- [x] **Review Queue** — Filterable table of all submissions with status badges
- [x] **Dashboard Analytics** — Live metrics: total audits, avg trust score, top violation types
- [x] **Export Reports** — Download full audit as JSON with `Content-Disposition` header
- [x] **Demo Data Seeding** — Judges can seed 5 realistic submissions instantly

---

## 🔮 Round 3 Planned Improvements

1. **Intent-Preserving AI Rewrites** — Gemini automatically suggests a corrected version of flagged content that passes all rules while preserving the creator's message
2. **Living Guideline Feedback Loop** — Each approval/rejection trains a weighting model so the system learns which violations matter most to each brand
3. **Leadership Analytics Dashboard** — Brand health trends over time, creator leaderboards, violation heatmaps for strategic decision-making

---

## 📁 Project Structure

```
VeriBrand/
├── backend/
│   ├── main.py          # FastAPI app + all endpoints
│   ├── rag_engine.py    # Gemini embeddings + ChromaDB + semantic audit
│   ├── deterministic.py # Regex-based rule extractor + checker
│   ├── database.py      # SQLite schema + CRUD operations
│   ├── requirements.txt
│   ├── .env.example
│   └── docs/
│       └── sample_brand_guideline.txt
├── frontend/
│   └── app/
│       ├── page.tsx     # Home dashboard
│       ├── upload/      # Guideline upload
│       ├── submit/      # Content audit + trust score
│       └── review/      # Approval workflow
├── ARCHITECTURE.md
├── DEPLOYMENT.md
└── README.md
```
