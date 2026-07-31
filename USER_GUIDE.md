# 📘 CSE5 Row Rotation Table (RRT) – Complete Guide

> [!NOTE]
> ☀️ **For the best visual experience, please view this application in Light Mode.**

---

## 👩‍🎓 Student Side

* **No login required** – simply open the Home page.
* **Seating follows a 24-Day Rotation Cycle** (Day 1 → Day 24 → Day 1 → Repeat).
* **Each day has 6 rows:**
  * **G1, G2, G3, G4** → Girls (💖 Pink)
  * **B1, B2** → Boys (💙 Blue)
* **Row 1** is the front and **Row 6** is the back.
* **Rotation advances only on active school days.**
* **Sundays and Admin-added Leave Days** are automatically skipped.
* **On holidays,** students will see **"Holiday – No Class"** instead of seating.
* **Home page shows:**
  * 📢 Announcement (if published)
  * ⏸️ Pause warning (if rotation is paused)
  * 📅 Current Rotation Day & Date
  * 🪑 6 Seating Cards (Row 1–6)
  * ⏳ Countdown to next rotation
  * 📍 Day X of 24
* **Navigation buttons:**
  * **Yesterday** → Previous day's seating
  * **Today** → Live seating
  * **Tomorrow** → Next active day's seating
  * **Day After** → Preview two active days ahead
* **Data refreshes automatically** every 60 seconds.
* **If Connection Error appears,** the backend server is not running.

---

## 👨‍💼 Admin Side

* **Admin panel is password protected.**
* **View dashboard:** The current rotation day, leave days, rotation status, and announcement status are displayed.
* **Day Override:** Instantly set the rotation to any day (1–24).
* **Pause / Resume Rotation:** Pause automatic daily rotation and resume it later from the same day.
* **Leave Days:** Add or remove holidays; rotation skips those dates automatically.
* **Announcements:** Publish, update, or remove announcements shown to students on the Today page.
* **Seating Editor:** Customize seating for any rotation day by assigning G1–G4 and B1–B2 to the six rows. Each code must be used exactly once. Reset to Default restores the original layout.

---

## ✨ Additional Features & Architectural Highlights

1. **Dynamic Navigation Preview:** Look ahead at the next day's layout or view yesterday's layout instantly without altering the main database day pointer.
2. **Database Singleton Optimization:** Uses a single, high-performance configuration document in MongoDB Atlas to store class variables, minimizing cluster database operations.
3. **Environment-Level Credentials:** Production passwords are set via secret system configurations on Render, keeping them completely safe from plaintext code leaks.
4. **Intelligent Date Calculations:** Smart date comparison algorithms auto-skip calendar holidays, weekends, and customized leave periods.
5. **Real-Time Input Validation:** The seating configuration editor performs real-time deduplication to prevent accidental double-assignment of seat codes.
6. **Optimized Build Size:** Compiled using Vite 6 to create lightweight static assets, ensuring the page loads instantly even on poor mobile connections.
7. **Production CORS Safeguards:** Implements a strict domain policy protecting the backend API from unauthorized external requests.
8. **Automatic Connection Recovery:** The client automatically reconnects and updates the user interface when the backend server recovers from a system restart.
