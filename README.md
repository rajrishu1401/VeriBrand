# VeriBrand — AI-Powered Enterprise Brand Governance Platform

**Team KR8** | CodeZen India 2026 — Final Round (Top 50 Finalist)

| Member | Role | Email |
|---|---|---|
| Rishu Raj | Team Lead & Full-Stack Architect | rajrishu1401@gmail.com |
| Kuldeep Chaudhary | Backend & Database Systems | kuldeepchaudhary.0904@gmail.com |
| Krishna Bhist | Frontend & UI/UX Systems | b.krishnaworks@gmail.com |
| Daksh Mehrotra | AI/ML & Multi-Modal Pipeline | mehrotradaksh2005@gmail.com |

---

## Live Deployments & Repository

| Target | URL |
|---|---|
| **Live Web Application (Vercel)** | https://veri-brand-umber.vercel.app |
| **Backend REST API (Render)** | https://veribrand-backend.onrender.com |
| **Public Source Repository (GitHub)** | https://github.com/rajrishu1401/VeriBrand |
| **Final Documentation PDF** | Available in repo root (`TeamKR8_Round3.pdf`) |

---

## What It Does

VeriBrand is an automated brand governance platform that bridges the gap between marketing creativity and brand safety. By combining deterministic rule matching with Gemini 2.5 Flash RAG and Pillow multi-modal computer vision, VeriBrand audits marketing copy and visual creatives against uploaded brand guidelines — returning citation-anchored flags, mathematical contrast scores, and 1-click compliant rewrites.

### The 3 Promised Improvements Delivered in Round 3

| # | Improvement | Implementation & Technical Depth |
|---|---|---|
| **1** | **Intent-Preserving AI Rewrites** | Automatically synthesizes compliant alternatives that satisfy all guidelines while preserving the creator's persuasive intent, tone, and value propositions. Features inline diff comparison and 1-click editor adoption. |
| **2** | **Multi-Modal Visual Brand Auditing** | Ingests banners/ads (PNG, JPG, WebP), extracts dominant hex color palettes via Pillow color quantization, calculates mathematical WCAG 2.1 relative luminance contrast ratios ($CR = \frac{L_1 + 0.05}{L_2 + 0.05}$), and runs Gemini Vision for logo placement & OCR verification. |
| **3** | **Living Guideline Feedback Loop** | Tracks human reviewer decisions (approvals vs rejections) against AI flags in real-time. When reviewers repeatedly override a specific rule flag (>50% override rate), VeriBrand alerts leadership that the rule is ambiguous, overly strict, or outdated. |

---

## Technical Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │          Client Layer (Next.js 14)           │
                    │  App Router • Tailwind CSS • HTML5 Canvas    │
                    └──────────────────────┬───────────────────────┘
                                           │ JSON / Multipart
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │            FastAPI Server (Python)           │
                    │      Uvicorn • Pydantic Schema Validation    │
                    └──────┬───────────────┬───────────────┬───────┘
                           │               │               │
            ┌──────────────▼────┐   ┌──────▼──────┐  ┌─────▼───────────────┐
            │   Deterministic   │   │  Gemini RAG │  │ Multi-Modal Vision  │
            │   Engine (Regex)  │   │ 2.5 Flash   │  │ Pillow + WCAG Math  │
            │  0% Hallucination │   │ Nuance/Tone │  │ Hex Extraction / OCR│
            └──────────────┬────┘   └──────┬──────┘  └─────┬───────────────┘
                           │               │               │
                           └───────────────┼───────────────┘
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │              SQLite Database                 │
                    │ Submissions • Flags • Reviews • Feedback Loop│
                    └──────────────────────────────────────────────┘
```

---

## Tech Stack & Libraries

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, HTML5 Canvas API (dynamic mock generation). Deployed on Vercel.
- **Backend:** FastAPI, Python 3.13, Uvicorn, Pydantic v2. Deployed on Render with automated keep-alive.
- **AI & LLM:** Google Gemini 2.5 Flash via `google-genai` SDK with strict JSON response schemas and temperature 0.1 for high-precision governance; Gemini Vision for multi-modal analysis.
- **Computer Vision & Math:** Pillow (PIL) for image quantization and dominant hex clustering; WCAG 2.1 relative luminance contrast math ($L = 0.2126R + 0.7152G + 0.0722B$).
- **Database:** SQLite with relational schema linking submissions, audit flags, reviewer actions, and policy override analytics.

---

## API Endpoints

### Core Governance & Guidelines
- `GET /` — Health check (supports both `GET` and `HEAD` for monitoring).
- `POST /api/upload-guidelines` — Ingest PDF/TXT brand guidelines into vector and semantic storage.
- `GET /api/guidelines` — Retrieve all uploaded brand guidelines.

### Content Auditing & AI Rewriting (Round 3)
- `POST /api/submit-content` — Audit marketing copy (returns Brand Trust Score 0–100, citation flags, and full intent-preserving rewrite).
- `POST /api/rewrite` — Generate standalone brand-compliant copy revision from flagged draft.
- `POST /api/audit-image` — **(Round 3 Feature)** Ingests creative images, extracts dominant hex colors, checks approved/prohibited palettes, computes WCAG 2.1 contrast, inspects logo presence, and performs OCR text auditing.

### Reviewer Workflow & Feedback Loop (Round 3)
- `GET /api/submissions` — Retrieve submission history with flags and status.
- `GET /api/submission/{id}` — Fetch detailed submission report with audit flags and original content.
- `POST /api/approve` — Record reviewer decision (`approved`, `rejected`, `request_changes`) with feedback notes.
- `GET /api/export/{id}` — Export audit report as standardized JSON.
- `GET /api/dashboard/stats` — Real-time telemetry: audit counts, average trust score, and top violations.
- `GET /api/governance/feedback-loop` — **(Round 3 Feature)** Reviewer override rate analytics per rule citation and ambiguous guideline alerts.

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt

# Configure environment:
copy .env.example .env
# Add your GEMINI_API_KEY inside backend/.env

# Run server:
uvicorn main:app --reload --port 8000
```
Backend runs at `http://localhost:8000` (Interactive Swagger docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## Testing & Quality Assurance

- **Unit & Property Tests:** Deterministic keyword casing, smart replacements, WCAG luminance calculations.
- **Visual Auditing Verification:** Tested with compliant banner creatives (`#1E1B4B` / `#4F46E5`, 11.4:1 contrast) vs non-compliant banners (`#00FF00` neon, 1.3:1 contrast).
- **End-to-End Resilience:** Empty inputs, cold restart handling, and private/incognito session testing.

---

## CodeZen India 2026 — Team KR8
- **Project Name:** VeriBrand
- **Submission Type:** Round 3 Final Product
