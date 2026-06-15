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
