# Production Readiness Considerations

This document details critical guidelines and deployment architectures to transition the Shield Client Issue Tracker from local development to production.

---

## 🔒 Security Actions

### 1. Authentication & Session Management
- **Token Security**: NextAuth JWT tokens must use secure cookies (`__Host-` prefixes) in production environments (`process.env.NODE_ENV === 'production'`).
- **Session Lifetimes**: Reduce token lifetimes to standard 8-12 hours for sensitive operations, and implement refresh token rotation if integration points increase.
- **CSRF Mitigations**: NextAuth contains built-in double-submit cookies which must remain active. Enforce HTTPS headers (HSTS) via cloud providers.

### 2. Password Hashing & Encryption
- In development, demo passwords are encrypted using `bcryptjs` (strength: 10 rounds). In production, increase work factor to `12` rounds or transition to standard Argon2id hashes.
- Store sensitive values (API keys, NextAuth secrets) in secure Vault systems (e.g., Vercel Environment Variables, AWS Secrets Manager) rather than raw environment files.

### 3. Role-Based Access Control (RBAC)
- All API route handlers must run active checks on `session.user.role` to prevent IDOR vulnerabilities (Insecure Direct Object Reference).
- Ensure DB writes restrict modifications: e.g., clients can only toggle issues to `CLOSED` and are blocked from altering `severity` or other client tickets.

---

## 🚀 Scalability & Performance

### 1. Database Indexing
Prisma schemas should implement indexes on frequently searched parameters.
```prisma
// Example additions for schema.prisma in production:
model Issue {
  ...
  @@index([status])
  @@index([createdBy])
  @@index([websiteId])
}
```

### 2. Connection Pooling
- SQLite uses local file locks and is not suitable for horizontally scaled multi-container server nodes.
- **Migration**: Swap database provider to PostgreSQL (e.g., Neon or AWS RDS).
- Configure connection pool sizes (e.g. `?connection_limit=10`) and utilize Prisma Accelerate or pgBouncer to handle surges in serverless API instances.

### 3. Cache Layering (Redis)
- Cache static website details and status queries in a Redis layer to reduce direct database load on frequent status checks.
- Set cache-invalidation hooks on ticket statuses and comment additions.

### 4. Background Jobs & Queue Systems
- AI classifications and monitoring checks should run asynchronously.
- Transition API checks to serverless background schedulers (e.g., Inngest, Qstash, or BullMQ with Redis workers) to avoid stalling HTTP response threads.

---

## 📈 Monitoring & Logging

### 1. Structured Logging
- Replace `console.log` and `console.error` with a structured JSON logger (e.g., `pino` or `winston`).
- Log structural fields: `userId`, `action`, `statusCode`, `executionTimeMs`, and `requestId` to simplify log aggregation.

### 2. Error Tracking & APM
- Integrate **Sentry** SDK to catch client and server-side runtime exceptions.
- Configure **OpenTelemetry** with APM dashboard platforms (e.g., Datadog, New Relic) to monitor page load performance, layout shifts, and server response curves.

---

## ☁️ Deployment Architecture

### 1. Frontend Hosting (Vercel)
- Deploy the Next.js production build to Vercel for out-of-the-box edge caching, serverless route handlers, and automatic image optimizations.

### 2. Database Hosting
- Use managed PostgreSQL nodes (e.g. Neon, AWS Aurora Serverless) with active point-in-time recovery (PITR) and automated daily snapshots.

### 3. Docker Containerization
If hosting on private clouds (Kubernetes, AWS ECS), containerize the app:
```dockerfile
# Production Dockerfile Template
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🛡️ Reliability

### 1. Health Checks
- Implement a `/api/health` endpoint that validates database connectivity and returns a 200 status. Load balancers and orchestrators (Kubernetes liveness/readiness probes) should poll this endpoint.
- Monitor the health check response time — latency spikes indicate database or network degradation.

### 2. Graceful Degradation
- The AI classification and response generation features already implement a fallback pattern — if the OpenAI API is unreachable, the system switches to local heuristic processing without user-facing errors.
- Extend this pattern to other external dependencies: if the database is temporarily unavailable, return cached data or a friendly maintenance page rather than a 500 error.

### 3. Rate Limiting
- Apply rate limiting to authentication endpoints (`/api/auth/signin`) to prevent brute-force attacks. Use `express-rate-limit` or Vercel's built-in edge rate limiting.
- Rate limit the AI endpoints (`/api/ai`) to prevent abuse of OpenAI API calls — suggest 10 requests per minute per user.

### 4. Retry Logic & Circuit Breakers
- Implement exponential backoff retry for OpenAI API calls (max 3 retries with 1s, 2s, 4s delays).
- Use a circuit breaker pattern: after 5 consecutive OpenAI failures, automatically switch to the heuristic fallback for 5 minutes before retrying.

### 5. Database Backups
- Configure automated daily database backups for PostgreSQL (point-in-time recovery via managed services like Neon or AWS RDS).
- For SQLite in staging, implement periodic file-based snapshots.

---

## 🔧 Maintenance

### 1. Dependency Management
- Use `npm audit` on a weekly schedule to identify security vulnerabilities in dependencies.
- Pin major versions in `package.json` and use automated tools like Renovate or Dependabot to submit controlled dependency update PRs.
- Test dependency upgrades in a staging environment before deploying to production.

### 2. Database Migrations
- All schema changes must go through Prisma's migration system (`prisma migrate dev` in development, `prisma migrate deploy` in production).
- Never apply manual SQL changes directly to production databases.
- Include migration rollback scripts for critical schema changes.

### 3. Technical Debt Tracking
- Maintain a `TECH_DEBT.md` document tracking known shortcuts and areas for improvement.
- Current technical debt includes:
  - SQLite to PostgreSQL migration for production scaling
  - WebSocket integration for real-time notifications (replacing polling)
  - Comprehensive test coverage (unit, integration, and E2E tests)
  - Proper error boundary components for graceful React error handling

### 4. Documentation Updates
- Keep `ARCHITECTURE.md` synchronized with actual implementation as features evolve.
- Update API endpoint documentation when new routes are added or existing ones are modified.
- Maintain a changelog (`CHANGELOG.md`) for version tracking.
