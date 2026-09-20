# AGENTS.md

> Conventions for AI coding agents (Codex, OpenAI agent runtime, Cursor, Claude Code, Copilot, etc.) operating in this repository. Read this file before any code action.

---

## 1. Project Identity

**Repo:** `medibook` — Hospital appointment booking system
**Stack:** Next.js 16 (App Router) · TypeScript 5.7 strict · Tailwind v4 · Prisma 5 · PostgreSQL 16 · Clerk (passwordless auth)
**Scope:** Patient booking + doctor scheduling + admin dashboard + notifications + e-prescriptions

If you are unsure whether an action fits the scope, **stop and ask the operator** rather than guessing.

---

## 2. Allowed Operations

You MAY:

- Read any file in the repository.
- Write or edit files under `app/`, `components/`, `lib/`, `prisma/`, `tests/`, `scripts/`.
- Run `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:push`, `pnpm db:seed`.
- Create new files that follow the existing patterns in their parent directory.
- Modify `schema.prisma` and generate migrations — but only when explicitly instructed by the operator.
- Create a new git branch: `git checkout -b feat/<short-name>`.
- Stage and commit changes using Conventional Commits (see §6).

You MAY NOT, without explicit human approval:

- Push to `main` or any release branch.
- Run `pnpm db:migrate deploy` against a production `DATABASE_URL`.
- Modify `.github/workflows/*`, `vercel.json`, or any CI/CD config.
- Delete migrations or squash migration history.
- Modify Clerk dashboard settings or rotate secrets.
- Install new top-level dependencies. Open a PR proposing them instead.
- Send real emails or SMS in dev — always use the test stubs in `lib/notifications/stub.ts`.

---

## 3. Build, Test, Lint Commands

Before declaring a task complete, ALL of these must pass:

```bash
pnpm typecheck    # tsc --noEmit — zero errors
pnpm lint         # ESLint — zero errors (warnings acceptable in WIP)
pnpm test         # Vitest unit tests — must stay green
pnpm build        # Production build — must succeed
```

For E2E:

```bash
pnpm test:e2e     # Playwright — run only on a local dev DB
```

If any command fails, **fix it before opening a PR**. Do not mark the task complete with red CI.

---

## 4. Architecture Quick Reference

Read these files before writing any feature code:

| File | Why |
|---|---|
| `ARCHITECTURE.md` | System design, data flow, multi-tenancy model |
| `prisma/schema.prisma` | All data models — every feature touches at least one |
| `lib/db/queries.ts` | Authorized query layer — never bypass with raw Prisma calls in routes |
| `lib/clerk/roles.ts` | Role checks — every Server Action calls `requireRole()` |
| `proxy.ts` | Route-level protection — add new protected routes here |
| `lib/validations/*.ts` | Zod schemas — every mutation must validate input |

**Rule:** Server Components fetch via `lib/db/queries.ts`. Server Actions validate input with Zod, then call `lib/db/queries.ts`. Route handlers (`app/api/*`) are reserved for webhooks only.

---

## 5. Code Style

- **TypeScript strict mode** — no `any`, no `// @ts-ignore`, no `as unknown as`.
- **Server-first** — default to Server Components. Add `'use client'` only when interactivity is required.
- **No `useState` for server data** — use Server Components for initial render, pass to client components as props.
- **Zod for every boundary** — every Server Action and webhook handler validates its input.
- **No `console.log` in committed code** — use `lib/logger.ts` which respects env.
- **Import order:** Node builtins → external packages → `@/lib` → `@/components` → relative. ESLint enforces this.
- **Naming:** `PascalCase` for components and types, `camelCase` for functions and variables, `SCREAMING_SNAKE_CASE` for env constants, `kebab-case` for filenames (except component files).
- **Tailwind only** — no inline `style={}` attributes unless absolutely necessary. No CSS modules.

---

## 6. Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `style`, `ci`, `build`, `revert`.

Scopes: `patient`, `doctor`, `admin`, `auth`, `db`, `notifications`, `prescriptions`, `ui`, `api`, `tests`, `config`.

Example:
```
feat(doctor): add slot availability calendar with optimistic locking

Implements /doctor/slots page with drag-to-create slots, server-side
double-booking prevention, and a 10-minute hold release timer.
```

---

## 7. Testing Requirements

Every new feature PR must include:

- **Unit tests** for any non-trivial function in `lib/`.
- **At least one integration test** for the Server Action or webhook touched.
- **At least one E2E test** for any user-visible flow.

Tests live next to the code they test: `lib/slots/calc.test.ts` for `lib/slots/calc.ts`.

Use the seeded test fixtures in `prisma/seed.ts` — do not invent IDs.

---

## 8. When You're Stuck

1. Read `ARCHITECTURE.md` again.
2. Search the codebase for similar patterns (use `rg`).
3. Check `CONTRIBUTING.md` for gotchas.
4. If still stuck, **stop and ask the operator**. Do not invent patterns that don't exist in the codebase.

---

## 9. Output Expectations

When you finish a task, summarize:

- Files created/modified (paths only — no code dumps).
- Tests added.
- Commands run + their results.
- Any decisions you made that the operator should review.

Keep summaries under 200 words. Operators read many of these.

---

## 10. Security Posture

MediBook handles PHI (Protected Health Information). Treat every patient-related field as PII. See `SECURITY.md` for the full threat model and safe-handling rules. When in doubt, **do not log** patient data, **do not return** patient data in API errors, and **do not commit** real patient records even in test fixtures.
