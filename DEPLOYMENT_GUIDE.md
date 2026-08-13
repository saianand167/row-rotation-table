# 🚀 Complete Production Deployment & Redeployment Guide

**Stack:** Vercel (Frontend) + Render (Backend) + MongoDB Atlas (Database)

---

## 🔄 How to Redeploy (If already deployed before)

Since you already have Vercel & Render set up, redeploying takes 3 simple steps:

### Step 1 — Push your new code to GitHub
```bash
git add .
git commit -m "Update: Added To-Do module, Critical Admin, Visitor IP logs, logo double-tap trigger"
git push origin main
```

### Step 2 — Add 3 New Environment Variables in Render Dashboard
Go to **Render Dashboard** → Your Backend Web Service → **Environment** tab → Add these 3 new keys:

| Key | Example Value |
| :--- | :--- |
| `JWT_SECRET` | `prod-secret-key-make-it-long-32chars` |
| `JWT_CRITICAL_SECRET` | `prod-critical-admin-secret-key` |
| `CRITICAL_ADMIN_PASSWORD` | `critical123` |

Click **Save Changes** (Render will redeploy automatically).

---

## 🆕 Full Fresh Deployment (First Time Setup)

If you are setting up a fresh deployment from scratch:

### 1. MongoDB Atlas (Database)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create an M0 free cluster.
3. Under **Database Access**, create a user & password.
4. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Copy your connection string:
   `mongodb+srv://<username>:<password>@cluster0.mongodb.net/rrt?retryWrites=true&w=majority`

### 2. Backend on Render
1. Create a **New Web Service** connected to your repo.
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Add Environment Variables:
   - `MONGO_URI` = your Atlas connection string
   - `FRONTEND_URL` = `https://your-app.vercel.app`
   - `ADMIN_PIN` = `CSE5@123`
   - `JWT_SECRET` = `prod-secret-key-make-it-long-32chars`
   - `JWT_CRITICAL_SECRET` = `prod-critical-admin-secret-key`
   - `CRITICAL_ADMIN_PASSWORD` = `critical123`
   - `NODE_ENV` = `production`

### 3. Frontend on Vercel
1. Import project in [Vercel](https://vercel.com).
2. Set **Root Directory**: `frontend`
3. Set **Framework Preset**: `Vite`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
5. Click **Deploy**.
