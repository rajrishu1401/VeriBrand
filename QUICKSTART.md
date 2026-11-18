# ⚡ VeriBrand - 5-Minute Quick Start

Get VeriBrand running locally in 5 minutes.

---

## 🎯 Prerequisites Check

Before starting, verify you have:

```bash
# Check Python version (need 3.9+)
python --version

# Check Node.js version (need 18+)
node --version

# Check npm
npm --version
```

If missing, install:
- **Python**: https://www.python.org/downloads/
- **Node.js**: https://nodejs.org/ (includes npm)

---

## 🚀 Step 1: Backend Setup (2 minutes)

### Open Terminal 1

```bash
# Navigate to backend
cd C:\Users\NITRO\Desktop\VeriBrand\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies (this takes ~1 minute)
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env and add your OpenAI key
notepad .env
```

**In .env file, add**:
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
DATABASE_URL=sqlite:///./veribrand.db
CHROMA_PERSIST_DIR=./chroma_db
API_HOST=0.0.0.0
API_PORT=8000
```

### Get OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in (or create account)
3. Click "Create new secret key"
4. Copy key (starts with `sk-`)
5. Paste into `.env` file

### Start Backend Server

```bash
python main.py
```

**Expected output**:
```
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

✅ Backend is running! Keep this terminal open.

---

## 🎨 Step 2: Frontend Setup (2 minutes)

### Open Terminal 2 (new terminal)

```bash
# Navigate to frontend
cd C:\Users\NITRO\Desktop\VeriBrand\frontend

# Install dependencies (this takes ~1 minute)
npm install

# Start development server
npm run dev
```

**Expected output**:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in 2.1s
```

✅ Frontend is running!

---

## 🧪 Step 3: Test the Demo (1 minute)

### 1. Open Browser

Go to: http://localhost:3000

You should see the VeriBrand home page.

### 2. Upload Sample Guideline

- Click **"Upload Guidelines"**
- Navigate to: `C:\Users\NITRO\Desktop\VeriBrand\docs\sample_brand_guideline.txt`
- Upload the file
- See: "Guideline uploaded and indexed successfully"

### 3. Test Content Audit

- Click **"Submit Content"**
- Click **"Load Bad Example"** button
- Click **"Run Compliance Audit"**
- Wait 3-8 seconds
- See: Trust Score ~45/100 with multiple flags

### 4. Review Results

- Click **"Review & Approve/Reject"**
- See detailed flags with citations
- Select an action (Approve/Request Changes/Reject)
- Add a comment
- Submit decision
- See confirmation

✅ **Full workflow working!**

---

## 🐛 Troubleshooting

### Backend Issues

**Error: `No module named 'fastapi'`**
```bash
# Make sure virtual environment is activated
venv\Scripts\activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Error: `openai.error.AuthenticationError`**
- Check your OpenAI API key in `.env`
- Make sure key starts with `sk-`
- Verify key is valid at https://platform.openai.com/api-keys

**Error: `Port 8000 already in use`**
```bash
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Or change port in main.py:
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Frontend Issues

**Error: `Cannot find module`**
```bash
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

**Error: `Port 3000 already in use`**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or start on different port
$env:PORT=3001; npm run dev
```

**Error: `Failed to fetch` when submitting content**
- Make sure backend is running on http://localhost:8000
- Check browser console for CORS errors
- Try restarting both servers

### OpenAI Rate Limits

**Error: `Rate limit exceeded`**
- OpenAI free tier has low limits
- Upgrade to paid tier: https://platform.openai.com/account/billing
- Or wait a few minutes and try again

---

## 📊 Verify Everything Works

### Backend Health Check

Open browser: http://localhost:8000

**Expected response**:
```json
{
  "service": "VeriBrand API",
  "status": "running",
  "version": "1.0.0",
  "team": "KR8"
}
```

### API Documentation

Open browser: http://localhost:8000/docs

You should see FastAPI interactive docs with all endpoints.

### Test API Directly

```bash
# Health check
curl http://localhost:8000/

# Upload guideline (in PowerShell)
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/upload-guideline" -Method POST -InFile "C:\Users\NITRO\Desktop\VeriBrand\docs\sample_brand_guideline.txt"
$response.Content
```

---

## 🎬 Demo Script (5 minutes)

### 1. Introduction (30 sec)
"Hi, we're Team KR8. We built VeriBrand - an AI brand governance platform that catches off-brand content before publication with zero hallucination in citations."

### 2. Show Problem (30 sec)
"Current solutions are either too slow (manual checklists) or hallucinate citations (generic ChatGPT wrappers). VeriBrand solves both."

### 3. Upload Guideline (1 min)
- Navigate to `/upload`
- Upload sample guideline
- "We extract rules deterministically and create semantic embeddings"
- Show: "15 rules extracted"

### 4. Audit Bad Content (2 min)
- Navigate to `/submit`
- Load bad example
- Submit audit
- "See the Trust Score: 45/100"
- "Every flag has exact citation, severity, and suggested fix"
- Show 2-3 flags in detail

### 5. Review Workflow (1 min)
- Click "Review & Approve"
- Show decision panel
- Select "Request Changes"
- Submit
- "Content logged, creator notified"

### 6. Show Good Content (30 sec)
- Back to submit
- Load good example
- Submit
- "Trust Score: 95/100 - safe to publish"

### 7. Wrap-up (30 sec)
"VeriBrand's hybrid approach combines deterministic rules (zero false positives) with semantic RAG (catches nuance). Pre-publication workflow prevents brand damage. Thank you!"

---

## 📸 Screenshot Checklist

Take these screenshots before demo day (backup if live demo fails):

- [ ] Home page with features grid
- [ ] Upload success: "15 rules extracted"
- [ ] Submit page with bad example loaded
- [ ] Audit results: Trust Score 45/100 with flags
- [ ] Individual flag showing citation
- [ ] Review page with decision panel
- [ ] Good example: Trust Score 95/100
- [ ] Success confirmation

---

## 🔧 Development Tips

### Hot Reload

Both servers support hot reload:
- **Backend**: Changes to `.py` files auto-restart server
- **Frontend**: Changes to `.tsx` files auto-refresh browser

### View Logs

**Backend logs** (in Terminal 1):
- API requests
- Database operations
- OpenAI API calls
- Errors

**Frontend logs** (in browser console):
- API fetch calls
- React component renders
- JavaScript errors

### Database Inspection

```bash
# View SQLite database
cd backend
sqlite3 veribrand.db

# List tables
.tables

# View submissions
SELECT * FROM submissions;

# Exit
.quit
```

### Clear Data (fresh start)

```bash
# Delete databases
Remove-Item backend\veribrand.db
Remove-Item -Recurse -Force backend\chroma_db

# Restart backend
cd backend
python main.py
```

---

## 🚀 Next Steps

Once everything works locally:

1. **Test thoroughly** (Day 2)
   - Try different content types
   - Test edge cases
   - Verify all pages work

2. **Deploy** (Day 3)
   - Backend to Railway
   - Frontend to Vercel
   - See DEPLOYMENT.md

3. **Prepare demo**
   - Practice script 3+ times
   - Record backup video
   - Take screenshots

---

## 📞 Need Help?

**Common Issues**:
1. Backend won't start → Check Python version, install deps
2. Frontend errors → Delete node_modules, reinstall
3. API connection fails → Verify backend running on port 8000
4. OpenAI errors → Check API key in .env

**Team Contacts**:
- Rishu Raj: rajrishu1401@gmail.com
- Kuldeep Chaudhary: kuldeepchaudhary.0904@gmail.com
- Krishna Bhist: b.krishnaworks@gmail.com
- Daksh Mehrotra: mehrotradaksh2005@gmail.com

---

**Quick Start Version**: 1.0
**Estimated Time**: 5 minutes
**Success Rate**: 95%+ (if prerequisites met)

**Good luck! 🚀**
