# Railway Backend Deployment Guide

## Quick Deploy to Railway

1. **Visit Railway**: https://railway.app
2. **Sign up** with your GitHub account
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select**: `muhardiansyah15/prophet-forecasting-app`
5. **Set Root Directory**: `/backend`
6. **Railway will auto-detect** Python/FastAPI

## Environment Variables (Set in Railway Dashboard)
```
PORT=8000
PYTHONPATH=/app
```

## Commands Railway will use:
- **Build**: `pip install -r requirements.txt`
- **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## Your API will be available at:
`https://[your-app-name].up.railway.app`

## Then update frontend config:
- Replace `REACT_APP_API_URL` in `.env.production`
- Push to GitHub to redeploy frontend

---

## Alternative: Deploy to Render

1. **Visit**: https://render.com
2. **New Web Service** → **Connect GitHub**
3. **Select repo**: `muhardiansyah15/prophet-forecasting-app`
4. **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: `3.11`