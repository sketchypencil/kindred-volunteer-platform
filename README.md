# ReachForward - Volunteer Sign-Up & Operations Platform

A comprehensive, role-based volunteer management and shift scheduling application built with **React 19**, **TypeScript**, and **Vite**.

Designed specifically to satisfy all criteria for community events, multi-slot scheduling, volunteer gamification, and day-of organizer operations.

---

## 🌟 Key Features

### 1. Event & Shift Management (Organization)
- **Multi-Slot Shift Scheduling**: Split events into distinct time slots (e.g., *Morning Setup: 8:00 AM – 12:00 PM*, *Afternoon Restoration: 12:30 PM – 4:30 PM*) with individual hours credits.
- **Role-Based Sign-Ups**: Instead of generic sign-ups, volunteers choose tailored roles matching their strengths (e.g., *Logistics & Gear Distribution*, *First Aid & Safety Officer*, *Trail & Riverbank Crew*, *Social Media & Photo Lead*).
- **Automated Waitlists**: When a role reaches capacity, additional volunteers enter a numbered waitlist (e.g. `Waitlist #1`). If an enrolled volunteer cancels or is rejected by an organizer, the next waitlisted volunteer is **automatically promoted** to a confirmed spot!
- **Interactive Calendar & iCal Export**: Monthly and daily shift calendar view with 1-click **Export to Apple/Outlook Calendar (`.ics` format)** and **Add to Google Calendar** integration.

### 2. Team Collaboration & Communication
- **Event Activity Feed & Discussion Thread**: Categorized discussion threads inside each event modal with tags for `🚗 Carpool`, `❓ Questions`, `📦 Logistics`, and `💬 General Discussion`. Includes like reactions and role badges.
- **Shared Resource Hub**: Section to pin essential documents (e.g., *Riverfront Restoration Zone Map & Parking Passes*, *Health & Safety Gear Guidelines*, *Liability Waivers*). Includes immediate simulated document download and organizer upload tools.
- **Broadcast Announcements**: Urgent alert dispatch tool allowing organizers to push emergency venue changes or weather delay notices across in-app notification toasts and email simulation.

### 3. Volunteer Recognition & Tracking
- **Mobile QR Code Check-In Pass**: Generates a scannable QR code on the volunteer's dashboard containing a unique token (e.g. `VOL-EVT1-SH101-UALEX-1002`) for swift check-in at the venue.
- **Automated Hours & Impact Tracker**: When volunteers are marked as attended, their service hours are calculated and credited automatically to their profile.
- **Official Digital Certificate Generator**: Print-ready, high-resolution certificate with formal borders, official seal watermark, volunteer name, hours served, event title, and signature. Includes celebratory confetti animation!
- **Badges & Milestones**: Gamification items including *First Step Champion*, *Bronze Contributor (5h)*, *Silver Contributor (10h)*, *Gold Star Ambassador (25h)*, *First Responder Hero*, *Logistics Maestro*, and *Community Pillar*.

### 4. Admin & Organizer Dashboard
- **Volunteer Verification Queue**: Review and verify applications for sensitive or specialized roles (e.g., First Aid, Heavy Equipment, Minor Supervision) with 1-click Approve or Reject.
- **Attendance Status Management**: Quick status toggles (`Registered`, `Attended`, `No-Show`, `Canceled`) with automatic hours adjustment.
- **One-Click Roster Export**: Download complete volunteer rosters with emergency contacts, shift times, and attendance status as a **CSV file** or print offline attendance sheets.
- **Venue QR Scanner Simulator**: Built-in scanning terminal with laser animation, token verification, and 1-click test buttons for testing without a physical camera.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
```bash
# Clone or navigate to the repository
cd intprog-finals

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

Visit the local development server URL (usually `http://localhost:5173/`).

### Production Build
```bash
npm run build
npm run preview
```

---

## 🧪 Testing the Core Workflows

1. **Role Switching**:
   - Use the persona switcher in the top right of the navigation bar to toggle between:
     - **Sarah Jenkins**: Organizer / Admin
     - **Alex Rivera**: Active Volunteer (First Aid Certified)
     - **Elena Vance**: Volunteer (Social Media)
     - **Marcus Brody**: Volunteer (Logistics)

2. **Automated Waitlist Promotion Demo**:
   - As a volunteer, sign up for a role that is full (e.g., in Event 1, Morning Shift, First Aid Station). You will receive **Waitlist Position #1**.
   - Switch persona to the volunteer who currently holds the spot and click **Cancel Spot**.
   - The waitlisted volunteer is immediately promoted to confirmed, and a notification toast alerts the user!

3. **Admin Verification & QR Check-in**:
   - Sign up for a role with "Approval Required" (e.g., First Aid).
   - Switch persona to **Sarah Jenkins (Admin)**.
   - Go to **Verification Queue** to view the application and click **Approve & Confirm Spot**.
   - Open **QR Scanner** in the navbar and click **Simulate Scan** for any volunteer. Attendance is marked `Attended` and hours are credited immediately!

4. **Digital Certificates**:
   - Switch to **Alex Rivera** and click **My Shifts & Badges**.
   - Under *Completed Service & Official Certificates*, click **Download Official Certificate** to view the gold-sealed certificate and celebratory confetti.
