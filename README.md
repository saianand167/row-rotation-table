# 🪑 RRT — Row Rotation Table

A real-time, automated classroom seating rotation system with a premium dashboard UI.

## Features

- **24-Day Rotation Cycle** — Predefined seating arrangements that auto-advance daily
- **Student Dashboard** — Instant view of today's seating with color-coded cards
- **Admin Panel** — Day override, leave days, announcements, pause/resume
- **Countdown Timer** — Live countdown to the next rotation
- **Dark/Light Mode** — Premium dark theme with glassmorphism effects
- **Mobile Responsive** — Works on all devices

## Tech Stack

- **Frontend**: Vite + React 19 + Tailwind CSS v4
- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose)

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd backend
npm install
node server.js
```

The backend runs on **http://localhost:5000**.

> Set `MONGO_URI` env variable if using MongoDB Atlas:
> ```
> set MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/rrt
> ```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on **http://localhost:3000**.

## Admin Access

Default PIN: `1234`

Navigate to `/admin` in the app to access the admin panel.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rotation` | GET | Current rotation state |
| `/api/admin/verify` | POST | Verify admin PIN |
| `/api/admin/set-day` | POST | Set rotation day (1–24) |
| `/api/admin/leave-days` | GET/POST/DELETE | Manage leave days |
| `/api/admin/announcement` | POST | Set/clear announcement |
| `/api/admin/pause` | POST | Pause/resume rotation |
| `/api/admin/state` | GET | Full admin state |
