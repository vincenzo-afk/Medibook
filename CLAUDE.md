# CLAUDE.md

> Project memory file for Anthropic Claude Code. Loaded automatically when Claude opens this repo. Read once per session; reference repeatedly.

---

## Project: MediBook

MediBook is a hospital appointment booking platform. Patients find doctors and book time slots. Doctors manage schedules and issue e-prescriptions. Admins oversee the operation. Built on Next.js 16 with the App Router, fully server-first, passwordless auth via Clerk.

---

## Tech Stack (Don't Drift)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 | App Router, Server Components, Server Actions, Turbopack |
| Language | TypeScript 5.7 | Strict mode, no `any` |
| Styling | Tailwind CSS v4 + shadcn/ui | No CSS modules, no inline styles |
| Database | PostgreSQL 16 (Neon) | Multi-tenant via `hospital_id` |
| ORM | Prisma 5.x | Use `lib/db/queries.ts`, never raw Prisma in routes |
| Auth | Clerk | Magic link + passkey + OAuth. No passwords, ever |
| Email | Resend | All sends via `lib/notifications/email.ts` |
| SMS | Twilio | All sends via `lib/notifications/sms.ts` |
| PDF | `@react-pdf/renderer` | Streaming, never persisted on disk |
| Validation | Zod | Every Server Action and webhook |
| Tests | Vitest + Playwright | 80% coverage floor |

If asked to introduce a different library for any of these layers, push back. Add the proposal to `docs/decisions/` instead.

---

## Where to Look First

When given a feature request, scan these files **before** writing anything:

1. `prisma/schema.prisma` — confirm which model(s) the feature touches.
2. `lib/db/queries.ts` — see how authorized queries are written.
3. `lib/clerk/roles.ts` — see how role guards work.
4. `lib/validations/` — find the matching Zod schema or create one.
5. `app/actions/` — find an existing Server Action to mirror.
6. `middleware.ts` — if new protected routes are needed, register them here.

Almost every feature is "find a similar one and copy the pattern". Look before you invent.

---

## Critical Patterns

### Server Actions

```typescript
'use server'

import { z } from 'zod'
import { requireRole } from '@/lib/clerk/roles'
import { createAppointment } from '@/lib/db/queries'
import { appointmentSchema } from '@/lib/validations/appointment'

export async function bookAppointment(input: unknown) {
  const user = await requireRole('patient')
  const data = appointmentSchema.parse(input)  // throws ZodError → 400
  return createAppointment({ ...data, patientId: user.id })
}
```

Every Server Action:
- Validates input with Zod (throws on invalid).
- Calls `requireRole()` or `requireUser()` first.
- Delegates persistence to `lib/db/queries.ts`.
- Never logs PII.
- Never catches silently — let errors bubble to the Next.js error boundary.

### Database Queries

All queries in `lib/db/queries.ts` receive an implicit `hospitalId` from the caller's Clerk session. Never read `hospitalId` from the request body — it can be spoofed.

```typescript
export async function getAppointments(ctx: Ctx, patientId: string) {
  return prisma.appointment.findMany({
    where: {
      hospitalId: ctx.hospitalId,
      patientId,
    },
  })
}
```

### Notifications

Never call `resend.emails.send()` or `twilio.messages.create()` directly. Always go through `dispatch.ts` which:

- Logs every send to `NotificationLog`.
- Falls back to stubs in non-production environments.
- Retries transient failures with exponential backoff.

### E-Prescriptions

Prescriptions are written by doctors only. The flow:

1. Doctor fills the structured form on `/doctor/prescriptions/new`.
2. Server Action `createPrescription` validates and persists.
3. Patient sees the prescription on their dashboard.
4. PDF is generated on demand via a streaming route handler at `/api/prescriptions/[id]/pdf`. Never persist PDFs to disk or S3 — stream and forget.

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Using `'use client'` on a page that fetches data | Fetch in Server Component, pass as props |
| Calling `prisma.*` directly in a Server Action | Use `lib/db/queries.ts` |
| Logging `appointment.patient.name` | Log only the appointment ID |
| Storing PDFs in `public/` | Stream from a route handler |
| Sending real emails in `pnpm dev` | The dispatcher auto-stubs in non-prod envs |
| Catching `ZodError` and returning `null` | Let it throw — Next.js returns a clean 400 |
| Adding `role:admin` from the client | Role changes happen via Clerk Backend API only |

---

## Build & Verify

Before declaring a task done:

```bash
pnpm typecheck    # must pass
pnpm lint         # must pass
pnpm test         # must pass
pnpm build        # must pass
```

If any fails, fix it. Do not mark complete with red CI.

---

## Testing Conventions

- Unit tests: `lib/foo/foo.test.ts` next to `lib/foo/foo.ts`.
- Use Vitest's `describe`/`it`/`expect`. Avoid Jest-style globals unless the file already uses them.
- Seed data: `prisma/seed.ts` provides deterministic IDs (`patient-1`, `doctor-1`, `admin-1`). Never invent IDs.
- Mock external services (Resend, Twilio) — never make real network calls in tests.

---

## Gotchas

- **Neon branching** — `DATABASE_URL` (pooled) vs `DIRECT_URL` (direct). Migrations use `DIRECT_URL`, runtime uses `DATABASE_URL`. Mixing them up causes cryptic connection errors.
- **Clerk webhook signature** — `/api/webhooks/clerk` verifies `svix-id`, `svix-timestamp`, `svix-signature` headers. Missing verification = silent rejection.
- **Slot hold timer** — held slots auto-release after 10 minutes via a CRON job (`/api/cron/release-holds`). Protected by a `CRON_SECRET` header.
- **Tailwind v4** — uses CSS-first config (`@theme` in `globals.css`). The old `tailwind.config.ts` is gone. Don't try to install v3 plugins.
- **Server Actions return serializable data only** — no `Date` objects (use ISO strings), no `Map`, no `Set`, no Prisma model instances (call `.toJSON()` or map to plain objects).

---

## When Stuck

1. Re-read this file.
2. Read `ARCHITECTURE.md` for system-level context.
3. Search the codebase: `rg "pattern" --type ts`.
4. If still stuck, pause and report what you've tried. Don't invent patterns.
