# Shield Client Issue Tracker

A premium modern SaaS platform designed to let clients monitor their website statuses, submit support requests, communicate with management teams, and track ticket resolutions. Support managers can prioritize, triage, and resolve client tickets with an AI-assisted workspace and a complete audit trail.

---

## 🚀 Key Features

*   **Website Status Monitor**: Dashboard displaying checked domains with live-updating incident flags and issue tallies.
*   **AI Auto-Classification**: An AI-assisted form analyzer that classifies reported issues into matching categories (`BUG`, `FEEDBACK`, `SUGGESTION`, `IMPROVEMENT`) and recommends severities (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
*   **Dynamic Response Generator**: Auto-draft generator for support managers to quickly craft polite and professional client responses.
*   **Chronological Timeline Event System**: Complete log tracking (ticket creation, status/severity updates, manager responses, resolutions) providing full lifecycle transparency.
*   **In-App Notifications**: Client alert inbox triggering real-time flags upon issue resolutions.
*   **Role-Based Access Control**: Route protection and layout structures tailored for Clients and Managers.

---

## 🛠️ Technology Stack

*   **Core**: Next.js 15+ (App Router), TypeScript, Tailwind CSS v4.0.0
*   **Authentication**: NextAuth.js (Credentials Provider)
*   **ORM**: Prisma 7
*   **Database**: SQLite (configured for easy production PostgreSQL swap)
*   **AI Engine**: OpenAI SDK

---

## 📂 Project Structure

```
├── prisma
│   ├── migrations/       # Database migration SQL logs
│   ├── schema.prisma     # SQLite schemas
│   └── seed.ts           # Seeder script for demo data
├── src
│   ├── app
│   │   ├── (authenticated)
│   │   │   ├── dashboard # Status dashboard view
│   │   │   ├── issues    # Incidents index & detail forms
│   │   │   └── notifications # Alert box view
│   │   ├── api           # Next.js Route Handler APIs
│   │   ├── login         # Auth page wrapped in Suspense
│   │   └── layout.tsx    # Root layout configuration
│   ├── components
│   │   ├── ui/           # Shared interface wrappers
│   │   ├── DashboardLayout.tsx  # Dynamic navigation shell
│   │   └── Providers.tsx        # Session wrappers
│   ├── lib
│   │   ├── ai.ts         # AI helper (OpenAI / Heuristics)
│   │   ├── authOptions.ts       # NextAuth configurations
│   │   └── db.ts         # Prisma singleton adapter
│   └── types
│       └── next-auth.d.ts # Custom auth types
```

---

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js**: `v20` or higher (we used `v24.15.0`)
- **NPM**: `v10` or higher

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add the following settings:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="some-super-secret-key-for-local-development-123456"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Add your OpenAI API key for live AI completions.
# If omitted, the application will seamlessly fall back to local rule-based heuristics.
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Database Setup & Seeding
Initialize SQLite migrations and run the seeder:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Running the Application
Launch the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts

To quickly test different dashboards and capabilities, use the quick login buttons on the `/login` page or use the credentials below:

*   **Client Account**
    *   **Email**: `client@test.com`
    *   **Password**: `password123`
    *   **Role**: CLIENT (can view/report issues and manage alert notifications)

*   **Manager Account**
    *   **Email**: `manager@test.com`
    *   **Password**: `password123`
    *   **Role**: MANAGER (can edit all issues, change severities/statuses, and draft AI responses)

---

## 📌 Assumptions Made

*   **Mock Authentication**: Authentication uses bcrypt-based credentials with NextAuth.js CredentialsProvider. No OAuth/SSO integrations are included. Demo accounts are pre-seeded for quick evaluation.
*   **Website Monitoring**: Website status data (ONLINE, DOWN, DEGRADED, UNKNOWN) uses mock seed data rather than real HTTP ping checks or uptime monitoring. In production, this would be replaced by a background job performing real health checks.
*   **Database Choice**: SQLite was chosen for local development simplicity and zero-configuration setup. The Prisma schema is SQL-standard and designed for a seamless swap to PostgreSQL in production environments.
*   **In-App Notifications Only**: Notifications are implemented as in-app alerts (displayed in a Notification Center page with sidebar badge). Email or SMS notifications are not implemented but could be added via services like SendGrid or AWS SES.
*   **AI Integration is Optional**: The OpenAI API key is optional. When absent, the application gracefully degrades to a local keyword-based heuristic engine for issue classification and template-based response drafting.
*   **Single Tenant**: The current implementation assumes a single-tenant model. Multi-tenancy (multiple clients with separate data isolation) would require additional schema design.
*   **No File Uploads**: Issue reporting does not support file/screenshot attachments. This would be a natural extension using cloud storage (S3, Cloudflare R2).

---

## 🔔 Notification Implementation

The notification system uses **in-app notifications** stored in the database:

*   **When Triggered**: Notifications are automatically created when:
    *   A manager changes an issue status to **RESOLVED** — the client who reported the issue receives a notification.
    *   A manager **adds a comment/response** to an issue — the client is notified of the new response.
*   **Delivery**: Notifications appear in the Notification Center (`/notifications`) page and are indicated by a badge counter in the sidebar navigation.
*   **Polling**: The sidebar polls for unread notification count every 15 seconds to provide near-real-time badge updates.
*   **Mark as Read**: Users can mark individual notifications or all notifications as read.
*   **Design Decision**: In-app notifications were chosen over email for simplicity and instant visibility within the platform. In production, this would be extended with email notifications (via SendGrid/SES) and optionally WebSocket-based real-time push.
