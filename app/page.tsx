import Link from 'next/link'
import { ArrowRight, CalendarCheck2, ShieldCheck, Zap } from 'lucide-react'

import { getCtx } from '@/lib/clerk/roles'
import { getDoctors } from '@/lib/db/queries'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { DoctorCard } from '@/components/patient/DoctorCard'

const ROLE_HOME = { patient: '/patient', doctor: '/doctor', admin: '/admin' } as const

export default async function LandingPage() {
  const ctx = await getCtx()
  const doctors = (await getDoctors(ctx)).slice(0, 4)
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-action text-sm font-bold text-white">
            M
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">MediBook</span>
          <nav className="ml-6 hidden items-center gap-4 text-[13px] text-muted md:flex">
            <Link href="/patient/doctors" className="transition-colors hover:text-ink">
              Find doctors
            </Link>
            <Link href="/patient/appointments" className="transition-colors hover:text-ink">
              Appointments
            </Link>
            <Link href="/admin" className="transition-colors hover:text-ink">
              For hospitals
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/sign-in"
              className="flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-muted transition-colors hover:text-ink"
            >
              Sign in
            </Link>
            <Link href={ROLE_HOME[ctx.role]}>
              <Button size="sm">
                Open dashboard <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="py-14 md:py-20">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            8 specialists online · same-week availability
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            Book the right doctor in under a minute.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            Search by specialty, pick a live time slot, and get instant confirmation with
            reminders. Built for night-time booking — calm dark UI, dense information, zero
            clutter.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/patient/doctors">
              <Button size="lg">
                Find a doctor <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/patient/appointments">
              <Button size="lg" variant="secondary">
                My appointments
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-3">
            {[
              { icon: Zap, title: 'Live slots', body: 'Real availability with 10-min holds and double-booking protection.' },
              { icon: CalendarCheck2, title: 'Smart reminders', body: 'Email at booking + 24h, SMS 2h before your visit.' },
              { icon: ShieldCheck, title: 'Private by design', body: 'Role-scoped access, audit trail, PHI treated as PII.' },
            ].map((f) => (
              <div key={f.title} className="bg-panel p-4">
                <f.icon size={17} className="text-action" />
                <p className="mt-2 text-sm font-semibold text-ink">{f.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Top-rated doctors</h2>
            <Link href="/patient/doctors" className="text-[13px] font-medium text-action hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
          <Card className="mt-6">
            <CardBody className="flex flex-col items-start gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">Are you a doctor or administrator?</p>
                <p className="mt-0.5 text-[13px] text-muted">
                  Switch roles from any dashboard to explore scheduling, prescriptions, and
                  hospital analytics.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/doctor">
                  <Button variant="secondary" size="sm">Doctor view</Button>
                </Link>
                <Link href="/admin">
                  <Button variant="secondary" size="sm">Admin view</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-muted md:flex-row md:items-center">
          <span>MediBook © 2026 · Demo build — synthetic data only, no real PHI.</span>
          <span className="md:ml-auto">Canvas #0B0F19 · Panel #161F30 · Action #2563EB</span>
        </div>
      </footer>
    </div>
  )
}
