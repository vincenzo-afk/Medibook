# MediBook — Hospital Appointment Booking System

> A production-grade Next.js 16 application for booking doctor appointments, managing patient flows, issuing e-prescriptions, and coordinating notifications across patients, doctors, and hospital administrators.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Database & Migrations](#database--migrations)
- [Authentication](#authentication)
- [Notifications](#notifications)
- [E-Prescriptions](#e-prescriptions)
- [Deployment](#deployment)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

MediBook is a role-aware hospital appointment platform that lets **patients** search for doctors by specialty, view real-time availability, and book or cancel appointments; lets **doctors** manage their slots, review patient history, and issue e-prescriptions; and lets **admins** oversee the entire hospital operation through a dedicated dashboard. Built on Next.js 16 with the App Router, the app uses Server Components for data-heavy pages and Server Actions for mutations, eliminating most client-side fetching boilerplate.

The platform is designed for **multi-tenant hospital deployments** — each hospital gets an isolated namespace (`hospital_id`) on every database row, allowing a single deployment to serve multiple hospitals. Authentication is fully passwordless via **Clerk** (magic link + passkey + OAuth), satisfying modern security expectations and reducing password-related support load.

All sensitive patient data (PHI) is treated as PII and protected according to the rules in [SECURITY.md](./SECURITY.md). The codebase enforces role-based access at three layers: Clerk middleware (route-level), Prisma row-level security (data-level), and Server Action guards (mutation-level).

---

## Key Features

- **Doctor Search & Discovery** — Filter by specialty, hospital, language, gender, availability, rating, and consultation fee. Full-text search on doctor name and bio.
- **Appointment Management** — Real-time slot availability with optimistic locking to prevent double-bookings. Patients can book, reschedule, or cancel; doctors can confirm, decline, or mark as completed. Auto-release of held slots after 10 minutes.
- **Role Dashboards** — Three distinct dashboards:
  - *Patient*: upcoming/past appointments, prescription history, doctor notes.
  - *Doctor*: today's schedule, patient intake forms, prescription writer, earnings.
  - *Admin*: hospital-wide metrics, doctor onboarding, no-show rates, revenue analytics.
- **Notifications** — Email reminders (Resend) sent at booking confirmation, 24h before, and 2h before the appointment. SMS reminders (Twilio) sent 2h before. Webhook delivery receipts are stored for audit.
- **E-Prescriptions** — Doctors issue structured prescriptions (medication, dosage, frequency, duration, notes) that are rendered as branded PDFs on demand. PDFs are generated server-side via `@react-pdf/renderer` and signed with a hospital digital seal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript 5.7 (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL 16 (Neon serverless) |
| ORM | Prisma 5.x |
| Auth | Clerk (passwordless — magic link, passkey, OAuth) |
| Email | Resend |
| SMS | Twilio |
| PDF | @react-pdf/renderer |
| Validation | Zod |
| Testing | Vitest + Playwright |
| Linting | ESLint + Prettier + Biome (format) |
| CI/CD | GitHub Actions → Vercel |

---

## Project Structure

```
medibook/
├── app/                      # App Router (Next.js 16)
│   ├── (auth)/               # Clerk auth routes
│   ├── (patient)/            # Patient dashboard group
│   ├── (doctor)/             # Doctor dashboard group
│   ├── (admin)/              # Admin dashboard group
│   ├── api/                  # Route handlers (webhooks only)
│   └── actions/              # Server Actions (mutations)
├── components/               # Shared UI + shadcn/ui
├── lib/
│   ├── db/                   # Prisma client + queries
│   ├── clerk/                # Role helpers, middleware
│   ├── notifications/        # Resend + Twilio clients
│   ├── prescriptions/        # PDF generation
│   └── validations/         # Zod schemas
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── proxy.ts             # Clerk route protection
├── .env.example
└── next.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20.11+ (use `nvm` or `fnm`)
- PostgreSQL 16+ (or a Neon free-tier account)
- A Clerk application (free tier works)
- Resend + Twilio accounts (free tiers work)

### Install

```bash
git clone https://github.com/your-org/medibook.git
cd medibook
pnpm install
cp .env.example .env.local
# Fill in values (see Environment Variables below)
pnpm db:push
pnpm db:seed
pnpm dev
```

App runs at `http://localhost:3000`.

---

## Environment Variables

| Key | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `DIRECT_URL` | Direct connection for migrations (Neon) | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | ✅ |
| `CLERK_SECRET_KEY` | Clerk backend key | ✅ |
| `CLERK_WEBHOOK_SECRET` | For `/api/webhooks/clerk` | ✅ |
| `RESEND_API_KEY` | Resend API token | ✅ |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | ✅ |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | ✅ |
| `TWILIO_FROM_NUMBER` | Sender phone (E.164) | ✅ |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally | ✅ |
| `SENTRY_DSN` | Error monitoring | optional |

---

## Available Scripts

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Run production server
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E tests
pnpm db:push      # Push schema changes
pnpm db:migrate   # Create migration
pnpm db:seed      # Seed sample data
pnpm db:studio    # Prisma Studio UI
```

---

## Database & Migrations

Prisma schema lives at `prisma/schema.prisma`. Core models:

- `Hospital`, `User` (synced from Clerk via webhook), `Doctor`, `Patient`
- `Appointment`, `Slot`, `Prescription`, `Medication`
- `NotificationLog`, `AuditEvent`

All tables carry `hospital_id` for multi-tenant isolation. Row-level access is enforced in `lib/db/queries.ts` through a context-bound Prisma extension.

---

## Authentication

Clerk handles all authentication flows:

- **Magic link** (default for email)
- **Passkey** (WebAuthn — encouraged for admins)
- **OAuth** (Google, Apple, Microsoft)

The Clerk webhook at `/api/webhooks/clerk` creates a `User` row on signup and assigns a default `patient` role. Admins promote users via the admin dashboard, which calls Clerk's Backend API to attach `role:admin` or `role:doctor` metadata.

`proxy.ts` enforces route protection based on Clerk session claims.

---

## Notifications

- **Email (Resend)**: Booking confirmation, 24h reminder, 2h reminder, prescription delivery.
- **SMS (Twilio)**: 2h reminder only (to control cost).

All sends are wrapped in `lib/notifications/dispatch.ts`, which logs every attempt to `NotificationLog` for audit and retry.

---

## E-Prescriptions

Doctors write prescriptions through a structured form (medication name, dosage, frequency, duration, instructions). On submit, the prescription is stored in PostgreSQL and a PDF is generated on demand via `@react-pdf/renderer`. PDFs are never stored on disk — they're streamed directly to the patient dashboard or emailed as an attachment.

---

## Deployment

Deploy to Vercel (hostable out of the box — `vercel.json` ships cron jobs):

1. Push to GitHub and import the repo in Vercel (Framework: Next.js, Package manager: pnpm).
2. Add all environment variables from `.env.example` in the Vercel dashboard.
   `CRON_SECRET` is mandatory in production — Vercel Cron sends it as the
   `Authorization: Bearer` header automatically, and the cron routes reject
   unsigned calls with 401.
3. Provision Postgres (Neon recommended) and set `DATABASE_URL` + `DIRECT_URL`.
   Run `pnpm db:migrate deploy` once against the production branch
   (e.g. `DATABASE_URL=<prod> pnpm db:migrate deploy`), or wire it into the
   Vercel build command. `postinstall` runs `prisma generate` automatically.
4. Set the Clerk webhook in production to
   `https://your-domain.com/api/webhooks/clerk`.

Cron schedule (`vercel.json`):

| Job | Schedule | Purpose |
|---|---|---|
| `/api/cron/release-holds` | every minute | release expired 10-min slot holds |
| `/api/cron/send-reminders` | hourly | 24h email + 2h email/SMS reminders |

Without keys (`DATABASE_URL`, Clerk, Resend/Twilio unset) the app runs in demo
mode on seeded in-memory data — useful for previews.

Database: Neon (serverless Postgres) is recommended for zero-downtime branching on schema changes.

---

## Testing

- **Unit tests** (Vitest): `lib/` logic — validations, slot calculations, PDF rendering.
- **Integration tests** (Vitest): Server Actions with a test database.
- **E2E tests** (Playwright): Critical user journeys — patient books appointment, doctor issues prescription, admin views dashboard.

CI runs all three layers on every PR. Coverage threshold: 80%.

---

## Roadmap

- [ ] Telemedicine (video calls via Whereby)
- [ ] Stripe payments for paid consultations
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native, sharing the API)
- [ ] FHIR-compliant export

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide. TL;DR: fork → branch `feat/your-feature` → Conventional Commits → open PR → wait for CI.

---

## License

MIT © 2026 MediBook Contributors
