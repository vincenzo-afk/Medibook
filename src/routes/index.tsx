import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock3, MapPin, Search, ShieldCheck, Stethoscope, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const doctors = [
  { id: '1', name: 'Dr. Maya Chen', specialty: 'Cardiology', hospital: 'Northstar Medical Center', location: 'Downtown', experience: '14 yrs', next: 'Today, 3:30 PM', initials: 'MC', tone: 'bg-primary/10 text-primary' },
  { id: '2', name: 'Dr. Jonathan Reed', specialty: 'Dermatology', hospital: 'Riverside Health', location: 'West End', experience: '9 yrs', next: 'Tomorrow, 10:00 AM', initials: 'JR', tone: 'bg-accent/40 text-accent-foreground' },
  { id: '3', name: 'Dr. Aisha Patel', specialty: 'Pediatrics', hospital: 'Northstar Medical Center', location: 'Downtown', experience: '12 yrs', next: 'Today, 5:00 PM', initials: 'AP', tone: 'bg-secondary text-secondary-foreground' },
]
const slots = ['09:30 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:00 PM']

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'CareFlow · Find care that fits your life' },
    { name: 'description', content: 'Search trusted doctors and book a hospital appointment in a few simple steps.' },
  ] }),
  component: Home,
})

function Home() {
  const [query, setQuery] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<(typeof doctors)[number] | null>(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [booked, setBooked] = useState(false)
  const filteredDoctors = useMemo(() => doctors.filter(doctor => `${doctor.name} ${doctor.specialty} ${doctor.hospital}`.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <main className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <a href="/" className="flex items-center gap-2.5" aria-label="CareFlow home">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Stethoscope className="size-5" /></span>
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">CareFlow</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Primary navigation">
          <a className="transition-colors hover:text-foreground" href="#find-care">Find care</a>
          <a className="transition-colors hover:text-foreground" href="#how-it-works">How it works</a>
          <a className="transition-colors hover:text-foreground" href="#for-providers">For providers</a>
        </nav>
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button><Button size="sm" className="rounded-full px-4">Create account</Button></div>
      </header>

      <section className="relative overflow-hidden border-y border-border/70 bg-secondary/35" id="find-care">
        <div className="pointer-events-none absolute -right-20 -top-32 size-96 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-28 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-24">
          <div className="animate-fade-in max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/75 px-3 py-1.5 text-xs font-medium text-primary shadow-sm"><ShieldCheck className="size-3.5" /> Trusted care, without the back-and-forth</div>
            <h1 className="max-w-xl font-serif text-5xl leading-[1.04] tracking-tight text-foreground sm:text-6xl">Healthcare that starts with a <span className="text-primary">simple next step.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">Find the right doctor, see real availability, and book an appointment in minutes.</p>
            <div className="mt-9 flex max-w-xl flex-col gap-2 rounded-2xl border border-border bg-background p-2 shadow-lg sm:flex-row">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search doctors or specialties" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search doctor, specialty, or hospital" className="h-11 border-0 pl-10 shadow-none focus-visible:ring-0" /></div>
              <Button className="h-11 rounded-xl px-5" onClick={() => document.getElementById('doctor-results')?.scrollIntoView({ behavior: 'smooth' })}>Find care <ArrowRight className="size-4" /></Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>Popular:</span>{['Cardiology', 'Dermatology', 'Pediatrics'].map(item => <button key={item} onClick={() => setQuery(item)} className="rounded-full border border-border bg-background px-3 py-1.5 transition-colors hover:border-primary/40 hover:text-primary">{item}</button>)}</div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:ml-auto">
            <div className="absolute -left-5 top-12 hidden rounded-xl border border-border bg-background p-3 shadow-lg sm:block"><div className="flex items-center gap-2 text-xs font-medium"><span className="size-2 rounded-full bg-primary" /> Live availability</div><p className="mt-1 text-[11px] text-muted-foreground">Updated just now</p></div>
            <Card className="overflow-hidden rounded-3xl border-primary/10 shadow-lg"><div className="bg-primary px-6 py-5 text-primary-foreground"><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground/70">Your next appointment</p><p className="mt-3 font-serif text-2xl">A calmer way to care for yourself.</p></div><CardContent className="space-y-4 p-6"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-full bg-accent/50 text-sm font-semibold text-accent-foreground">MC</div><div><p className="font-semibold">Dr. Maya Chen</p><p className="text-sm text-muted-foreground">Cardiology · Northstar Medical</p></div></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/70 p-3"><CalendarDays className="mb-2 size-4 text-primary" /><p className="text-xs text-muted-foreground">Date</p><p className="mt-1 text-sm font-semibold">Tue, Oct 14</p></div><div className="rounded-xl bg-muted/70 p-3"><Clock3 className="mb-2 size-4 text-primary" /><p className="text-xs text-muted-foreground">Time</p><p className="mt-1 text-sm font-semibold">03:30 PM</p></div></div><div className="flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><Video className="size-4 text-primary" /> In-person consultation <span className="ml-auto font-medium text-primary">Confirmed</span></div></CardContent></Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8" id="doctor-results">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-primary">Available near you</p><h2 className="mt-2 font-serif text-3xl tracking-tight sm:text-4xl">Find care that fits your day</h2><p className="mt-2 text-sm text-muted-foreground">Real-time availability from trusted providers.</p></div><button className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">View all doctors <ChevronRight className="size-4" /></button></div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">{filteredDoctors.map(doctor => <DoctorCard key={doctor.id} doctor={doctor} onSelect={() => { setSelectedDoctor(doctor); setBooked(false); setSelectedSlot('') }} />)}</div>
        {filteredDoctors.length === 0 && <div className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No doctors found. Try a different specialty or hospital.</div>}
      </section>

      <section className="border-y border-border/70 bg-muted/35" id="how-it-works"><div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"><div><p className="text-sm font-semibold text-primary">How CareFlow works</p><h2 className="mt-2 max-w-sm font-serif text-3xl tracking-tight">Less time coordinating. More time feeling cared for.</h2></div><div className="grid gap-8 sm:grid-cols-3">{[['01', 'Search', 'Tell us what kind of care you need.'], ['02', 'Choose a time', 'See live availability that works for you.'], ['03', 'You’re booked', 'Get a clear confirmation and reminders.']].map(([number, title, copy]) => <div key={number}><span className="font-mono text-xs text-primary">{number}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div>)}</div></div></div></section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>© 2025 CareFlow Health. Care, made simpler.</p><div className="flex gap-5"><a href="#find-care" className="hover:text-foreground">Privacy</a><a href="#find-care" className="hover:text-foreground">Accessibility</a><a href="#for-providers" className="hover:text-foreground">For providers</a></div></footer>
      {selectedDoctor && <BookingPanel doctor={selectedDoctor} selectedSlot={selectedSlot} booked={booked} onClose={() => setSelectedDoctor(null)} onSlotSelect={setSelectedSlot} onBook={() => setBooked(true)} />}
    </main>
  )
}

function DoctorCard({ doctor, onSelect }: { doctor: (typeof doctors)[number]; onSelect: () => void }) {
  return <Card className="group rounded-2xl border-border/80 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"><CardContent className="p-5"><div className="flex items-start justify-between"><div className={`flex size-12 items-center justify-center rounded-2xl text-sm font-semibold ${doctor.tone}`}>{doctor.initials}</div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">Available</span></div><h3 className="mt-5 font-semibold">{doctor.name}</h3><p className="mt-1 text-sm text-primary">{doctor.specialty}</p><div className="mt-4 space-y-2 text-xs text-muted-foreground"><p className="flex items-center gap-2"><MapPin className="size-3.5" />{doctor.hospital} · {doctor.location}</p><p className="flex items-center gap-2"><Clock3 className="size-3.5" />Next: {doctor.next}</p></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-muted-foreground">{doctor.experience} experience</span><Button variant="ghost" size="sm" onClick={onSelect} className="gap-1 px-2 text-primary hover:text-primary">View times <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></Button></div></CardContent></Card>
}

function BookingPanel({ doctor, selectedSlot, booked, onClose, onSlotSelect, onBook }: { doctor: (typeof doctors)[number]; selectedSlot: string; booked: boolean; onClose: () => void; onSlotSelect: (slot: string) => void; onBook: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Book an appointment"><div className="w-full max-w-lg rounded-t-3xl bg-background p-6 shadow-lg sm:rounded-3xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Book an appointment</p><h2 className="mt-2 font-serif text-2xl">{booked ? 'You’re all set.' : `Choose a time with ${doctor.name}`}</h2></div><button onClick={onClose} aria-label="Close booking dialog" className="rounded-full p-2 text-muted-foreground hover:bg-muted">×</button></div>{booked ? <div className="mt-8 rounded-2xl bg-secondary p-5"><div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-5" /></div><p className="mt-4 font-semibold">Appointment requested</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Your visit with {doctor.name} is booked for {selectedSlot} today. We’ll keep your confirmation here.</p><Button className="mt-5 w-full" onClick={onClose}>Done</Button></div> : <><div className="mt-6 flex items-center gap-3 rounded-2xl bg-muted/60 p-4"><div className={`flex size-10 items-center justify-center rounded-full text-xs font-semibold ${doctor.tone}`}>{doctor.initials}</div><div><p className="font-medium">{doctor.specialty}</p><p className="text-xs text-muted-foreground">Today · {doctor.hospital}</p></div></div><p className="mt-6 text-sm font-semibold">Available today</p><div className="mt-3 grid grid-cols-3 gap-2">{slots.map(slot => <button key={slot} onClick={() => onSlotSelect(slot)} className={`rounded-xl border px-2 py-3 text-sm transition-colors ${selectedSlot === slot ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary/50 hover:bg-secondary'}`}>{slot}</button>)}</div><Button disabled={!selectedSlot} onClick={onBook} className="mt-7 h-11 w-full">Confirm {selectedSlot || 'a time'} <ArrowRight className="size-4" /></Button><p className="mt-3 text-center text-[11px] text-muted-foreground">You can reschedule or cancel anytime from your appointments.</p></>}</div></div>
}
