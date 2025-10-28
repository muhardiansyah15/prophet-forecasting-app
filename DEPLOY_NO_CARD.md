# Deploy to Render (No Credit Card Required)

## 🎯 **Step-by-Step Render Deployment**

### 1. **Create Render Account**
- Visit: https://render.com
- Sign up with **GitHub account** (no credit card needed)
- Verify email

### 2. **Deploy Backend**
- Click **"New"** → **"Web Service"**
- Connect GitHub repo: `muhardiansyah15/prophet-forecasting-app`
- **Settings**:
  ```
  Name: prophet-forecasting-api
  Root Directory: backend
  Environment: Python 3
  Build Command: pip install -r requirements.txt
  Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
  ```
- Click **"Create Web Service"**
- Your API will be: `https://prophet-forecasting-api.onrender.com`

### 3. **Update Frontend Config**
- Edit `.env.production`:
  ```
  REACT_APP_API_URL=https://prophet-forecasting-api.onrender.com
  ```
- Commit and push to GitHub

### 4. **Enable GitHub Pages**
- Go to repo **Settings** → **Pages**
- Source: **GitHub Actions**
- Auto-deploys on push!

## 🎉 **Final URLs:**
- **Frontend**: https://muhardiansyah15.github.io/prophet-forecasting-app
- **Backend**: https://prophet-forecasting-api.onrender.com

## ⚠️ **Render Free Tier Notes:**
- Backend sleeps after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- Perfect for demos and personal projects
- **No credit card required ever!**

## 🔄 **Alternative: Vercel (No Card)**
If you prefer single platform:
1. Deploy to Vercel (connect GitHub)
2. Use Vercel Functions for backend
3. Everything in one place!