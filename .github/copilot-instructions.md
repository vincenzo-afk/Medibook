# GitHub Copilot Instructions

> Project-wide instructions for GitHub Copilot. Loaded automatically by Copilot Chat and Copilot Workspace when this file is present in `.github/`.

---

## Project Context

**MediBook** is a hospital appointment booking platform. Three user roles interact with the system: patients, doctors, and hospital administrators. The codebase is built on Next.js 16 (App Router) with TypeScript strict mode, Tailwind CSS v4, Prisma 5, PostgreSQL 16, and Clerk (passwordless auth).

Multi-tenant: every database row carries a `hospital_id`. The Clerk session provides the active hospital context — never trust a `hospitalId` sent from the client.

---

## Stack at a Glance

| Layer | Tool | Notes |
|---|---|---|
| Framework | Next.js 16 | App Router, Server Components, Server Actions |
| Language | TypeScript 5.7 | Strict, `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS v4 + shadcn/ui | CSS-first config via `@theme` |
| ORM | Prisma 5 | Use `lib/db/queries.ts`, not raw Prisma |
| Database | PostgreSQL 16 (Neon) | Pooled + direct URLs |
| Auth | Clerk | Magic link, passkey, OAuth |
| Email | Resend | Stubbed in non-prod |
| PDF | `@react-pdf/renderer` | Streamed, never persisted |
| Validation | Zod | Every Server Action + webhook |
| Tests | Vitest + Playwright | 80% coverage floor |

---

## Coding Standards

### TypeScript

- **Strict mode only.** No `any`, no `as unknown as`, no `// @ts-ignore`.
- Prefer `type` for unions; `interface` for extensible object shapes.
- Function params: type explicitly; never infer from default values.
- Always type Server Action inputs as `unknown` — validate with Zod.

### React / Next.js

- **Server Components by default.** Only use `'use client'` when you need state, effects, or browser APIs.
- Never fetch data in `useEffect` — fetch in the server parent and pass as props.
- Server Actions: `'use server'` at top, `requireRole()` first, Zod validation next, delegate to `lib/db/queries.ts`.
- Route handlers (`app/api/*`) are reserved for webhooks and streaming responses only. All mutations go through Server Actions.
- Use `error.tsx` boundaries at the route group level for graceful error UI.

### Database

- All queries live in `lib/db/queries.ts`. Never call `prisma.*` from a route or component.
- Every query receives a `Ctx` with `userId`, `role`, `hospitalId` pulled from the Clerk session.
- Multi-tenant filter is mandatory: `where: { hospitalId: ctx.hospitalId, ...rest }`.
- Migrations: `pnpm db:migrate <name>`. Never edit existing migrations.

### Styling

- Tailwind CSS v4 only. CSS-first config in `app/globals.css` via `@theme`.
- No CSS modules. No inline `style={}` attributes. No styled-components.
- shadcn/ui for buttons, inputs, dialogs, etc. — extend, don't replace.
- Use semantic color tokens: `bg-background`, `text-foreground`, `text-muted-foreground`. Never raw hex.

### Imports

- Path alias `@/` is configured (maps to project root).
- Import order: Node builtins → external → `@/lib/*` → `@/components/*` → relative.
- No default exports for components or utilities — named exports only.
- Exception: page components in `app/` (Next.js convention).

### Naming

| Kind | Convention | Example |
|---|---|---|
| Component file | `PascalCase.tsx` | `AppointmentCard.tsx` |
| Component | `PascalCase` | `AppointmentCard` |
| Hook file | `useFoo.ts` | `useAppointment.ts` |
| Util file | `camelCase.ts` | `slotCalc.ts` |
| Type | `PascalCase` | `AppointmentStatus` |
| Zod schema | `fooSchema` suffix | `appointmentSchema` |
| Constant | `SCREAMING_SNAKE_CASE` | `MAX_SLOT_HOLD_MINUTES` |

### Validation

- Every Server Action's first argument is `unknown`.
- Pass through a Zod schema defined in `lib/validations/<feature>.ts`.
- Export both the schema and the inferred type:

```typescript
import { z } from 'zod'

export const bookAppointmentSchema = z.object({
  doctorId: z.string().cuid(),
  slotId: z.string().cuid(),
  reason: z.string().max(500).optional(),
})

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>
```

### Errors

- No silent catches. No `catch (e) { return null }`.
- Let Zod errors throw — Next.js returns a 400 automatically.
- For known business errors (e.g., "slot already booked"), throw a typed error and handle in `useActionState` on the client.
- Use `error.tsx` boundaries at route group level.

### Logging

- Use `lib/logger.ts`, never `console.log`.
- Logger is env-aware — debug logs in dev only.
- **Never log PII:** patient name, email, phone, prescription content, diagnosis, notes.
- Logging IDs (appointment ID, slot ID, user ID) is fine.

---

## Patterns to Generate

### Server Action

```typescript
'use server'

import { requireRole } from '@/lib/clerk/roles'
import { bookAppointmentSchema } from '@/lib/validations/appointment'
import { createAppointment } from '@/lib/db/queries/appointment'

export async function bookAppointment(input: unknown) {
  const user = await requireRole('patient')
  const data = bookAppointmentSchema.parse(input)
  return createAppointment({ ...data, patientId: user.id })
}
```

### Authorized Query

```typescript
import { prisma } from '@/lib/db/client'
import type { Ctx } from '@/lib/clerk/types'

export async function getAppointments(ctx: Ctx, patientId: string) {
  return prisma.appointment.findMany({
    where: {
      hospitalId: ctx.hospitalId,
      patientId,
    },
    orderBy: { startsAt: 'desc' },
  })
}
```

### Webhook Handler

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyClerkWebhook } from '@/lib/clerk/webhook'
import { syncUserFromClerk } from '@/lib/clerk/sync'

export async function POST(req: NextRequest) {
  const event = await verifyClerkWebhook(req)
  if (!event) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  switch (event.type) {
    case 'user.created':
      await syncUserFromClerk(event.data)
      break
    case 'user.deleted':
      await deleteUserFromClerk(event.data)
      break
  }

  return NextResponse.json({ ok: true })
}
```

---

## What NOT to Suggest

- ❌ Installing new dependencies without operator approval.
- ❌ Using `any` or `// @ts-ignore` to bypass type errors.
- ❌ Adding `'use client'` to pages that fetch data on the server.
- ❌ Using `fetch()` in a client component for server-available data.
- ❌ Calling `prisma.*` directly in routes/components — use `lib/db/queries.ts`.
- ❌ Persisting PDFs to disk or S3 — stream them.
- ❌ Sending real emails/SMS in dev — the dispatcher stubs this.
- ❌ Logging PII (patient name, email, prescription content).
- ❌ Reading `hospitalId` from the request body — always from the session.
- ❌ Inline styles or CSS modules.
- ❌ Default exports for components or utilities.

---

## Pre-PR Checks

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

All four must pass before opening a PR. See `CONTRIBUTING.md` for the full workflow.

---

## Reference Files

When unsure, read these first:

- `AGENTS.md` — agent operational rules
- `CLAUDE.md` — Claude Code project memory
- `ARCHITECTURE.md` — system design
- `SECURITY.md` — threat model and PII handling
- `CONTRIBUTING.md` — PR workflow
- `prisma/schema.prisma` — data models
- `lib/db/queries.ts` — authorized query patterns
- `lib/clerk/roles.ts` — role guard helpers
