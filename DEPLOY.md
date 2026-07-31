# CSE5 RRT — Deployment Guide

**Stack:** Vercel (frontend) + Render (backend) + MongoDB Atlas (database)

---

## Step 1 — MongoDB Atlas (Free M0 Cluster)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → **Create a free account**
2. Create a **free M0 cluster** (any region, e.g. `aws / ap-south-1` for India)
3. **Database Access** → Add a user (e.g. `rrt-user`) → set a strong password → save it
4. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`)
   - Render uses dynamic IPs, so whitelist all is required
5. **Connect** → Drivers → copy the connection string:
   ```
   mongodb+srv://rrt-user:<password>@cluster0.xxxxx.mongodb.net/rrt?retryWrites=true&w=majority
   ```
   Replace `<password>` with your actual password. Keep this safe.

---

## Step 2 — Deploy Backend to Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo → select `row-rotation-table` repo
3. Settings:
   | Field | Value |
   |---|---|
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
4. **Environment Variables** — add these in the Render dashboard:
   | Variable | Value |
   |---|---|
   | `MONGO_URI` | Your Atlas connection string from Step 1 |
   | `FRONTEND_URL` | `https://cse5-rrt.vercel.app` *(update after Step 3)* |
   | `ADMIN_PIN` | A strong password (e.g. `MyClass@2025!`) |
   | `NODE_ENV` | `production` |
5. Click **Deploy** → wait ~2 min → test:
   ```
   https://cse5-rrt-api.onrender.com/api/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

> **Note:** First request to Render free tier takes ~30s (cold start). This is normal.

---

## Step 3 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
2. Settings:
   | Field | Value |
   |---|---|
   | **Root Directory** | `frontend` |
   | **Framework Preset** | `Vite` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
3. **Environment Variables** — add:
   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://cse5-rrt-api.onrender.com/api` |
4. Click **Deploy** → Vercel builds and gives you a URL like:
   ```
   https://cse5-rrt.vercel.app
   ```

---

## Step 4 — Update FRONTEND_URL on Render

1. Go back to Render → your backend service → **Environment**
2. Update `FRONTEND_URL` to your actual Vercel URL
3. **Manual Deploy** → redeploy so the CORS change takes effect

---

## Step 5 — Test Everything

- [ ] Open your Vercel URL → Student view loads with today's seating
- [ ] Open `/admin` → Admin login page appears
- [ ] Login with your `ADMIN_PIN` → Admin panel opens
- [ ] Change rotation day → refresh student view → reflects the new day
- [ ] Check browser DevTools → Network tab → no CORS errors

---

## Environment Variables Reference

### Backend (set on Render)
| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `FRONTEND_URL` | Yes | Your Vercel URL (comma-separated for multiple) |
| `ADMIN_PIN` | Yes | Admin panel password |
| `NODE_ENV` | Recommended | Set to `production` |

### Frontend (set on Vercel)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Full API base URL e.g. `https://your-api.onrender.com/api` |

---

## Local Development (no changes needed)

```bash
# Terminal 1 — Backend
cd backend
node server.js          # connects to local MongoDB on port 5000

# Terminal 2 — Frontend
cd frontend
npm run dev             # starts Vite on port 3000, proxies /api to :5000
```

No `.env` file needed locally — both fall back to localhost defaults.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| CORS blocked error in browser | Check FRONTEND_URL on Render matches your exact Vercel URL |
| Backend 503 on Render | Check logs for MONGO_URI error; verify Atlas IP whitelist |
| Admin login fails on live site | Verify ADMIN_PIN env var on Render |
| /admin gives 404 on Vercel | Make sure vercel.json is in the frontend/ folder |
| Render cold start (~30s) | Upgrade to paid plan or ping /api/health every 10 min |
