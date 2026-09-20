# Security Policy

> MediBook handles Protected Health Information (PHI). This document defines our threat model, PII handling rules, authentication model, and vulnerability reporting process. Every contributor must read it.

---

## 1. Supported Versions

| Version | Supported | Status |
|---|---|---|
| `main` (latest) | ✅ | Active development |
| `1.x` (latest tag) | ✅ | Production releases |
| `< 1.0` | ❌ | End of life |

Security fixes are backported to the latest `1.x` release only.

---

## 2. Threat Model

### Assets We Protect

1. **Patient PHI** — name, contact, appointment history, prescriptions, diagnoses.
2. **Doctor PII** — name, credentials, schedule, earnings.
3. **Hospital operational data** — schedules, no-show rates, revenue.
4. **System integrity** — prevention of unauthorized booking, prescription forgery, role escalation.
5. **Audit trail** — every mutation must be reconstructable from logs.

### Adversaries

| Adversary | Capability | Motivation |
|---|---|---|
| External attacker | Internet access, no creds | Steal PHI for resale, defacement |
| Curious patient | Valid patient account | Snoop on other patients, forge prescriptions |
| Malicious doctor | Valid doctor account | Access records outside their hospital, prescribe controlled substances fraudulently |
| Compromised admin | Full admin access | Mass PHI exfiltration, role escalation, sabotage |
| Insider at SaaS provider | Access to Clerk/Resend/Twilio/Neon infrastructure | PHI leak |

### Trust Boundaries

```
┌────────────────────────────────────────────────────────────┐
│                     Untrusted (Internet)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Browser (Client)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬───────────────────────────────┘
                             │ TLS 1.3
                             ▼
┌────────────────────────────────────────────────────────────┐
│              Trusted Boundary: Vercel Runtime               │
│                                                             │
│  proxy.ts ─── Clerk JWT verification                   │
│       │                                                     │
│       ▼                                                     │
│  Server Component ─── getCtx() reads session claims         │
│       │                                                     │
│       ▼                                                     │
│  lib/db/queries.ts ─── injects hospitalId from ctx          │
│       │                                                     │
│       ▼                                                     │
│  PostgreSQL (Neon) — every query scoped by hospitalId      │
└────────────────────────────────────────────────────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
   Clerk (auth)       Resend (email)     Twilio (SMS)
   Trusted SaaS      Trusted SaaS        Trusted SaaS
```

Anything outside the Vercel runtime boundary is untrusted. Anything in the request body is untrusted. The Clerk session JWT is the only trust anchor.

---

## 3. PII Handling

### What Counts as PII

| Field | PII? | Notes |
|---|---|---|
| Patient name | ✅ | Direct identifier |
| Patient email | ✅ | Direct identifier |
| Patient phone | ✅ | Direct identifier |
| Patient date of birth | ✅ | Quasi-identifier |
| Appointment reason | ✅ | Often reveals diagnosis |
| Prescription content | ✅ | Medication + dosage reveals condition |
| Doctor name | ✅ | Public-facing, but still PII |
| Doctor schedule | ✅ | Reveals availability patterns |
| Hospital name | ❌ | Public, by design |
| Appointment ID | ❌ | Opaque identifier |
| Slot ID | ❌ | Opaque identifier |
| User ID (Clerk) | ❌ | Opaque identifier |

### Hard Rules

1. **Never log PII.** Use `lib/logger.ts` which is env-aware and explicitly forbids PII fields. If you must reference a patient in a log, use the patient ID only.
2. **Never return PII in error responses.** Generic "Something went wrong" only. Internal error details go to Sentry, never to the client.
3. **Never commit real patient records** — even in test fixtures. Use the synthetic seed data in `prisma/seed.ts`.
4. **Never send PII to third-party services** outside our approved vendor list (Clerk, Resend, Twilio, Neon, Sentry). Sentry has PII scrubbing enabled.
5. **Never disable multi-tenant filtering** — every query must include `hospitalId` from the session context.

### Data Minimization

Server Components fetch only the fields needed for rendering. Use Prisma's `select` to scope columns. Avoid `include` chains deeper than 2 levels — they often over-fetch.

### Data Retention

| Data Type | Retention |
|---|---|
| Patient appointment history | 7 years (regulatory requirement) |
| Prescription records | 7 years |
| Notification logs | 1 year |
| Audit events | 7 years |
| Inactive user accounts | Soft-deleted, purged after 90 days |

---

## 4. Authentication & Authorization

### Authentication: Clerk

MediBook uses Clerk for passwordless authentication:

- **Magic link** (default for email) — sent via Clerk's email provider.
- **Passkey** (WebAuthn) — encouraged for admins and doctors.
- **OAuth** — Google, Apple, Microsoft.

**No passwords are stored anywhere in our system.** Clerk manages the entire credential lifecycle.

### Session Tokens

- Clerk issues a JWT signed with `CLERK_SECRET_KEY`.
- The JWT is stored in an `httpOnly`, `Secure`, `SameSite=Lax` cookie.
- `proxy.ts` verifies the JWT on every request via Clerk's `clerkMiddleware()`.
- Session claims include `role` (`patient` | `doctor` | `admin`) and `hospitalId`.

### Authorization: Three Layers

| Layer | Where | What It Checks |
|---|---|---|
| Route-level | `proxy.ts` | Role vs. route group: `/patient/*` requires `role=patient`, etc. |
| Mutation-level | Server Action | `requireRole()` call at the top of every action |
| Data-level | `lib/db/queries.ts` | Every query includes `hospitalId: ctx.hospitalId` |

All three layers must pass. Missing any one is a critical security bug.

### Role Elevation

- Only admins can promote users.
- The admin dashboard calls Clerk's Backend API (`PATCH /v1/users/{id}/metadata`) to set `role`.
- Our Clerk webhook syncs the change to our local `User` table.
- Role elevation is logged to `AuditEvent`.

### Session Invalidation

- Sign-out: Clerk destroys the session cookie.
- Force sign-out (admin action): Clerk revokes all sessions for the user via Backend API.
- Password reset / passkey reset: Clerk auto-invalidates existing sessions.

---

## 5. Input Validation

- **Every Server Action** validates input with a Zod schema from `lib/validations/`.
- **Every webhook handler** validates the request body with Zod.
- **Every URL parameter** used in a query is validated with `z.string().cuid()`.
- **No `any`** anywhere in the codebase (TypeScript strict mode enforced).

### Validation Patterns

```typescript
const bookAppointmentSchema = z.object({
  doctorId: z.string().cuid(),
  slotId: z.string().cuid(),
  reason: z.string().trim().max(500).optional(),
})

export async function bookAppointment(input: unknown) {
  const data = bookAppointmentSchema.parse(input)  // throws on invalid
  // ...
}
```

Invalid input throws `ZodError`, which Next.js converts to a 400 response. No silent recovery.

---

## 6. Rate Limiting

| Endpoint | Limit | Window | Burst |
|---|---|---|---|
| `/sign-in` (Clerk-hosted) | 5 | 1 min | 10 |
| Server Action: `bookAppointment` | 10 | 1 min | 20 |
| Server Action: `createPrescription` | 5 | 1 min | 10 |
| Server Action: `cancelAppointment` | 10 | 1 min | 20 |
| Webhook endpoints | 100 | 1 min | 200 |
| Cron endpoints | 60 | 1 min | — |

Rate limiting uses Vercel's Edge KV. Limit exceeded → 429 response with `Retry-After` header.

---

## 7. CSRF Protection

Server Actions invoked via `<form action={...}>` are protected by Next.js's built-in CSRF token (double-submit cookie pattern). All mutations go through Server Actions — no `fetch()`-based mutations from the client.

For webhook endpoints, CSRF is not applicable — signature verification is the only defense needed.

---

## 8. Output Encoding

- React escapes all JSX output by default. Never use `dangerouslySetInnerHTML`.
- Email templates use React Email (Resend) — escaped by default.
- PDFs use `@react-pdf/renderer` — escaped by default.
- SQL: Prisma parameterizes all queries. No raw SQL allowed.

---

## 9. Audit Logging

Every mutation touching PHI writes to `AuditEvent`:

| Field | Value |
|---|---|
| `actorId` | User ID from session |
| `actorRole` | Role from session |
| `hospitalId` | Tenant |
| `action` | e.g., `appointment.create`, `prescription.issue` |
| `targetType` | e.g., `Patient`, `Appointment` |
| `targetId` | ID of the mutated entity |
| `metadata` | Non-PII context (slot ID, doctor ID) |
| `ipAddress` | Request IP |
| `userAgent` | Request UA |
| `timestamp` | UTC ISO 8601 |

Audit events are append-only. No updates, no deletes. Retained 7 years.

---

## 10. Dependency Security

- `pnpm audit` runs on every PR and nightly in CI. Critical vulnerabilities block the build.
- Renovate auto-PRs for patch versions. Minor and major versions require manual review.
- All dependencies are pinned in `pnpm-lock.yaml`. No `latest` tags.

### Approved Vendors

| Service | Use | Trust Level |
|---|---|---|
| Clerk | Auth | HIPAA-eligible (BAA signed) |
| Neon | Database | HIPAA-eligible (BAA signed) |
| Resend | Email | HIPAA-eligible (BAA signed) |
| Twilio | SMS | HIPAA-eligible (BAA signed) |
| Sentry | Error monitoring | PII scrubbing enabled |
| Vercel | Hosting | HIPAA-eligible (BAA signed) |

### Forbidden Vendors

Any service not on the approved list, especially those without a signed BAA, may NOT receive PHI. This includes analytics providers, crash reporters, and feature-flag services.

---

## 11. Secrets Management

- Local: `.env.local` (gitignored, never committed).
- Preview / Production: Vercel environment variables (encrypted at rest).
- Rotation: every 90 days for `CLERK_SECRET_KEY`, `RESEND_API_KEY`, `TWILIO_AUTH_TOKEN`, `CRON_SECRET`, `SENTRY_DSN`.
- Leak response: rotate immediately, audit access logs for the affected window.

---

## 12. Vulnerability Reporting

### How to Report

Email **`security@medibook.example`** with:

1. Description of the vulnerability.
2. Steps to reproduce (proof of concept).
3. Affected versions.
4. Suggested fix (optional).

Do NOT open a public GitHub issue for security reports.

### Response SLA

| Severity | First Response | Fix Target |
|---|---|---|
| Critical (RCE, PHI leak) | 24 hours | 72 hours |
| High (auth bypass, IDOR) | 48 hours | 7 days |
| Medium (XSS, CSRF) | 72 hours | 30 days |
| Low (info disclosure, hardening) | 1 week | 90 days |

### Credit

We credit reporters in release notes unless they prefer to remain anonymous. We do not offer monetary bounties at this time.

---

## 13. Compliance

MediBook is designed to support compliance with:

- **HIPAA** (US healthcare) — BAAs in place with all PHI-handling vendors.
- **GDPR** (EU) — right to access, rectify, erase, port data. Implemented via `/patient/privacy` dashboard.
- **PIPEDA** (Canada) — similar to GDPR.
- **DPDP Act 2023** (India) — data fiduciary obligations.

Compliance is a shared responsibility. The platform provides the technical controls; the deploying hospital is responsible for administrative and physical safeguards, staff training, and breach notification procedures.

---

## 14. Security Checklist for Contributors

Before opening a PR that touches auth, data flow, or external integrations:

- [ ] Every new query includes `hospitalId` from the session context.
- [ ] Every new Server Action calls `requireRole()`.
- [ ] Every new route handler verifies the appropriate signature or `CRON_SECRET`.
- [ ] Every new mutation writes to `AuditEvent`.
- [ ] No PII in logs.
- [ ] No PII in error responses.
- [ ] No new dependencies without security review.
- [ ] Zod validation on every input boundary.
- [ ] No `any`, no `// @ts-ignore`, no `as unknown as`.
- [ ] No `dangerouslySetInnerHTML`.
- [ ] No raw SQL.

When in doubt, ask in `#security` on Slack or open a draft PR for early review.
