# VeriBrand - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                      (Next.js + TypeScript)                     │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   Home   │  │  Upload  │  │  Submit  │  │  Review  │     │
│  │Dashboard │  │Guidelines│  │ Content  │  │ Approve  │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │              │              │            │
└───────┼─────────────┼──────────────┼──────────────┼────────────┘
        │             │              │              │
        │    REST API │(JSON over    │HTTP)         │
        │             │              │              │
┌───────▼─────────────▼──────────────▼──────────────▼────────────┐
│                      FASTAPI SERVER                             │
│                     (Python Backend)                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              API ENDPOINT LAYER                         │  │
│  │  • POST /upload-guideline                               │  │
│  │  • POST /submit-content                                 │  │
│  │  • GET  /submission/{id}                                │  │
│  │  • POST /approve                                        │  │
│  │  • GET  /dashboard/stats                                │  │
│  └────┬──────────────────────────┬──────────────────────────┘  │
│       │                          │                             │
│       │                          │                             │
│  ┌────▼────────────┐   ┌─────────▼─────────┐                 │
│  │  Deterministic  │   │    RAG Engine     │                 │
│  │  Rules Engine   │   │  (ChromaDB +      │                 │
│  │  (Regex-based)  │   │   Gemini 1.5 Flash)   │                 │
│  │                 │   │                   │                 │
│  │ • Banned words  │   │ • Vector search   │                 │
│  │ • Superlatives  │   │ • Embeddings      │                 │
│  │ • Disclaimers   │   │ • Semantic match  │                 │
│  │ • Formatting    │   │ • Citation link   │                 │
│  │                 │   │                   │                 │
│  │ ✓ Zero false+   │   │ ✓ Catches nuance  │                 │
│  │ ✓ Instant       │   │ ✓ Confidence      │                 │
│  └────┬────────────┘   └─────────┬─────────┘                 │
│       │                          │                             │
│       │                          │                             │
│  ┌────▼──────────────────────────▼─────────┐                 │
│  │         DATABASE LAYER (SQLite)         │                 │
│  │                                         │                 │
│  │  ┌───────────┐  ┌────────────┐  ┌────────────┐          │
│  │  │Guidelines │  │Submissions │  │Audit Flags │          │
│  │  │           │  │            │  │            │          │
│  │  │ • id      │  │ • id       │  │ • id       │          │
│  │  │ • name    │  │ • content  │  │ • type     │          │
│  │  │ • content │  │ • score    │  │ • severity │          │
│  │  │ • created │  │ • status   │  │ • citation │          │
│  │  └───────────┘  └────────────┘  └────────────┘          │
│  └─────────────────────────────────────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
         │                          │
         │                          │
   ┌─────▼─────┐            ┌───────▼───────┐
   │  Gemini   │            │   ChromaDB    │
   │    API    │            │Vector Storage │
   │           │            │               │
   │ Gemini 1.5 Flash    │            │  Embeddings   │
   │ mini +    │            │  + Metadata   │
   │ Embeddings│            │               │
   └───────────┘            └───────────────┘
```

---

## 🔄 Data Flow

### 1. Upload Guideline Flow
```
User selects PDF
    ↓
Frontend → POST /api/upload-guideline
    ↓
Backend receives file
    ↓
├─→ Extract text (PyPDF2)
├─→ Store in Database (SQLite)
├─→ Parse deterministic rules (regex)
└─→ Create embeddings (Gemini embedding-001, 3072-dim)
    ↓
    Store vectors in ChromaDB
    ↓
    Return guideline_id + rules_count
    ↓
Frontend shows success
```

### 2. Content Audit Flow
```
User pastes content
    ↓
Frontend → POST /api/submit-content
    ↓
Backend receives content
    ↓
├─→ Deterministic Check (instant)
│   ├─→ Regex pattern matching
│   ├─→ Banned words detection
│   ├─→ Formatting validation
│   └─→ Generate flags with citations
│
└─→ Semantic Check (2-5 seconds)
    ├─→ Generate content embedding
    ├─→ ChromaDB similarity search
    ├─→ Retrieve top 10 relevant rules
    ├─→ Gemini 1.5 Flash analyzes against rules
    └─→ Generate flags with citations
    ↓
Combine flags from both engines
    ↓
Calculate Brand Trust Score
    ↓
Store submission + flags in Database
    ↓
Return audit response
    ↓
Frontend displays results
```

### 3. Approval Flow
```
User reviews flagged content
    ↓
Selects action: Approve/Request Changes/Reject
    ↓
Frontend → POST /api/approve
    ↓
Backend updates submission status
    ↓
Store reviewer comment
    ↓
Return success
    ↓
Frontend shows confirmation
```

---

## 🧩 Component Details

### Frontend Components

#### Pages (Next.js App Router)
```
app/
├── page.tsx              # Home dashboard
├── upload/
│   └── page.tsx          # Guideline upload
├── submit/
│   └── page.tsx          # Content submission
└── review/
    └── page.tsx          # Review & approval
```

**Key Features:**
- TypeScript for type safety
- Tailwind CSS for styling
- Client-side state with React hooks
- LocalStorage for demo (would use API in production)

#### Reusable Components (conceptual)
```
components/
├── FlagCard.tsx          # Display individual violation
├── TrustScoreBadge.tsx   # Show 0-100 score
├── SeverityBadge.tsx     # Critical/Warning/Suggestion
└── LoadingSpinner.tsx    # Loading states
```

### Backend Components

#### API Layer (main.py)
```python
@app.post("/api/upload-guideline")
async def upload_guideline(file: UploadFile)
    # Parse file → Index rules → Return ID

@app.post("/api/submit-content")
async def submit_content(submission: ContentSubmission)
    # Run both engines → Combine flags → Calculate score

@app.post("/api/approve")
async def approve_content(request: ApprovalRequest)
    # Update status → Store comment → Return success
```

#### Deterministic Engine (deterministic.py)
```python
class DeterministicEngine:
    def __init__(self):
        self.rules = {
            "banned_words": [...],
            "superlatives": [...],
            "required_disclaimers": [...],
            "formatting": [...]
        }
    
    def check(self, content: str) -> List[Dict]:
        # Regex pattern matching
        # Returns violations with exact citations
```

**Pros:**
- ✓ Zero false positives (explicit rules)
- ✓ Instant results (no API calls)
- ✓ Explainable (regex patterns)
- ✓ High confidence (always "high")

**Cons:**
- ✗ Can't catch semantic issues
- ✗ Requires manual rule creation

#### RAG Engine (rag_engine.py)
```python
class RAGEngine:
    def __init__(self):
        self.chroma_client = chromadb.Client()
        self.gemini_client = genai.Client()
    
    def index_guideline(self, id: str, text: str):
        # Chunk text → Generate embeddings → Store in ChromaDB
    
    def check_content(self, content: str) -> List[Dict]:
        # Embed content → Search similar rules → Gemini 1.5 Flash analysis
```

**Pros:**
- ✓ Catches semantic violations
- ✓ Understands context and nuance
- ✓ Links to relevant guideline sections
- ✓ Adapts to any guideline automatically

**Cons:**
- ✗ 2-5 second latency (Gemini API)
- ✗ Costs per request
- ✗ Confidence varies (0.6-1.0)

#### Database Layer (database.py)
```python
class Database:
    def store_guideline(self, name, content)
    def store_submission(self, content, type, creator)
    def store_audit_results(self, submission_id, flags, score)
    def get_submission(self, id)
    def update_submission_status(self, id, action, comment)
```

**Schema:**
```sql
CREATE TABLE guidelines (
    id TEXT PRIMARY KEY,
    filename TEXT,
    content BLOB,
    uploaded_at TIMESTAMP
);

CREATE TABLE submissions (
    id TEXT PRIMARY KEY,
    content TEXT,
    content_type TEXT,
    creator_name TEXT,
    trust_score INTEGER,
    status TEXT,  -- pending/approved/rejected/changes_requested
    reviewer_comment TEXT,
    submitted_at TIMESTAMP
);

CREATE TABLE audit_flags (
    id TEXT PRIMARY KEY,
    submission_id TEXT,
    issue_type TEXT,
    severity TEXT,
    flagged_text TEXT,
    rule_citation TEXT,
    explanation TEXT,
    suggested_fix TEXT,
    confidence TEXT,
    FOREIGN KEY (submission_id) REFERENCES submissions(id)
);
```

---

## 🎯 Key Algorithms

### 1. Text Chunking (RAG Engine)
```python
def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    """
    Split guideline into overlapping chunks
    Overlap ensures context isn't lost at boundaries
    """
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks
```

### 2. Brand Trust Score Calculation
```python
def calculate_trust_score(flags: List[Dict]) -> int:
    """
    Base score: 100
    Deductions:
      - Critical: -15 points
      - Warning: -5 points
      - Suggestion: -2 points
    Minimum: 0
    """
    score = 100
    for flag in flags:
        if flag['severity'] == 'critical':
            score -= 15
        elif flag['severity'] == 'warning':
            score -= 5
        elif flag['severity'] == 'suggestion':
            score -= 2
    return max(0, score)
```

### 3. Semantic Similarity Search
```python
def retrieve_relevant_rules(guideline_id: str, content: str, top_k: int = 5):
    """
    1. Generate embedding for submitted content
    2. Query ChromaDB for top-k similar guideline chunks
    3. Return chunks with similarity scores (used as confidence)
    """
    query_embedding = client.models.embed_content(
        model="text-embedding-3-small",
        input=content
    )
    
    results = chroma_collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )
    
    return [{
        "rule_text": doc,
        "citation": f"Guideline Section {idx}",
        "similarity_score": 1 - distance  # Convert distance to similarity
    } for idx, (doc, distance) in enumerate(zip(results['documents'], results['distances']))]
```

---

## 🔐 Security Considerations

### Current (Demo)
- ✓ CORS enabled (restricted in production)
- ✓ Pydantic validation on all inputs
- ✓ File type validation (PDF/TXT/DOCX only)
- ✗ No authentication (demo users)
- ✗ No rate limiting
- ✗ No input sanitization beyond Pydantic

### Production Recommendations
```python
# Add rate limiting
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@limiter.limit("10/minute")
@app.post("/api/submit-content")
async def submit_content(...):
    pass

# Add authentication
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Sanitize inputs
import bleach
clean_content = bleach.clean(user_content)

# Restrict CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://veribrand-kr8.vercel.app"],  # Specific domain
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Only needed methods
    allow_headers=["*"],
)
```

---

## 📊 Performance Characteristics

### Response Times (Estimated)
| Endpoint | Time | Bottleneck |
|----------|------|------------|
| Upload guideline | 2-5s | Gemini embeddings (embedding-001) |
| Submit content (deterministic only) | <100ms | Regex matching |
| Submit content (deterministic + RAG) | 3-8s | Gemini API call |
| Approve/reject | <50ms | Database write |
| Get submission | <20ms | Database read |

### Scalability
- **Deterministic**: O(n) where n = content length, linear scale
- **RAG**: O(k) where k = chunk count, scales with guideline size
- **Database**: SQLite suitable for <10k submissions, then migrate to PostgreSQL

### Cost Analysis (per 1000 audits)
```
Gemini Costs:
- Embeddings (text-embedding-3-small): $0.02 per 1M tokens
  → Guideline upload (5k tokens): $0.0001
  → Content audit (1k tokens per query): $0.00002
  
- gemini-3.5-flash-lite: $0.15 per 1M input tokens, $0.60 per 1M output
  → Audit analysis (500 input + 200 output tokens): $0.00019
  
Total per audit: ~$0.0002 = $0.20 per 1000 audits

ChromaDB: Free (self-hosted)
FastAPI: Free (open-source)
Next.js: Free (Vercel has free tier)

Estimated monthly cost for 50k audits: $10 Gemini + $20 hosting = $30/mo
```

---

## 🧪 Testing Strategy

### Unit Tests (Planned)
```python
# test_deterministic.py
def test_banned_words_detection():
    engine = DeterministicEngine()
    content = "This is the best product guaranteed!"
    flags = engine.check(content)
    assert len(flags) == 2  # "best" and "guaranteed"

# test_rag_engine.py
def test_guideline_indexing():
    engine = RAGEngine()
    count = engine.index_guideline("test", "Never use 'free'")
    assert count > 0
```

### Integration Tests
```python
# test_api.py
def test_upload_and_audit_flow():
    # Upload guideline
    response = client.post("/api/upload-guideline", files={"file": guideline_pdf})
    assert response.status_code == 200
    guideline_id = response.json()["guideline_id"]
    
    # Submit content
    response = client.post("/api/submit-content", json={
        "content": "This is guaranteed the best!",
        "content_type": "text"
    })
    assert response.status_code == 200
    assert response.json()["total_issues"] > 0
```

### Manual Testing Checklist
- [ ] Upload PDF guideline → Rules extracted
- [ ] Upload TXT guideline → Rules extracted
- [ ] Submit bad content → Flags shown
- [ ] Submit good content → No/few flags
- [ ] Approve content → Status updated
- [ ] Reject content → Status updated
- [ ] Dashboard loads → Stats displayed

---

## 🔄 Future Architecture Improvements

### Phase 2: Production Scale
```
Replace:
  SQLite → PostgreSQL (better concurrency)
  Gemini → Self-hosted LLM (cost reduction)
  ChromaDB → Pinecone/Weaviate (managed vector DB)
  
Add:
  Redis (caching + session management)
  Celery (background job processing)
  Nginx (load balancing)
  Auth0 (authentication)
```

### Phase 3: Enterprise Features
```
Add:
  Multi-tenancy (separate guidelines per client)
  Role-based access control
  Webhook notifications
  Real-time collaboration (WebSockets)
  Advanced analytics (Elasticsearch)
  CDN for static assets
```

---

**Architecture Version**: 1.0
**Last Updated**: Day 1 Complete
**Status**: ✅ Core architecture implemented and documented
