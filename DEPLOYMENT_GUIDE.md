# 🚀 Production Deployment Guide: CSE5 RRT

This guide provides step-by-step instructions for deploying the **CSE5 Row Rotation Table** application to production with **MongoDB Atlas**, **Render/Railway (Backend + WebSockets + Web Push)**, and **Vercel (Frontend)**.

---

## 🗄️ Step 1: Database Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a new Cluster (Free M0 Tier).
3. Under **Database Access**, create a database user (username and password).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect** → **Drivers** and copy your MongoDB Connection String:
   ```env
   mongodb+srv://<username>:<password>@cluster.mongodb.net/rrt?retryWrites=true&w=majority
   ```

---

## ⚙️ Step 2: Deploy Backend (Render / Railway)

### Option A: Render.com (Recommended Free Hosting)
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New Web Service**.
3. Connect your GitHub repository.
4. Set the **Root Directory** to `backend`.
5. Set **Build Command**: `npm install`
6. Set **Start Command**: `node server.js`
7. Add the following **Environment Variables**:

| Variable Name | Required Value / Description |
|---|---|
| `MONGO_URI` | Your MongoDB Atlas connection string from Step 1 |
| `FRONTEND_URL` | Your Vercel domain (e.g. `https://cse5-rrt.vercel.app`) |
| `ADMIN_PIN` | `CSE5@123` (or your custom admin password) |

8. Click **Create Web Service**. Copy your backend URL (e.g., `https://cse5-rrt-api.onrender.com`).

---

## 🌐 Step 3: Deploy Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**.
2. Import your GitHub repository.
3. Set **Framework Preset**: `Vite`.
4. Set **Root Directory**: `frontend`.
5. Under **Environment Variables**, add:

| Variable Name | Required Value |
|---|---|
| `VITE_API_URL` | `https://cse5-rrt-api.onrender.com/api` (Replace with your Render backend URL + `/api`) |

6. Click **Deploy**.

---

## 🔔 Step 4: Verify Web Push Notifications in Production

Once deployed:
1. Open your Vercel frontend URL on **Desktop** or **Mobile Phone** (e.g., `https://cse5-rrt.vercel.app`).
2. Accept the notification permission prompt when asked (`Allow`).
3. Open the `/admin` panel on any device.
4. Click **🔔 Test Notification** or publish an announcement.
5. You will receive native mobile status bar and desktop OS push notifications—even when the website tab is completely closed!

---

## 📋 Required Environment Variables Summary

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/rrt?retryWrites=true&w=majority
FRONTEND_URL=https://your-app.vercel.app,http://localhost:3000
ADMIN_PIN=CSE5@123
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://your-backend.onrender.com/api
```
