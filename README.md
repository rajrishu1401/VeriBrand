# VeriBrand - AI-Powered Brand Governance Platform

**Team KR8** - CodeZen India 2026 Round 2 Submission

**Team Members:**
- Rishu Raj (rajrishu1401@gmail.com)
- Kuldeep Chaudhary (kuldeepchaudhary.0904@gmail.com)
- Krishna Bhist (b.krishnaworks@gmail.com)
- Daksh Mehrotra (mehrotradaksh2005@gmail.com)

## 🎯 Problem Statement

Enterprise brands lose millions due to off-brand content publication. Current solutions are either:
- **Manual checklists** (slow, inconsistent)
- **Generic ChatGPT wrappers** (hallucinate citations, lack accountability)

## 🚀 Solution: VeriBrand

**Hybrid Deterministic + Semantic AI** for brand governance with **zero hallucination** in citations.

### Key Differentiators:
1. **Citation-Anchored Feedback** - Every flag links to exact guideline section
2. **Hybrid AI Architecture** - Deterministic (regex) + Semantic (RAG) = best of both worlds
3. **Pre-Publication Workflow** - Catch issues before they go live
4. **Confidence Scoring** - Know which issues are critical vs. suggestions

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js UI    │
│  (TypeScript)   │
└────────┬────────┘
         │ REST API
┌────────▼────────┐
│  FastAPI Server │
│    (Python)     │
└────┬───────┬────┘
     │       │
     │       └──────────────┐
     │                      │
┌────▼─────────┐   ┌───────▼────────┐
│ Deterministic │   │   RAG Engine   │
│  Rules Engine│   │  (ChromaDB +   │
│   (Regex)    │   │    OpenAI)     │
└──────────────┘   └────────────────┘
     │                      │
     └──────────┬───────────┘
                │
         ┌──────▼──────┐
         │   SQLite    │
         │  Database   │
         └─────────────┘
```

## 📋 Tech Stack

### Backend
- **FastAPI** - High-performance Python API framework
- **SQLite** - Lightweight database for demo (production: PostgreSQL)
- **ChromaDB** - Vector database for semantic search
- **OpenAI GPT-4** - LLM for semantic analysis
- **PyPDF2** - PDF guideline parsing

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- OpenAI API Key

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here

# Run server
python main.py
```

Backend will start at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will start at `http://localhost:3000`

## 🎮 Demo Workflow

### 1. Upload Brand Guidelines
- Navigate to `/upload`
- Upload a PDF/TXT brand guideline document
- System extracts deterministic rules and creates vector embeddings
- Get confirmation with rules count

### 2. Submit Content for Audit
- Navigate to `/submit`
- Paste marketing copy, blog post, or email content
- Click "Load Bad Example" to see flagged issues
- Click "Load Good Example" to see clean approval
- Submit for instant compliance audit

### 3. Review Audit Results
- See **Brand Trust Score** (0-100) calculated from violations
- View all flagged issues with:
  - **Severity level** (critical/warning/suggestion)
  - **Exact rule citation** from uploaded guideline
  - **Suggested fix** with actionable guidance
  - **Confidence score** (high/medium/low)

### 4. Approve/Reject
- Navigate to `/review`
- Review all compliance issues
- Choose action: Approve / Request Changes / Reject
- Add reviewer comments
- Submit decision (logged in database)

## 🧪 Test Data

### Sample Bad Content (triggers flags):
```
Introducing the BEST marketing tool you'll ever need!

Our revolutionary platform GUARANTEES 100% success for your campaigns. 
It's absolutely FREE with no hidden costs.

We're the #1 choice for marketing professionals worldwide!
```

**Expected Issues:**
- Banned words: "BEST", "GUARANTEES", "FREE"
- Superlatives without evidence: "#1 choice"
- All caps formatting: "BEST", "GUARANTEES", "FREE"
- Missing disclaimers for performance claims

### Sample Good Content (passes audit):
```
Introducing our new marketing analytics platform.

Our platform helps businesses track campaign performance with real-time insights. 
Try our free trial (no credit card required, terms apply).

Join over 5,000 businesses using our tools. Results may vary based on your use case.
```

## 🔑 Key Features Implemented

### ✅ Core Workflow (30/30 points target)
- [x] Upload brand guideline (PDF/TXT parsing)
- [x] Submit content for audit
- [x] See flagged issues with exact citations
- [x] Approve/reject workflow with comments
- [x] End-to-end demonstrable

### ✅ Hybrid AI Engine
- [x] **Deterministic Engine**: Regex-based rules (banned words, superlatives, formatting)
- [x] **Semantic Engine**: RAG with ChromaDB + OpenAI embeddings
- [x] Both engines provide exact guideline citations
- [x] Confidence scoring on every flag

### ✅ User Experience
- [x] Clean, professional UI with Tailwind CSS
- [x] Real-time audit results
- [x] Brand Trust Score visualization (0-100)
- [x] Sample content loader (good vs. bad examples)
- [x] Responsive design

### ✅ Production-Ready Patterns
- [x] Type-safe TypeScript frontend
- [x] Pydantic models for API validation
- [x] Error handling and loading states
- [x] Database persistence (SQLite)
- [x] RESTful API design

## 📊 How Scoring Works

### Brand Trust Score Formula
```
Base Score = 100

For each issue:
  - Critical severity: -15 points
  - Warning severity: -5 points
  - Suggestion severity: -2 points

Final Score = max(0, Base Score - Total Deductions)
```

### Severity Classification
- **Critical**: Legal risks, banned terms, missing required disclaimers
- **Warning**: Unprofessional tone, unsupported superlatives
- **Suggestion**: Minor formatting issues, style improvements

## 🏆 Competitive Advantages

| Feature | VeriBrand | Generic AI | Manual Review |
|---------|-----------|------------|---------------|
| Citation Accuracy | ✓ 100% | ✗ Hallucinates | ✓ Manual |
| Speed | ✓ Instant | ✓ Fast | ✗ Hours |
| Consistency | ✓ Always | ~ Variable | ✗ Human error |
| Pre-Publication | ✓ Yes | ✗ Post-hoc | ✓ Yes |
| Confidence Scores | ✓ Yes | ✗ No | ~ Implicit |
| Scale | ✓ Unlimited | ✓ High | ✗ Limited |

## 🔮 Future Enhancements (Post-Hackathon)

1. **Multi-modal Analysis**: Image/video brand compliance
2. **Real-time Collaboration**: Multiple reviewers, live comments
3. **Analytics Dashboard**: Governance trends, top violations
4. **Integration APIs**: Slack, Notion, Google Docs plugins
5. **Custom Training**: Fine-tune LLM on specific brand voice
6. **Version Control**: Track guideline changes over time

## 📝 API Endpoints

### `POST /api/upload-guideline`
Upload brand guideline document
- **Input**: File (PDF/TXT/DOCX)
- **Output**: `{ guideline_id, rules_extracted, success }`

### `POST /api/submit-content`
Submit content for audit
- **Input**: `{ content, content_type, creator_name }`
- **Output**: `{ submission_id, brand_trust_score, flags[], total_issues }`

### `GET /api/submission/{id}`
Get submission details
- **Output**: Full submission with audit results

### `POST /api/approve`
Approve/reject content
- **Input**: `{ submission_id, action, reviewer_comment }`
- **Output**: `{ success, message }`

### `GET /api/dashboard/stats`
Get governance analytics
- **Output**: Aggregate statistics

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.9+)
- Verify OpenAI API key in `.env`
- Try: `pip install --upgrade pip` then reinstall requirements

### Frontend build errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Check Node version: `node --version` (need 18+)

### API connection errors
- Ensure backend is running on port 8000
- Check CORS settings in `main.py`
- Verify fetch URLs in frontend pages

## 📧 Contact

Team KR8 - CodeZen India 2026
- **Rishu Raj**: rajrishu1401@gmail.com
- **Kuldeep Chaudhary**: kuldeepchaudhary.0904@gmail.com
- **Krishna Bhist**: b.krishnaworks@gmail.com
- **Daksh Mehrotra**: mehrotradaksh2005@gmail.com

---

**Built with ❤️ in 72 hours for CodeZen India 2026 Hackathon**
