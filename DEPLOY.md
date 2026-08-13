# 🚀 CSE5 RRT & To-Do System — Redeployment Guide

**Stack:** Vercel (frontend) + Render (backend) + MongoDB Atlas (database)

---

## 📌 Summary of What to Update for Redeployment

Since you already deployed previously, you just need to:
1. **Push your updated code to GitHub**.
2. **Add 3 new Environment Variables** in your **Render** backend dashboard.
3. **Trigger Redeploy** on Render & Vercel.

---

## Step 1 — Push Updated Code to GitHub

Open your terminal in the project root folder and push your code:

```bash
git add .
git commit -m "Update: Added To-Do system, Critical Admin panel, IP tracking & contrast fixes"
git push origin main
```

*(Vercel and Render will auto-detect the git push and start building).*

---

## Step 2 — Update Environment Variables on Render (Backend)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click on your backend web service (e.g. `cse5-rrt-api`).
3. Go to **Environment** tab on the left menu.
4. Make sure all of the following variables are present:

| Environment Variable | Value / Description | Action Needed |
| :--- | :--- | :--- |
| `MONGO_URI` | Your MongoDB Atlas connection string | Already set |
| `FRONTEND_URL` | `https://cse5-rrt.vercel.app` *(Your Vercel URL)* | Already set |
| `ADMIN_PIN` | `CSE5@123` *(RRT PIN)* | Already set |
| `NODE_ENV` | `production` | Already set |
| **`JWT_SECRET`** | `prod-secret-key-make-it-long-32chars` | ➕ **Add New** |
| **`JWT_CRITICAL_SECRET`** | `prod-critical-admin-secret-key` | ➕ **Add New** |
| **`CRITICAL_ADMIN_PASSWORD`** | `critical123` *(Or your custom password)* | ➕ **Add New** |

5. Click **Save Changes**.
6. Render will automatically trigger a new deployment. Wait ~1-2 minutes until status turns to **Live**.

---

## Step 3 — Verify Environment Variables on Vercel (Frontend)

1. Log in to [Vercel Dashboard](https://vercel.com).
2. Open your project (e.g. `cse5-rrt`).
3. Go to **Settings** → **Environment Variables**.
4. Confirm `VITE_API_URL` is set to your Render backend API URL:
   ```text
   VITE_API_URL = https://cse5-rrt-api.onrender.com/api
   ```
5. If you changed it, click **Redeploy** from the Deployments tab.

---

## Step 4 — Post-Redeployment Verification Checklist

Once both builds complete:

- [ ] **Open Vercel URL**: `https://cse5-rrt.vercel.app`
- [ ] **Test Double-Tap Logo Trigger**: Double-tap / double-click the **CSE5 RRT** logo in the top navbar to open Critical Admin (`/critical-admin`).
- [ ] **Critical Admin Login**: Log in with your `CRITICAL_ADMIN_PASSWORD` (e.g., `critical123`).
- [ ] **Test To-Do System**: Click **To-Do** in the navbar → Register a user → Create tasks → Generate weekly plan.
- [ ] **Inspect User Tasks**: Go to Critical Admin → Users → Click **Inspect Tasks** to see tasks created by the user.
- [ ] **Check Visitor IP Logs**: Go to Critical Admin → Visitor IPs to verify live IP address tracking.
- [ ] **Check Navbar**: Verify **Admin** is centered in the navbar and 3-dots menu is removed.
