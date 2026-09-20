# Contributing to MediBook

Thanks for considering a contribution! This doc covers the full workflow — from cloning to landing your PR. Read it once, reference it often.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Project Context](#project-context)
3. [Development Setup](#development-setup)
4. [Branching Strategy](#branching-strategy)
5. [Commit Conventions](#commit-conventions)
6. [Pull Request Workflow](#pull-request-workflow)
7. [Code Review Checklist](#code-review-checklist)
8. [Testing Requirements](#testing-requirements)
9. [Database Changes](#database-changes)
10. [Security & PII](#security--pii)
11. [Releases](#releases)

---

## Code of Conduct

Be kind. Be specific. Be patient. Assume good intent. Disagreements about code are fine — personal attacks are not. We follow the [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Project Context

MediBook is a hospital appointment booking platform. Patients search for doctors and book appointments. Doctors manage their schedules and issue e-prescriptions. Admins oversee the hospital operation.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 + shadcn/ui · Prisma 5 · PostgreSQL 16 · Clerk (passwordless) · Resend (email) · Twilio (SMS) · `@react-pdf/renderer` (PDFs).

Multi-tenant: every DB row carries `hospital_id`. The Clerk session provides the hospital context — never trust a `hospitalId` from the request body.

Read `ARCHITECTURE.md` for the system design and `SECURITY.md` for the threat model before contributing features that touch data flow.

---

## Development Setup

### Prerequisites

- Node.js 20.11+ (use `fnm` or `nvm`)
- pnpm 9+ (`corepack enable`)
- PostgreSQL 16+ (or a Neon free-tier account)
- A Clerk application (free tier works)
- Resend + Twilio accounts (free tiers work)

### Bootstrap

```bash
git clone https://github.com/your-org/medibook.git
cd medibook
pnpm install
cp .env.example .env.local
# Fill in values (see README.md → Environment Variables)
pnpm db:push
pnpm db:seed
pnpm dev
```

App runs at `http://localhost:3000`. Clerk dev instance runs at `http://localhost:3001` (or wherever Clerk's dev server points to).

### Recommended Editor Setup

- VS Code or Cursor with:
  - ESLint extension
  - Prettier extension (format on save — but Biome handles format too)
  - Tailwind CSS IntelliSense
  - Prisma extension
  - TypeScript strict mode enabled

---

## Branching Strategy

We use a simplified GitHub Flow.

| Branch | Purpose |
|---|---|
| `main` | Production-ready. Always deployable. Protected. |
| `feat/<scope>-<short-name>` | New feature, e.g., `feat/doctor-slot-calendar` |
| `fix/<scope>-<short-name>` | Bug fix, e.g., `fix/auth-redirect-loop` |
| `chore/<short-name>` | Tooling, deps, configs, e.g., `chore/bump-prisma` |
| `docs/<short-name>` | Docs only, e.g., `docs/api-route-reference` |

**Rules:**

- Branch off `main`, rebase onto `main` before PR.
- One PR per branch. One logical change per PR.
- Delete your branch after merge.
- Never push to `main` directly. PRs require review.

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint.

```
<type>(<scope>): <subject>

<optional body — wrap at 72 chars>

<optional footer>
```

### Types

| Type | Use For |
|---|---|
| `feat` | New user-visible feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither adds a feature nor fixes a bug |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `docs` | Documentation only |
| `chore` | Tooling, deps, configs |
| `style` | Code style (formatting, etc.) — no logic change |
| `ci` | CI/CD changes |
| `build` | Build system changes |
| `revert` | Reverting a previous commit |

### Scopes

`patient`, `doctor`, `admin`, `auth`, `db`, `notifications`, `prescriptions`, `ui`, `api`, `tests`, `config`, `deps`.

### Examples

```
feat(doctor): add slot availability calendar with optimistic locking

Implements /doctor/slots page with drag-to-create slots, server-side
double-booking prevention via Prisma transaction, and a 10-minute hold
release timer triggered by the cron at /api/cron/release-holds.

Closes #142
```

```
fix(auth): correct redirect target after Clerk sign-in

Previously redirected to /dashboard regardless of role. Now respects
role-based default routes: patients → /patient, doctors → /doctor,
admins → /admin.
```

---

## Pull Request Workflow

### 1. Open a Draft PR Early

Open a draft PR as soon as you have something to show. This lets reviewers see your direction early and avoids big-bang reviews.

### 2. PR Template

Fill out the PR template (`.github/pull_request_template.md`):

```markdown
## Summary
<!-- 1-3 sentences. What does this PR do? -->

## Motivation
<!-- Why? Link issues: Closes #123 -->

## Changes
<!-- Bullet list of what changed -->

## Screenshots / Recordings
<!-- For UI changes only -->

## Checklist
- [ ] Tests added
- [ ] Docs updated (if applicable)
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass
- [ ] No PII in logs
- [ ] No new dependencies without approval
```

### 3. CI Must Be Green

CI runs `typecheck`, `lint`, `unit tests`, `build`. All must pass before review.

### 4. Review Requirements

- 1 approval from a maintainer for non-PHI-touching changes.
- 2 approvals for changes touching auth, payments, or PII flow.
- No direct pushes to `main`. Always squash-merge via GitHub UI.

### 5. After Merge

- Delete your branch.
- Pull `main` and rebase any in-flight branches.
- Update the issue tracker if relevant.

---

## Code Review Checklist

Reviewers should verify:

### Correctness

- [ ] Logic matches the PR description.
- [ ] Edge cases handled (empty inputs, concurrent writes, null fields).
- [ ] Multi-tenant filter present on every query.
- [ ] Zod validation present on every Server Action and webhook.

### Architecture

- [ ] No raw `prisma.*` calls outside `lib/db/queries.ts`.
- [ ] No `'use client'` on data-fetching pages.
- [ ] No `console.log` — uses `lib/logger.ts`.
- [ ] New routes registered in `proxy.ts` if protected.
- [ ] No new top-level dependencies without approval.

### Security

- [ ] No PII in logs (patient name, email, phone, prescription content, diagnosis).
- [ ] No `hospitalId` read from the request body.
- [ ] No secrets in env-less contexts.
- [ ] New endpoints check Clerk session claims.
- [ ] No silent error swallowing.

### Testing

- [ ] Unit tests cover non-trivial logic.
- [ ] At least one integration test for the Server Action.
- [ ] At least one E2E test for user-visible flows.
- [ ] Tests use seeded fixtures, not invented IDs.

### Style

- [ ] TypeScript strict — no `any`, no `// @ts-ignore`.
- [ ] Tailwind only — no inline styles.
- [ ] Named exports for components and utilities.
- [ ] Conventional Commit message.

---

## Testing Requirements

### Unit Tests (Vitest)

- Live next to the code: `lib/foo/foo.test.ts` for `lib/foo/foo.ts`.
- Use `describe`/`it`/`expect`. Mock external services.
- Coverage floor: 80% lines, 80% branches.

### Integration Tests (Vitest)

- Live in `tests/integration/`.
- Use a dedicated test database (`DATABASE_URL` in `.env.test`).
- Test Server Actions end-to-end: input validation → DB mutation → response.

### E2E Tests (Playwright)

- Live in `tests/e2e/`.
- Cover critical user journeys:
  - Patient searches for a doctor and books an appointment.
  - Doctor views today's schedule and issues a prescription.
  - Admin views the hospital dashboard and filters by date.
- Run against `pnpm dev` server on a seeded test DB.

### CI Pipeline

Runs on every PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`
6. `pnpm test:e2e` (only on Linux runners; uses a fresh Neon branch)

All steps must be green for merge.

---

## Database Changes

### Schema Changes

- Edit `prisma/schema.prisma`.
- Generate a migration: `pnpm db:migrate <name>` — name should be descriptive, e.g., `add_prescription_signed_url`.
- Never edit an existing migration once it's on `main`. Always add a new one.
- Multi-tenant models must include `hospitalId` as a foreign key.

### Migrations in Review

- Reviewers must read every migration line-by-line.
- Destructive operations (`DROP COLUMN`, `DROP TABLE`) require a deprecation cycle: ship a backward-compatible change first, then drop after one release.
- For Neon: test migrations against a branch (`neon branches create`) before merging.

### Seed Data

- `prisma/seed.ts` provides deterministic fixtures: `patient-1`, `doctor-1`, `admin-1`.
- Tests and E2E rely on these IDs — don't change them.
- Never include real patient data in seeds.

---

## Security & PII

MediBook handles PHI (Protected Health Information). Treat all patient-related fields as PII. Read `SECURITY.md` for the full threat model.

### Hard Rules

- **Never log PII** — patient name, email, phone, prescription content, diagnosis, doctor notes. Logging IDs is fine.
- **Never return PII in error messages** — generic "Something went wrong" only.
- **Never trust client-supplied `hospitalId`** — always from the Clerk session.
- **Never commit real patient records** — even in test fixtures.
- **Never disable Clerk session checks** in dev — use the dev Clerk instance instead.

### Reporting Vulnerabilities

Found a security issue? Email `security@medibook.example` with details. Do NOT open a public issue. We respond within 72 hours and credit reporters in release notes (unless you prefer to remain anonymous).

---

## Releases

- We use [Changesets](https://github.com/changesets/changesets) for versioning.
- Add a changeset with every PR that affects users: `pnpm changeset`.
- Releases happen weekly (or on-demand for hotfixes).
- Changelog is generated from merged changesets.

---

## Questions?

- **Architecture / "how should I do X?"** — open a Discussion on GitHub.
- **Bug / unexpected behavior** — open an Issue with reproduction steps.
- **Security / PII concern** — email `security@medibook.example`.

Happy hacking!
