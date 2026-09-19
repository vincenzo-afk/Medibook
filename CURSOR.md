# CURSOR.md

> Project rules for the Cursor IDE. Loaded automatically when Cursor opens this repo. Provides context, conventions, and guardrails for Cursor's AI completions and chat.

---

## Project Overview

**MediBook** — Hospital appointment booking system. Patients book doctors, doctors manage schedules + issue e-prescriptions, admins oversee the hospital.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 + shadcn/ui · Prisma 5 · PostgreSQL 16 · Clerk (passwordless auth) · Resend (email) · Twilio (SMS) · `@react-pdf/renderer` (PDFs)

---

## Directory Map

```
app/
  (auth)/          # Clerk-rendered auth pages
  (patient)/       # Patient routes — protected by middleware
  (doctor)/        # Doctor routes — role:doctor required
  (admin)/         # Admin routes — role:admin required
  api/
    webhooks/      # Clerk, Resend, Twilio webhook handlers
    cron/          # Protected by CRON_SECRET header
    prescriptions/ # Streaming PDF route handlers
  actions/         # Server Actions (mutations)
components/         # shadcn/ui + shared components
lib/
  db/              # Prisma client + queries.ts (authorized layer)
  clerk/           # Role helpers, middleware utils
  notifications/   # Resend + Twilio clients + dispatch.ts
  prescriptions/   # PDF rendering
  validations/     # Zod schemas
  logger.ts        # Env-aware logger
prisma/
  schema.prisma
  migrations/
  seed.ts
middleware.ts       # Clerk route protection
next.config.ts
```

---

## Coding Rules (Strict)

### 1. Server-First

- Default: Server Component. Fetch data on the server.
- Add `'use client'` ONLY when you need state, effects, or browser APIs.
- Never fetch in `useEffect`. Never use `useState` for data that could be server-rendered.
- Client components receive data as props from server parents.

### 2. Server Actions

- Always `'use server'` at the top.
- Always call `requireRole()` or `requireUser()` from `lib/clerk/roles.ts` first.
- Always validate input with a Zod schema from `lib/validations/`.
- Never catch errors silently. Let them bubble to `error.tsx`.
- Never read `hospitalId` from the client — always pull from the Clerk session.

### 3. Database

- Use `lib/db/queries.ts` exclusively. Never call `prisma.*` from a route or component.
- Every query receives a `Ctx` object with `userId`, `role`, `hospitalId` — all from the session.
- Multi-tenant filter: `where: { hospitalId: ctx.hospitalId, ...rest }`.

### 4. Styling

- Tailwind CSS v4 only. No CSS modules, no inline styles.
- shadcn/ui for buttons, inputs, dialogs, etc. Compose, don't re-create.
- Spacing scale: Tailwind defaults. Don't add custom spacing tokens.
- Colors: defined in `globals.css` via `@theme`. Use semantic tokens (`bg-background`, `text-foreground`), not raw hex.

### 5. TypeScript

- Strict mode. `noUncheckedIndexedAccess` is on.
- No `any`. No `// @ts-ignore`. No `as unknown as X`.
- Prefer `type` for unions and intersections, `interface` for object shapes that may be extended.
- Always type Server Action inputs as `unknown` and validate with Zod inside.

### 6. Imports

- Order: Node builtins → external → `@/lib/*` → `@/components/*` → relative.
- Use `@/` alias (configured in `tsconfig.json`).
- No default exports for components or utilities — named exports only. (Exception: page components in `app/`.)

### 7. Naming

| Kind | Convention | Example |
|---|---|---|
| Component file | `PascalCase.tsx` | `AppointmentCard.tsx` |
| Component | `PascalCase` | `AppointmentCard` |
| Hook file | `camelCase.ts` with `use` prefix | `useAppointment.ts` |
| Hook | `camelCase` with `use` prefix | `useAppointment` |
| Util file | `camelCase.ts` or `kebab-case.ts` | `slotCalc.ts` |
| Util function | `camelCase` | `calculateSlot` |
| Type | `PascalCase` | `AppointmentStatus` |
| Zod schema | `camelCaseSchema` suffix | `appointmentSchema` |
| Constant | `SCREAMING_SNAKE_CASE` | `MAX_SLOT_HOLD_MINUTES` |
| Env var | `SCREAMING_SNAKE_CASE` | `DATABASE_URL` |

### 8. Validation

- Every Server Action's input is `unknown`.
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

### 9. Errors

- No silent catches. No `catch (e) { return null }`.
- Use `error.tsx` boundaries at the route group level.
- Server Actions throw on validation failure — Next.js converts to a 400.
- For known business errors (e.g., "slot already booked"), throw a typed `BookingError` and handle it in the calling form's `useActionState`.

### 10. Logging

- Use `lib/logger.ts`, never `console.log`.
- Logger is env-aware — debug logs in dev only.
- Never log PII: patient name, email, phone, prescriptions, diagnosis, notes.
- Logging IDs (appointment ID, slot ID, user ID) is fine.

---

## Per-Feature Checklist

Before opening a PR for a new feature:

- [ ] Schema change documented in the PR description (if any).
- [ ] Migration created with `pnpm db:migrate` (if schema changed).
- [ ] Server Action in `app/actions/<feature>.ts` validates input.
- [ ] All queries go through `lib/db/queries.ts`.
- [ ] Role guard on every protected route in `middleware.ts`.
- [ ] At least one unit test for the new logic in `lib/`.
- [ ] At least one integration test for the Server Action.
- [ ] At least one E2E test for the user-visible flow (Playwright).
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass.
- [ ] No `console.log` left in committed code.
- [ ] Conventional Commit message (see CONTRIBUTING.md).

---

## Common Cursor Snippets

Use these as completions when context matches:

### New Server Action

```typescript
'use server'

import { requireRole } from '@/lib/clerk/roles'
import { <name>Schema } from '@/lib/validations/<feature>'
import { <name> as <name>Query } from '@/lib/db/queries'

export async function <name>(input: unknown) {
  const user = await requireRole('<role>')
  const data = <name>Schema.parse(input)
  return <name>Query({ ...data, userId: user.id })
}
```

### New Query

```typescript
export async function get<Name>(ctx: Ctx, id: string) {
  return prisma.<model>.findFirst({
    where: {
      id,
      hospitalId: ctx.hospitalId,
    },
  })
}
```

### New Component

```typescript
import { cn } from '@/lib/utils'

interface <Name>Props {
  // ...
}

export function <Name>({ ... }: <Name>Props) {
  return (
    <div className={cn('rounded-lg border p-4')}>
      {/* ... */}
    </div>
  )
}
```

---

## What NOT to Do

- ❌ Install new dependencies without operator approval.
- ❌ Use `any` or `// @ts-ignore`.
- ❌ Add `'use client'` to a server-data page.
- ❌ Use `fetch()` in a client component for data already available on the server.
- ❌ Persist PDFs to disk or S3.
- ❌ Send real emails/SMS in dev (the dispatcher stubs this — don't bypass).
- ❌ Log PII.
- ❌ Push to `main` directly.

---

## Pre-PR Sanity Check

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

All four must be green. No exceptions.
