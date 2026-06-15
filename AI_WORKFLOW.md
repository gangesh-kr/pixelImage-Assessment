# AI Workflow & Development Process

This document describes how AI-assisted tools were used during the development of the Shield Client Issue Tracker, as well as the AI features integrated into the product itself.

---

## 🛠️ Tools Used During Development

*   **Gemini (Google)** — Used as the primary AI pair-programming assistant for architecture planning, code generation, and code review.
*   **GitHub Copilot** — Used for inline code completions and boilerplate acceleration within the IDE.

---

## 💬 Example Prompts Used During Development

### Architecture & Planning
```
"Design a database schema for a client issue tracker with support for 
websites, issues, comments, timeline events, and notifications. 
Use Prisma with SQLite. Include proper relations and cascade deletes."
```

### Component Generation
```
"Create a Next.js App Router page for creating issues. It should have 
fields for title, description, website selection, category (BUG/FEEDBACK/
SUGGESTION/IMPROVEMENT), and severity (LOW/MEDIUM/HIGH/CRITICAL). 
Include an AI classification button that calls /api/ai to auto-fill 
category and severity."
```

### API Route Implementation
```
"Write a PATCH API route for updating issue status and severity. 
Only managers can update severity. Clients can only close their own issues. 
Create timeline events for each change. If status changes to RESOLVED, 
create a notification for the issue creator. Use Prisma transactions."
```

### AI Integration
```
"Create an AI service module that calls OpenAI gpt-4o-mini to classify 
issue descriptions into category and severity. Include a fallback 
heuristic engine using keyword matching when no API key is configured."
```

### Styling & UX
```
"Style the login page with a dark theme inspired by pixel-future.com. 
Use glassmorphism effects, gradient text, and violet/purple accent colors. 
Include quick-login buttons for demo client and manager accounts."
```

### Code Review & Debugging
```
"Review this middleware file for Next.js 16. It's not being executed — 
what's wrong with the export naming and file location?"
```

---

## 🔄 Reflection

### How AI Assisted the Workflow

AI tools significantly accelerated development across several areas:

1.  **Boilerplate Reduction**: Repetitive patterns like API route handlers (auth checks, Zod validation, Prisma queries, error responses) were generated quickly and consistently across all endpoints.
2.  **Schema Design**: The initial database schema was drafted by AI and then refined manually to add proper cascade deletes, indexes, and relation naming.
3.  **UI Consistency**: AI-generated Tailwind class strings helped maintain a consistent design language across components, particularly for the color-coded status badges and severity indicators.
4.  **AI Prompt Engineering**: The AI prompts for the product's classification and response generation features were iteratively refined with AI assistance to reduce hallucination and enforce strict JSON output.

### Where Manual Intervention Was Required

1.  **NextAuth Configuration**: The JWT callback typing, session extension, and `next-auth.d.ts` module augmentation required manual debugging due to TypeScript strictness and NextAuth's complex type system.
2.  **Prisma Better-SQLite3 Adapter**: Configuration of the `PrismaBetterSqlite3` adapter with the correct driver setup required manual research, as this is a newer Prisma feature not well-covered in AI training data.
3.  **Middleware File Naming**: The AI initially generated middleware with incorrect export naming (`proxy` instead of `default`) — this was caught during code review and manually corrected.
4.  **Hydration Warnings**: Date formatting with `toLocaleString()` caused React hydration mismatches between server and client. Manual addition of `suppressHydrationWarning` was needed on each date element.
5.  **Design Polish**: While AI generated functional layouts, manual refinement was needed for spacing, micro-animations, hover effects, and the overall "premium feel" to match pixel-future.com quality.

### Key Learnings

1.  **AI excels at structured, pattern-heavy code** — API routes, database queries, and form components are ideal candidates for AI generation since they follow consistent patterns.
2.  **AI struggles with framework-specific edge cases** — New framework versions (Next.js 16, Prisma 7) have API changes that AI may not know about. Always verify against current documentation.
3.  **Prompt specificity matters** — Vague prompts produce generic code. Specifying exact constraints (role-based access, Zod schemas, Prisma transactions) produced significantly better results.
4.  **Code review is essential** — AI-generated code requires manual review for security issues (hardcoded secrets), missing edge cases, and TypeScript type safety. Automated review tools should complement AI code generation.
5.  **Heuristic fallbacks are valuable** — Designing the AI features with a fallback heuristic engine ensures the app works without external API dependencies, which is critical for demo and development environments.

---

## 🧠 Product AI Features

The application integrates AI in two key workflows:

### 1. Issue Classification (Category & Severity)

When a client creates an issue and clicks "Classify with AI", the system:
1.  Sends the issue description to `/api/ai` (action: `classify`)
2.  If an OpenAI API key is configured, calls GPT-4o-mini with a structured prompt to extract `category` and `severity`
3.  Falls back to a local keyword-matching heuristic engine if no API key is available

**Classification Prompt:**
```
You are an IT support assistant. Analyze the user's issue description and classify it.
You MUST respond with a raw JSON object containing exactly two keys:
1. "category": must be one of "BUG", "FEEDBACK", "SUGGESTION", "IMPROVEMENT"
2. "severity": must be one of "LOW", "MEDIUM", "HIGH", "CRITICAL"
```

### 2. Response Draft Generation

When a manager views a ticket and clicks "Generate AI Response", the system:
1.  Fetches the issue's full context (title, description, category, severity, status, website name)
2.  Sends it to GPT-4o-mini with a professional support manager prompt
3.  Returns a copy-ready response message tailored to the issue's current state
4.  Falls back to status-based response templates when no API key is available

Both features are designed with a graceful degradation pattern — the application is fully functional without any AI API key configured.
