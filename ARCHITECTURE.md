# Architecture

> System design for MediBook. Read this before touching data flow, auth, or infrastructure.

---

## 1. Overview

MediBook is a server-first Next.js 16 application deployed on Vercel, backed by serverless PostgreSQL (Neon) and external SaaS providers for auth (Clerk), email (Resend), and SMS (Twilio). The system is multi-tenant: a single deployment serves multiple hospitals, isolated by `hospital_id` on every database row.

### Goals

- **Server-first rendering** — minimize client JavaScript, fetch data in Server Components.
- **Multi-tenant isolation** — every query is scoped by `hospital_id` derived from the session.
- **Passwordless auth** — magic link, passkey, OAuth via Clerk. No passwords, ever.
- **Audit-grade notifications** — every email/SMS send is logged for compliance.
- **Streaming PDFs** — e-prescriptions are rendered on demand, never persisted to disk.

### Non-Goals

- We are not building a custom auth system. Clerk handles it.
- We are not building an offline-first PWA. Patients are expected to have connectivity.
- We are not building a custom video-call system. Future telemedicine will use Whereby embeds.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser (Patient/Doctor/Admin)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel Edge Network                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                proxy.ts (Clerk auth)                   │  │
│  │  • Verifies session JWT                                     │  │
│  │  • Redirects unauthenticated users to /sign-in             │  │
│  │  • Blocks role mismatches (e.g., patient hitting /admin)    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               Next.js 16 App Router                          │  │
│  │  • Server Components fetch via lib/db/queries.ts             │  │
│  │  • Server Actions mutate via lib/db/queries.ts               │  │
│  │  • Route handlers (app/api/*) reserved for webhooks          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌───────────┐ ┌─────────────┐
│ PostgreSQL  │ │   Clerk     │ │  Resend   │ │   Twilio    │
│  (Neon)     │ │  (Auth)     │ │  (Email)   │ │   (SMS)     │
└─────────────┘ └─────────────┘ └───────────┘ └─────────────┘
```

### Why this shape

- **Vercel + Next.js 16**: Server Components reduce client JS; Server Actions eliminate REST boilerplate; Edge middleware gives cheap auth gating.
- **Neon serverless Postgres**: scales to zero, branches for testing migrations, connection pooling built-in.
- **Clerk**: offloads passwordless auth complexity (passkey, magic link, OAuth) and provides session JWTs we trust.
- **Resend + Twilio**: focused APIs with webhook receipts — we don't need SMTP or SMS gateways.
- **No message queue**: transactional outbox pattern in `NotificationLog` + a cron job picks up retries. Adds a queue only if volume demands it.

---

## 3. Multi-Tenancy Model

Every tenant is a hospital. Every row in every tenant-scoped table carries `hospitalId: String` as a foreign key to `Hospital`. The Clerk session's `hospitalId` claim provides the active tenant for the request.

### Enforcement Layers

| Layer | Mechanism |
|---|---|
| **Route-level** | `proxy.ts` checks Clerk session claims; blocks cross-tenant access. |
| **Query-level** | `lib/db/queries.ts` injects `hospitalId` from a context object built from the session. Never from the request body. |
| **Migration-level** | Every new tenant-scoped model must include `hospitalId` in its schema. CI lint rule enforces this. |

### Context Object

```typescript
// lib/clerk/types.ts
export interface Ctx {
  userId: string
  role: 'patient' | 'doctor' | 'admin'
  hospitalId: string
}

// lib/clerk/roles.ts
export async function getCtx(): Promise<Ctx> {
  const session = await auth()
  if (!session) throw new UnauthorizedError()
  const { userId, sessionClaims } = session
  return {
    userId: userId!,
    role: sessionClaims.role as Ctx['role'],
    hospitalId: sessionClaims.hospitalId as string,
  }
}
```

---

## 4. Authentication Flow

```
┌──────────┐     1. Enter email      ┌──────────┐
│  Browser │ ─────────────────────► │  Clerk   │
└──────────┘                        │ Frontend │
     ▲                              └────┬─────┘
     │                                   │ 2. Send magic link
     │                                   ▼
     │                              ┌──────────┐
     │  4. JWT in cookie            │  Resend  │
     │ ◄────────────────────────────│  → email │
     │                              └──────────┘
     │
     │ 3. User clicks link → Clerk verifies
     │
     ▼
┌──────────────────────────────────────────────────┐
│  proxy.ts                                    │
│  • Verifies JWT via Clerk                         │
│  • Reads sessionClaims.role, hospitalId           │
│  • Routes to /patient, /doctor, /admin            │
└──────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│  Server Component                                 │
│  const ctx = await getCtx()                       │
│  const data = await getDashboard(ctx)             │
└──────────────────────────────────────────────────┘
```

### Webhook: User Sync

Clerk fires `user.created`, `user.updated`, `user.deleted` webhooks to `/api/webhooks/clerk`. The handler:

1. Verifies the Svix signature (`svix-id`, `svix-timestamp`, `svix-signature`).
2. Inserts/updates/deletes the matching row in the `User` table.
3. On `user.created`, assigns default role `patient` and the `hospitalId` derived from the user's Clerk organization.

### Role Elevation

Only admins can promote users. The admin dashboard calls Clerk's Backend API (`PATCH /v1/users/{id}/metadata`) to set `role:doctor` or `role:admin`. Our webhook then syncs the change to the local `User` table.

---

## 5. Data Model (Prisma Highlights)

```
Hospital  1 ──── *  User
                       │
                       │ role=doctor
                       ▼
                    Doctor  1 ──── *  Slot
                                          │
                                          ▼
User (role=patient) ──── Patient 1 ──── * Appointment * ──── 1 Slot
                                            │
                                            ▼
                                      Prescription 1 ──── * Medication
```

### Key Tables

| Table | Purpose | Tenant-scoped? |
|---|---|---|
| `Hospital` | Tenant root | — |
| `User` | Synced from Clerk | ✅ |
| `Doctor` | Doctor profile (specialty, bio, fees) | ✅ |
| `Patient` | Patient profile (demographics, history refs) | ✅ |
| `Slot` | Doctor availability blocks | ✅ |
| `Appointment` | Booking linking patient + slot | ✅ |
| `Prescription` | E-prescription header | ✅ |
| `Medication` | Line items in a prescription | ✅ |
| `NotificationLog` | Audit log for every email/SMS | ✅ |
| `AuditEvent` | Mutation audit trail | ✅ |

### Slot Hold Logic

When a patient starts booking, the slot is marked `HELD` with a `heldUntil` timestamp 10 minutes in the future. A cron job at `/api/cron/release-holds` (protected by `CRON_SECRET` header) runs every minute and releases any held slots past their `heldUntil` time back to `OPEN`. This prevents stale holds from blocking real bookings.

### Optimistic Locking

`Appointment.create` runs inside a Prisma transaction:

1. `SELECT ... FOR UPDATE` on the slot row.
2. Verify `slot.status === 'OPEN'`.
3. Insert the appointment.
4. Update `slot.status = 'BOOKED'`.

If another transaction booked the slot between step 1 and step 4, the transaction rolls back and the caller throws a `SlotAlreadyBookedError`.

---

## 6. API Surface

MediBook has **no public REST API**. All mutations go through Server Actions invoked by `<form action={...}>` or `useActionState`. Route handlers (`app/api/*`) exist only for:

| Path | Purpose |
|---|---|
| `/api/webhooks/clerk` | User sync from Clerk |
| `/api/webhooks/resend` | Email delivery receipts |
| `/api/webhooks/twilio` | SMS delivery receipts |
| `/api/cron/release-holds` | Release expired slot holds (Vercel Cron) |
| `/api/cron/send-reminders` | Send 24h / 2h reminders (Vercel Cron) |
| `/api/prescriptions/[id]/pdf` | Stream prescription PDF |

All webhook handlers verify signatures. All cron handlers verify `CRON_SECRET`.

---

## 7. Notifications

```
Appointment Created (Server Action)
        │
        ▼
lib/notifications/dispatch.ts
        │
        ├─► Resend.sendBookingConfirmation()
        │       │
        │       └─► NotificationLog { status: 'queued' }
        │
        ├─► Schedule 24h reminder (cron job picks up)
        ├─► Schedule 2h reminder (cron job picks up)
        └─► Schedule SMS (2h reminder only)
```

- Every dispatch writes to `NotificationLog` with `status: 'queued'`.
- Resend/Twilio webhook updates `NotificationLog.status` to `delivered` or `failed`.
- Failed sends retry up to 3 times with exponential backoff.
- In dev: stubs in `lib/notifications/stub.ts` return success without sending.

---

## 8. E-Prescriptions

```
Doctor fills prescription form
        │
        ▼
Server Action: createPrescription()
        │
        ├─► Validate with Zod
        ├─► Insert Prescription + Medications (transaction)
        └─► Send email to patient with link to view
        
Patient opens dashboard
        │
        ▼
Server Component fetches prescription
        │
        ▼
Client clicks "Download PDF"
        │
        ▼
GET /api/prescriptions/[id]/pdf
        │
        ├─► Verify session is patient who owns prescription
        ├─► Render PDF via @react-pdf/renderer
        └─► Stream response (Content-Type: application/pdf)
```

PDFs are **never persisted** — generated on demand. This avoids PHI storage on disk and simplifies audit.

---

## 9. Folder Structure (Authoritative)

```
medibook/
├── app/
│   ├── (auth)/                # Clerk-rendered auth pages
│   ├── (patient)/             # Patient dashboard group
│   │   ├── appointments/
│   │   ├── prescriptions/
│   │   └── doctors/
│   ├── (doctor)/              # Doctor dashboard group
│   │   ├── schedule/
│   │   ├── patients/
│   │   └── prescriptions/
│   ├── (admin)/               # Admin dashboard group
│   │   ├── doctors/
│   │   ├── patients/
│   │   └── analytics/
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── clerk/route.ts
│   │   │   ├── resend/route.ts
│   │   │   └── twilio/route.ts
│   │   ├── cron/
│   │   │   ├── release-holds/route.ts
│   │   │   └── send-reminders/route.ts
│   │   └── prescriptions/[id]/pdf/route.ts
│   ├── actions/               # Server Actions
│   ├── layout.tsx
│   ├── page.tsx               # Landing
│   └── globals.css            # Tailwind v4 @theme
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── patient/               # Patient-specific
│   ├── doctor/                # Doctor-specific
│   ├── admin/                 # Admin-specific
│   └── shared/                # Cross-role
├── lib/
│   ├── db/
│   │   ├── client.ts          # Prisma client
│   │   ├── queries/           # Authorized query layer
│   │   └── seed.ts
│   ├── clerk/
│   │   ├── roles.ts
│   │   ├── webhook.ts
│   │   ├── sync.ts
│   │   └── types.ts
│   ├── notifications/
│   │   ├── dispatch.ts
│   │   ├── email.ts           # Resend
│   │   ├── sms.ts             # Twilio
│   │   └── stub.ts            # Dev stubs
│   ├── prescriptions/
│   │   ├── pdf.tsx            # @react-pdf/renderer template
│   │   └── sign.ts            # Hospital seal signing
│   ├── validations/
│   │   ├── appointment.ts
│   │   ├── prescription.ts
│   │   ├── slot.ts
│   │   └── user.ts
│   ├── logger.ts
│   ├── errors.ts              # Typed errors
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── integration/
│   └── e2e/
├── proxy.ts
├── next.config.ts
├── tailwind.config.ts         # (empty — v4 uses @theme in globals.css)
├── .env.example
├── .github/
│   ├── workflows/
│   └── copilot-instructions.md
├── AGENTS.md
├── CLAUDE.md
├── CURSOR.md
├── CONTRIBUTING.md
├── ARCHITECTURE.md
├── SECURITY.md
└── README.md
```

---

## 10. Deployment Topology

```
GitHub Repo
    │
    ▼ push to main
GitHub Actions
    │
    ├─► typecheck, lint, test, build
    └─► on green: trigger Vercel deploy
            │
            ▼
        Vercel
            │
            ├─► Build (Next.js 16)
            ├─► Deploy to Edge Network
            └─► Run migrations via build hook
                    │
                    ▼
                Neon (Postgres)
                    │
                    ├─► production branch
                    └─► preview branches (one per Vercel preview deploy)
```

### Environments

| Env | DB | Clerk | Notifications |
|---|---|---|---|
| `local` | Local Postgres or Neon dev branch | Clerk dev instance | Stubs |
| `preview` | Neon preview branch (auto-created per PR) | Clerk staging instance | Stubs |
| `production` | Neon production branch | Clerk production instance | Real Resend + Twilio |

---

## 11. Observability

- **Logs**: Vercel structured logs. We use `lib/logger.ts` which writes JSON to stdout.
- **Errors**: Sentry (`SENTRY_DSN` env var). PII is scrubbed before send.
- **Metrics**: Vercel Analytics for traffic. Custom metrics via Sentry Performance.
- **Audit**: `AuditEvent` table logs every mutation touching PHI. Retained 7 years.

---

## 12. Performance Considerations

- Server Components reduce client JS — keep it that way. Don't pull in heavy client-only libraries.
- Prisma queries use `select` to fetch only needed fields. Avoid `include` chains deeper than 2 levels.
- Slot availability page uses ISR (`revalidate: 60`) — stale data is acceptable for up to 1 minute.
- Prescription PDFs stream — never buffer in memory.
- Vercel Edge runtime is used for `proxy.ts` and webhook routes. Server Components run on Node runtime (default).

---

## 13. Trade-Offs & ADRs

Architectural decisions are documented in `docs/decisions/` as ADRs (Architecture Decision Records). Key trade-offs:

- **Clerk vs. Auth.js**: Clerk offloads the passwordless UX and passkey complexity at the cost of a SaaS dependency. Worth it.
- **Vercel vs. self-hosted**: Vercel's Edge + Cron + Preview DB branching fits our workflow. Self-hosting adds ops burden without benefit.
- **No message queue**: NotificationLog + cron handles our volume. If volume spikes, we'll add SQS or Upstash Queue.
- **PDF streaming vs. storage**: PHI never touches disk. Simpler audit, slightly more CPU per request. Acceptable for now.
