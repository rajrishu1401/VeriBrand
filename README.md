# VeriBrand — AI-Powered Brand Governance Platform

**Team KR8** | CodeZen India 2026 — Round 2

| Member | Role | Email |
|---|---|---|
| Rishu Raj | Team Lead | rajrishu1401@gmail.com |
| Kuldeep Chaudhary | Backend | kuldeepchaudhary.0904@gmail.com |
| Krishna Bhist | Frontend | b.krishnaworks@gmail.com |
| Daksh Mehrotra | AI/ML | mehrotradaksh2005@gmail.com |

---

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://veri-brand-umber.vercel.app |
| **Backend API** | https://veribrand-backend.onrender.com |
| **Source Code** | https://github.com/rajrishu1401/VeriBrand |

---

## What It Does

VeriBrand instantly audits marketing content (ads, emails, social posts) against an organisation's uploaded brand guidelines — returning every violation with the **exact rule it breaks**, its severity level, and a suggested fix. A human brand manager then approves, rejects, or requests changes.

### Core Workflow

```
1. Upload brand guidelines (PDF or TXT)
        ↓
2. Submit content for audit (paste any text)
        ↓
   ┌─────────────────────────────────┐
   │       Hybrid Audit Engine       │
   │  Deterministic  +  Gemini RAG   │
   │  (regex rules)    (semantic AI) │
   └─────────────────────────────────┘
        ↓
3. Receive Trust Score + citation-anchored violations
        ↓
4. Brand manager: Approve / Reject / Request Changes
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.11+), Uvicorn |
| Database | SQLite via SQLAlchemy |
| Vector DB | ChromaDB (persistent) |
| AI — Embeddings | Google Gemini `gemini-embedding-001` (3072-dim) |
| AI — Generation | Google Gemini `gemini-3.5-flash-lite` |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Features

- **Guideline Upload** — PDF and TXT parsing with text chunking
- **Deterministic Audit** — 15+ rule types: banned words, superlatives, ALL CAPS, missing disclaimers
- **Gemini Semantic RAG** — Vector similarity search + LLM analysis for tone and context violations
- **Citation-Anchored Flags** — Every violation includes the exact rule, section reference, and severity
- **Trust Score** — 0–100 score: `100 - critical×20 - warning×7 - suggestion×2`
- **Approval Workflow** — Approve / Reject / Request Changes with reviewer notes
- **Review Queue** — Filterable table of all submissions with status badges
- **Dashboard Analytics** — Live metrics: total audits, average trust score, top violation types
- **Export Reports** — Download full audit as JSON

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gemini API key → [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

copy .env.example .env
# Edit .env → set GEMINI_API_KEY=your_key_here

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local

npm run dev -- --port 8080
```

Open **http://localhost:8080**

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/api/upload-guideline` | Upload brand guidelines |
| `POST` | `/api/submit-content` | Submit content for audit |
| `GET` | `/api/submissions` | List all submissions |
| `GET` | `/api/submission/{id}` | Get single submission with flags |
| `POST` | `/api/approve` | Record approval decision |
| `GET` | `/api/guidelines` | List uploaded guidelines |
| `GET` | `/api/export/{id}` | Download audit report as JSON |
| `GET` | `/api/dashboard/stats` | Aggregated metrics |

---

## Round 3 Improvements

1. **Intent-Preserving AI Rewrites** — Automatically generate a corrected version of flagged content that passes all brand rules while preserving the creator's voice and intent for 1-click adoption.
2. **Multi-Modal Visual Brand Auditing** — Expand from text-only to image auditing: extract dominant color palettes (hex verification), check logo placement & clear space, and calculate WCAG text-overlay contrast ratios.
3. **Living Guideline Feedback Loop** — Track reviewer approval/rejection decisions against AI flags to detect patterns and alert leadership when guidelines are ambiguous or outdated.

---

## Project Structure

```
VeriBrand/
├── backend/
│   ├── main.py           # FastAPI app + all endpoints
│   ├── rag_engine.py     # Gemini embeddings + ChromaDB + semantic audit
│   ├── deterministic.py  # Regex rule extractor + checker
│   ├── database.py       # SQLite schema + CRUD
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   └── sample_brand_guideline.txt
├── frontend/
│   └── app/
│       ├── page.tsx      # Home dashboard
│       ├── upload/       # Guideline upload
│       ├── submit/       # Content audit
│       └── review/       # Approval workflow
├── render.yaml           # Render backend deploy config
└── README.md
```
