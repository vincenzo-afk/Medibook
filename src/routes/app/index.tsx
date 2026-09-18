import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, Check, Clock3, HeartPulse, LogIn, MoreHorizontal, RefreshCw, Search, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BlinkClientBoundary } from '@/components/BlinkClientBoundary'
import { blink } from '@/blink/client'
import { subscribeToAuth, signOut, type CareFlowUser } from '@/lib/auth'
import { fallbackDoctors, demoSlots, initials, userMessage, type Doctor } from '@/lib/careflow-data'
import type { AppointmentsRow, DoctorsRow, NotificationsRow, QueueEntriesRow, UserProfilesRow } from '@/lib/db-types'

export const Route = createFileRoute('/app/')({
  head: () => ({ meta: [{ title: 'CareFlow · Appointments' }, { name: 'description', content: 'Manage your CareFlow appointments and care queue.' }] }),
  component: () => <BlinkClientBoundary fallback={<LoadingScreen />}><CareFlowApp /></BlinkClientBoundary>,
})

type Tab = 'appointments' | 'queue' | 'admin'

function LoadingScreen() { return <div className="flex min-h-dvh items-center justify-center bg-background"><div className="flex items-center gap-3 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin text-primary" /> Loading your care workspace…</div></div> }

function CareFlowApp() {
  const [user, setUser] = useState<CareFlowUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('appointments')
  useEffect(() => subscribeToAuth((nextUser, loading) => { setUser(nextUser); if (!loading) setAuthLoading(false) }), [])
  if (authLoading) return <LoadingScreen />
  if (!user) return <AuthGate />
  return <Workspace user={user} tab={tab} onTabChange={setTab} onSignOut={signOut} />
}

function AuthGate() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      if (mode === 'signup') await blink.auth.signUp({ email, password, metadata: { displayName: name } })
      else await blink.auth.signInWithEmail(email, password)
    } catch (err) { setError(userMessage(err)) } finally { setBusy(false) }
  }
  return <main className="flex min-h-dvh items-center justify-center bg-secondary/40 px-5 py-10"><Card className="w-full max-w-md rounded-3xl shadow-lg"><CardHeader className="space-y-4 p-7 sm:p-9"><div className="flex items-center gap-2 text-primary"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><HeartPulse className="size-5" /></span><span className="font-serif text-xl font-semibold text-foreground">CareFlow</span></div><div><CardTitle className="font-serif text-3xl">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</CardTitle><p className="mt-2 text-sm text-muted-foreground">{mode === 'signup' ? 'Create an account before booking an appointment.' : 'Sign in to see appointments, reminders, and your care history.'}</p></div></CardHeader><CardContent className="p-7 pt-0 sm:p-9 sm:pt-0"><form onSubmit={submit} className="space-y-4">{mode === 'signup' && <label className="block text-sm font-medium">Full name<Input required value={name} onChange={event => setName(event.target.value)} className="mt-2" placeholder="Jordan Williams" /></label>}<label className="block text-sm font-medium">Email<Input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2" placeholder="you@example.com" /></label><label className="block text-sm font-medium">Password<Input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2" placeholder="At least 8 characters" /></label>{error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button disabled={busy} className="h-11 w-full">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'} <LogIn className="size-4" /></Button></form><button className="mt-5 w-full text-sm text-primary hover:underline" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New to CareFlow? Create an account'}</button></CardContent></Card></main>
}

function Workspace({ user, tab, onTabChange, onSignOut }: { user: CareFlowUser; tab: Tab; onTabChange: (tab: Tab) => void; onSignOut: () => Promise<void> }) {
  const [profile, setProfile] = useState<UserProfilesRow | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationsRow[]>([])
  const [appointments, setAppointments] = useState<AppointmentsRow[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>(fallbackDoctors)
  const [queue, setQueue] = useState<QueueEntriesRow[]>([])
  const profileTable = blink.db.table<UserProfilesRow>('user_profiles')
  const appointmentTable = blink.db.table<AppointmentsRow>('appointments')
  const doctorsTable = blink.db.table<DoctorsRow>('doctors')
  const notificationTable = blink.db.table<NotificationsRow>('notifications')
  const queueTable = blink.db.table<QueueEntriesRow>('queue_entries')

  async function load() {
    try {
      const [profiles, appts, dbDoctors, notes, dbQueue] = await Promise.all([
        profileTable.list({ where: { userId: user.id }, limit: 1 }),
        appointmentTable.list({ where: { patientUserId: user.id }, orderBy: { appointmentDate: 'asc' } }),
        doctorsTable.list({ where: { isActive: '1' }, orderBy: { name: 'asc' } }),
        notificationTable.list({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, limit: 20 }),
        queueTable.list({ orderBy: { appointmentTime: 'asc' }, limit: 30 }),
      ])
      setProfile(profiles[0] ?? null); setAppointments(appts); if (dbDoctors.length) setDoctors(dbDoctors); setNotifications(notes); setQueue(dbQueue)
    } catch (err) { console.warn('CareFlow data load:', userMessage(err)) } finally { setRoleLoading(false) }
  }
  useEffect(() => { void load() }, [user.id])
  const role = profile?.role ?? 'patient'
  const isStaff = role === 'doctor' || role === 'receptionist' || role === 'admin'
  const displayName = profile?.fullName || user.displayName || user.email.split('@')[0]
  async function book(doctor: Doctor, slot: string) {
    const date = new Date().toISOString().slice(0, 10)
    const appointment = await appointmentTable.create({ patientUserId: user.id, patientName: displayName, patientEmail: user.email, doctorId: doctor.id, doctorName: doctor.name, specialty: doctor.specialty, appointmentDate: date, appointmentTime: slot, status: 'BOOKED', reason: 'General consultation' })
    await notificationTable.create({ userId: user.id, appointmentId: appointment.id, title: 'Appointment booked', body: `${doctor.name} · ${slot}`, kind: 'confirmation', read: false })
    await load()
  }
  async function updateAppointment(id: string, patch: Partial<AppointmentsRow>) { await appointmentTable.update(id, { ...patch, updatedAt: new Date().toISOString() }); await load() }
  return <div className="min-h-dvh bg-background"><header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8"><a href="/" className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><HeartPulse className="size-4" /></span><span className="font-serif text-lg font-semibold">CareFlow</span></a><div className="flex items-center gap-2"><span className="hidden text-sm text-muted-foreground sm:inline">{displayName}</span><Button variant="ghost" size="sm" onClick={() => void onSignOut()}>Sign out</Button></div></div><nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-3 lg:px-8" aria-label="Workspace navigation">{([['appointments', 'Appointments', CalendarDays], ...(isStaff ? [['queue', 'Daily queue', UsersRound] as const] : []), ...(role === 'admin' ? [['admin', 'Admin', MoreHorizontal] as const] : [])] as const).map(([value, label, Icon]) => <button key={value} onClick={() => onTabChange(value)} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${tab === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon className="size-4" />{label}</button>)}</nav></header><main className="mx-auto max-w-7xl px-5 py-8 lg:px-8"><div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-primary">{roleLoading ? 'Your care space' : role === 'patient' ? 'Patient portal' : `${role[0].toUpperCase()}${role.slice(1)} workspace`}</p><h1 className="mt-1 font-serif text-4xl tracking-tight">{tab === 'appointments' ? 'Your appointments' : tab === 'queue' ? 'Today’s patient queue' : 'Hospital overview'}</h1><p className="mt-2 text-sm text-muted-foreground">{tab === 'appointments' ? 'Keep every visit, reminder, and next step in one calm place.' : tab === 'queue' ? 'Stay ahead of the day without losing the human touch.' : 'Manage care operations with a clear view of what needs attention.'}</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-primary" /> Data synced just now</div></div>{tab === 'appointments' && <PatientAppointments appointments={appointments} doctors={doctors} onBook={book} onUpdate={updateAppointment} notifications={notifications} />}{tab === 'queue' && <DailyQueue queue={queue} onUpdate={async (id, status) => { await queueTable.update(id, { status, updatedAt: new Date().toISOString() }); await load() }} />}{tab === 'admin' && <AdminView doctors={doctors} appointments={appointments} />}</main></div>
}

function PatientAppointments({ appointments, doctors, notifications, onBook, onUpdate }: { appointments: AppointmentsRow[]; doctors: Doctor[]; notifications: NotificationsRow[]; onBook: (doctor: Doctor, slot: string) => Promise<void>; onUpdate: (id: string, patch: Partial<AppointmentsRow>) => Promise<void> }) {
  const [search, setSearch] = useState('')
  const upcoming = appointments.filter(item => !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(item.status))
  const history = appointments.filter(item => ['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(item.status))
  return <div className="grid gap-8 xl:grid-cols-[1fr_330px]"><div className="space-y-8"><section><SectionHeading icon={CalendarDays} title="Upcoming" count={upcoming.length} /><div className="mt-4 space-y-3">{upcoming.map(item => <AppointmentRow key={item.id} appointment={item} onUpdate={onUpdate} />)}{upcoming.length === 0 && <EmptyState text="No upcoming appointments yet." />}</div></section><section><SectionHeading icon={Clock3} title="Find a new appointment" count={doctors.length} /><div className="relative mt-4"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Search specialty or doctor" /></div><div className="mt-4 grid gap-3 md:grid-cols-2">{doctors.filter(doctor => `${doctor.name} ${doctor.specialty}`.toLowerCase().includes(search.toLowerCase())).map(doctor => <BookingCard key={doctor.id} doctor={doctor} onBook={onBook} />)}</div></section>{history.length > 0 && <section><SectionHeading icon={Check} title="Past visits" count={history.length} /><div className="mt-4 space-y-3">{history.map(item => <AppointmentRow key={item.id} appointment={item} onUpdate={onUpdate} />)}</div></section>}</div><aside className="space-y-4"><Card className="rounded-2xl"><CardHeader><CardTitle className="text-sm">Reminders</CardTitle></CardHeader><CardContent className="space-y-3 pt-0">{notifications.length ? notifications.slice(0, 4).map(note => <div key={note.id} className="border-l-2 border-primary pl-3"><p className="text-sm font-medium">{note.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{note.body}</p></div>) : <p className="text-sm text-muted-foreground">Your appointment reminders will appear here.</p>}</CardContent></Card><Card className="rounded-2xl bg-secondary/60"><CardContent className="p-5"><p className="text-sm font-semibold">Need to change plans?</p><p className="mt-2 text-xs leading-5 text-muted-foreground">You can reschedule or cancel an upcoming visit from its appointment card.</p></CardContent></Card></aside></div>
}

function AppointmentRow({ appointment, onUpdate }: { appointment: AppointmentsRow; onUpdate: (id: string, patch: Partial<AppointmentsRow>) => Promise<void> }) { const [busy, setBusy] = useState(false); async function change(patch: Partial<AppointmentsRow>) { setBusy(true); try { await onUpdate(appointment.id, patch) } finally { setBusy(false) } } return <Card className="rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary"><HeartPulse className="size-5" /></div><div><p className="font-semibold">{appointment.doctorName}</p><p className="mt-1 text-sm text-primary">{appointment.specialty}</p><p className="mt-2 text-xs text-muted-foreground">{appointment.appointmentDate} · {appointment.appointmentTime}</p></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{appointment.status}</span>{!['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status) && <><Button disabled={busy} variant="outline" size="sm" onClick={() => void change({ appointmentTime: demoSlots[(demoSlots.indexOf(appointment.appointmentTime) + 1) % demoSlots.length], status: 'RESCHEDULED' })}>Reschedule</Button><Button disabled={busy} variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void change({ status: 'CANCELLED' })}>Cancel</Button></>}</div></CardContent></Card> }

function BookingCard({ doctor, onBook }: { doctor: Doctor; onBook: (doctor: Doctor, slot: string) => Promise<void> }) { const [slot, setSlot] = useState(demoSlots[0]); const [busy, setBusy] = useState(false); async function submit() { setBusy(true); try { await onBook(doctor, slot) } finally { setBusy(false) } } return <Card className="rounded-2xl"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(doctor.name)}</div><div><p className="font-semibold">{doctor.name}</p><p className="text-xs text-primary">{doctor.specialty}</p></div></div><p className="mt-3 text-xs text-muted-foreground">{doctor.hospital} · {doctor.location}</p><div className="mt-4 flex gap-2"><select aria-label={`Choose time for ${doctor.name}`} value={slot} onChange={event => setSlot(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs"><option>09:30 AM</option>{demoSlots.slice(1).map(time => <option key={time}>{time}</option>)}</select><Button disabled={busy} size="sm" onClick={() => void submit()}>{busy ? 'Booking…' : 'Book'}</Button></div></CardContent></Card> }

function DailyQueue({ queue, onUpdate }: { queue: QueueEntriesRow[]; onUpdate: (id: string, status: string) => Promise<void> }) { return <div className="grid gap-4 lg:grid-cols-[1fr_320px]"><div className="space-y-3">{queue.map((item, index) => <Card key={item.id} className="rounded-2xl"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><span className="font-mono text-sm text-primary">{item.queueNumber || String(index + 1).padStart(2, '0')}</span><div><p className="font-semibold">{item.patientName}</p><p className="mt-1 text-xs text-muted-foreground">Appointment {item.appointmentTime}</p></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{item.status}</span>{item.status === 'WAITING' && <Button size="sm" onClick={() => void onUpdate(item.id, 'CALLED')}>Call patient</Button>}{item.status === 'CALLED' && <Button size="sm" onClick={() => void onUpdate(item.id, 'IN_PROGRESS')}>Start visit</Button>}{item.status === 'IN_PROGRESS' && <Button size="sm" onClick={() => void onUpdate(item.id, 'COMPLETED')}>Complete</Button>}</div></CardContent></Card>)}{queue.length === 0 && <EmptyState text="The patient queue is clear." />}</div><Card className="rounded-2xl bg-primary text-primary-foreground"><CardContent className="p-6"><p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/70">Today</p><p className="mt-3 font-serif text-4xl">{queue.length}</p><p className="mt-1 text-sm text-primary-foreground/80">patients in the queue</p><div className="mt-6 border-t border-primary-foreground/20 pt-4 text-xs text-primary-foreground/75">Call the next patient, keep the queue moving, and close the loop.</div></CardContent></Card></div> }

function AdminView({ doctors, appointments }: { doctors: Doctor[]; appointments: AppointmentsRow[] }) { return <div className="grid gap-4 md:grid-cols-3"><Metric icon={UsersRound} value={doctors.length} label="Active doctors" /><Metric icon={CalendarDays} value={appointments.length} label="Your appointments" /><Metric icon={Clock3} value="Live" label="Scheduling status" /><Card className="rounded-2xl md:col-span-3"><CardHeader><CardTitle className="text-base">Operational notes</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3"><p>Availability is checked again when a booking is submitted.</p><p>Every reschedule and completion updates the appointment record.</p><p>Use the daily queue view to keep reception and doctors aligned.</p></CardContent></Card></div> }
function Metric({ icon: Icon, value, label }: { icon: typeof UsersRound; value: string | number; label: string }) { return <Card className="rounded-2xl"><CardContent className="p-5"><Icon className="size-5 text-primary" /><p className="mt-5 font-serif text-3xl">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></CardContent></Card> }
function SectionHeading({ icon: Icon, title, count }: { icon: typeof CalendarDays; title: string; count: number }) { return <div className="flex items-center gap-2"><Icon className="size-4 text-primary" /><h2 className="font-semibold">{title}</h2><span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span></div> }
function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center text-sm text-muted-foreground">{text}</div> }
