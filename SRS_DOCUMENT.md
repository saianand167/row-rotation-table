# Software Requirements Specification (SRS)
## Project: CSE5 Row Rotation Table (RRT)

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to specify the software requirements for the **Row Rotation Table (RRT)** application. This app is designed for classroom seating management, rotating students through rows according to predefined patterns, displaying custom announcements, and giving the instructor full manual override controls.

### 1.2 Scope
RRT consists of:
1. A **Student View** (public web interface) showing current row assignments, tomorrow's seating preview, and active announcements.
2. An **Admin Panel** (password-protected) allowing the classroom administrator to shift active rotation days, pause auto-rotations, add calendar leave days, and customize seat arrangements.

---

## 2. Overall Description

### 2.1 Product Perspective
RRT replaces manual physical seating charts. It is built as a split-architecture Web Application:
* **Frontend UI:** Built in React, compiled to static HTML/JS, and deployed to Vercel.
* **Backend API:** Built in Express, providing CRUD APIs, connected to MongoDB Atlas.

### 2.2 Product Functions
* **Automatic Day Progression:** Calculates the active rotation day based on calendar time, skipping holidays and leave days.
* **Student View Table:** Visualizes seats in a grid (e.g. Columns G1, G2, G3, G4, B1, B2).
* **Announcement Banner:** Displays alerts created by the administrator.
* **Leave Day Tracker:** Prevents automatic progression on days declared as holidays/leave.
* **Custom Arrangement Overrides:** Allows administrators to swap specific student seats on any given rotation day.

---

## 3. Specific Requirements

### 3.1 Interface Requirements
* **Theme:** The application forces a bright/light theme across all pages for optimal classroom visibility.
* **Navbar:** Provides clean links to "Home", "Today" (quick view), and "Admin Login".

### 3.2 Functional Requirements

#### 3.2.1 Student View (Home Page)
* **FR-1:** Show active seating plan for the current day.
* **FR-2:** Show preview of tomorrow's seating plan.
* **FR-3:** Render countdown timer displaying the hours/minutes remaining until the next rotation change.
* **FR-4:** Display an announcement banner at the top of the page if enabled by the administrator.

#### 3.2.2 Admin Panel
* **FR-5:** Access to `/admin` must require password verification.
* **FR-6:** Admins must be able to change the default day (1 to 24) manually.
* **FR-7:** Admins must be able to pause/resume automatic day progression.
* **FR-8:** Admins must be able to add or delete leave dates (YYYY-MM-DD format).
* **FR-9:** Admins must be able to override seating orders for individual days and reset them back to defaults.

---

## 4. Non-Functional Requirements

### 4.1 Security
* **Access Control:** Sensitive APIs require authorization via the `x-admin-pin` request header.
* **CORS Policy:** Cross-Origin requests are restricted to the authorized frontend domain (`https://row-rotation-table.vercel.app`) in production to block external scrapers/scripts.

### 4.2 Usability & Compatibility
* **Responsive Layout:** The interface scales responsively for smartphones, tablets, laptops, and projectors.
* **Theme Uniformity:** Always bright theme removes dark-mode switches to maintain structural simplicity.
