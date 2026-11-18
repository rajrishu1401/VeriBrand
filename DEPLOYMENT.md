# VeriBrand Deployment Guide

## 🚀 Quick Deploy (Recommended for Hackathon Demo)

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel
```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Set project name: veribrand-kr8
# - Set as production: Yes
```

Your frontend will be live at: `https://veribrand-kr8.vercel.app`

#### Backend on Railway

1. **Create Railway account**: https://railway.app
2. **New Project** → **Deploy from GitHub**
3. **Connect your VeriBrand repo**
4. **Select backend folder** as root
5. **Add environment variables**:
   ```
   OPENAI_API_KEY=sk-your-key-here
   PORT=8000
   ```
6. **Generate Domain** (e.g., `veribrand-api.railway.app`)

7. **Update Frontend API URLs**:
   ```bash
   # In frontend, replace all localhost:8000 with your Railway domain
   # Find: http://localhost:8000
   # Replace: https://veribrand-api.railway.app
   ```

8. **Redeploy frontend** with `vercel --prod`

---

### Option 2: Render (Full Stack)

#### Backend on Render

1. Go to https://render.com
2. **New** → **Web Service**
3. Connect GitHub repo
4. Settings:
   - **Name**: veribrand-backend
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable:
   - `OPENAI_API_KEY=sk-your-key-here`
6. Deploy

#### Frontend on Render

1. **New** → **Static Site**
2. Connect GitHub repo
3. Settings:
   - **Name**: veribrand-frontend
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `.next`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL=https://veribrand-backend.onrender.com`
5. Deploy

---

## 🏠 Local Development

### Full Stack Local Setup

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
echo OPENAI_API_KEY=sk-your-key > .env
python main.py

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:3000`

---

## 🐳 Docker Deployment (Optional)

### Create Dockerfiles

**backend/Dockerfile**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**frontend/Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml** (in root):
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
```

**Run**:
```bash
docker-compose up --build
```

---

## 🌐 Environment Variables

### Backend (.env)
```env
OPENAI_API_KEY=sk-your-openai-key-here
DATABASE_URL=sqlite:///./veribrand.db
CHROMA_PERSIST_DIR=./chroma_db
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🎯 Demo Day Checklist

### Pre-Demo Setup (30 mins before)

1. **Test Full Workflow**:
   ```bash
   # Backend health check
   curl http://localhost:8000/
   
   # Expected: {"service":"VeriBrand API","status":"running"}
   ```

2. **Upload Sample Guideline**:
   - Create `demo_guideline.txt`:
     ```
     Brand Voice Guidelines:
     
     Never use: "best", "guaranteed", "free", "revolutionary"
     
     Avoid absolute claims like "always" or "never" (except in our guidelines!)
     
     Always include disclaimer: "Results may vary" when mentioning outcomes
     
     Keep tone professional - no excessive capitalization or exclamation marks
     ```
   - Upload via UI at `/upload`
   - Note the `guideline_id`

3. **Prepare Demo Content**:
   - **Bad Example**: Use the sample in README
   - **Good Example**: Use the clean sample in README

4. **Test Review Workflow**:
   - Submit bad content → See 5-8 flags
   - Submit good content → See 0-2 flags
   - Practice approval flow

5. **Screenshot Key Screens**:
   - Home dashboard
   - Upload success
   - Audit results (with flags)
   - Review page with decision
   - Use for backup if live demo fails

### During Demo (10 min presentation)

**Narrative Flow**:

1. **Problem** (1 min)
   - Show home page, explain brand governance gap
   - "Companies lose millions from off-brand content"

2. **Upload Guidelines** (2 min)
   - Navigate to `/upload`
   - Upload demo guideline
   - "We extract rules deterministically + create semantic embeddings"
   - Show success: "15 rules extracted"

3. **Submit Bad Content** (3 min)
   - Navigate to `/submit`
   - Click "Load Bad Example"
   - Submit audit
   - **Key moment**: Show flags with exact citations
   - Point out: "Every flag has confidence score + guideline citation"
   - Highlight trust score: "Score: 45/100 - needs changes"

4. **Review Workflow** (2 min)
   - Click "Review & Approve"
   - Show decision panel
   - Select "Request Changes"
   - Add comment: "Please address critical issues"
   - Submit decision

5. **Show Good Content** (1 min)
   - Back to `/submit`
   - Click "Load Good Example"
   - Submit audit
   - Show: "Score: 95/100 - safe to publish"
   - Few/no flags

6. **Differentiators** (1 min)
   - "Why VeriBrand wins:"
   - "1. Citation-anchored - no hallucinations"
   - "2. Hybrid AI - deterministic + semantic"
   - "3. Pre-publication - catch issues early"

### Backup Plan (If Something Breaks)

1. **Backend down**:
   - Use screenshots + recorded demo video
   - Walk through the flow visually
   - Explain: "In live environment, this would..."

2. **API slow**:
   - Pre-run audits before demo
   - Use localStorage to show cached results
   - Have results JSON ready to display

3. **Frontend crash**:
   - Use Postman/curl to demo backend API
   - Show raw JSON responses
   - Emphasize the AI engine still works

---

## 📊 Performance Optimization

### For Live Demo

1. **Pre-warm ChromaDB**:
   ```python
   # Run once before demo
   rag_engine = RAGEngine()
   rag_engine.index_guideline("demo", demo_guideline_text)
   ```

2. **Cache OpenAI Responses** (if needed):
   - Add Redis for response caching
   - Or: Mock OpenAI in demo with pre-recorded responses

3. **Optimize Frontend Bundle**:
   ```bash
   npm run build
   npm start  # Production mode, faster than dev
   ```

---

## 🔒 Security Notes

### Before Public Deployment

1. **Environment Variables**:
   - NEVER commit `.env` files
   - Use platform secrets (Vercel/Railway/Render)
   - Rotate OpenAI keys after hackathon

2. **CORS**:
   - Update `allow_origins` in `main.py` from `["*"]` to specific domain:
     ```python
     allow_origins=["https://veribrand-kr8.vercel.app"]
     ```

3. **Rate Limiting**:
   - Add rate limits to API endpoints
   - Prevent abuse of OpenAI API quota

4. **Input Validation**:
   - Already have Pydantic models
   - Add file size limits (currently max 10MB)

---

## 🎓 Hackathon Judge Demo Tips

1. **Start with the "Why"**:
   - "Current solutions either too slow or hallucinate citations"
   - "VeriBrand eliminates hallucination with hybrid approach"

2. **Show, Don't Tell**:
   - Live demo beats slides
   - Use the bad example to show real flags
   - Point to exact citation text

3. **Emphasize Technical Depth**:
   - "Deterministic regex catches patterns with zero false positives"
   - "RAG with ChromaDB finds semantic violations traditional rules miss"
   - "Every flag has confidence score and guideline source"

4. **Address Scale**:
   - "Demo uses SQLite, production would use PostgreSQL"
   - "ChromaDB can scale to millions of embeddings"
   - "Stateless API can scale horizontally"

5. **Highlight Team Work**:
   - "Built in 72 hours by Team KR8"
   - "Rishu: Backend, Kuldeep: Frontend, Krishna: AI, Daksh: UI/UX"
   - (Adjust based on actual contributions)

---

## 📞 Support During Hackathon

**If issues arise**:
1. Check GitHub Issues (create private repo)
2. Team Slack/WhatsApp for quick fixes
3. Have one person as "tech support" while another presents

**Critical files to backup**:
- `backend/main.py`
- `backend/rag_engine.py`
- `backend/deterministic.py`
- `frontend/app/submit/page.tsx`
- Demo guideline text
- Demo content samples

---

**Good luck Team KR8! 🚀**
