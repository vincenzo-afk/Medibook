/**
 * Authorized query layer — the ONLY place that touches data.
 * Every query is scoped by ctx.hospitalId (never from the request body).
 * Server Components + Server Actions call these; never raw Prisma in routes.
 */
import type { Ctx } from '@/lib/clerk/types'
import { getStore, resetStore, type WaitlistEntry } from '@/lib/db/store'
import {
  DOCTORS,
  PATIENTS,
  type Appointment,
  type AppointmentStatus,
  type Doctor,
  type Prescription,
  type Slot,
} from '@/lib/db/seed-data'
import { NotFoundError, SlotAlreadyBookedError } from '@/lib/errors'
import { logger } from '@/lib/logger'
import { canBookSlot, canFinalizeBooking, holdExpiresAt, isHoldExpired } from '@/lib/slots/calc'

export { resetStore }

function scoped<T extends { hospitalId: string }>(ctx: Ctx, rows: T[]): T[] {
  return rows.filter((r) => r.hospitalId === ctx.hospitalId)
}

// --- Doctors ---

export async function getDoctors(
  ctx: Ctx,
  filters?: { specialty?: string; query?: string },
): Promise<Doctor[]> {
  await Promise.resolve()
  let rows = scoped(ctx, DOCTORS)
  if (filters?.specialty && filters.specialty !== 'All') {
    rows = rows.filter((d) => d.specialty === filters.specialty)
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase()
    rows = rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.bio.toLowerCase().includes(q),
    )
  }
  return rows
}

export async function getDoctor(ctx: Ctx, id: string): Promise<Doctor> {
  await Promise.resolve()
  const doctor = scoped(ctx, DOCTORS).find((d) => d.id === id)
  if (!doctor) throw new NotFoundError('Doctor not found')
  return doctor
}

// --- Slots ---

export async function getSlotsForDoctor(ctx: Ctx, doctorId: string): Promise<Slot[]> {
  const store = getStore()
  await Promise.resolve()
  releaseExpiredHolds(store.slots)
  return scoped(ctx, store.slots)
    .filter((s) => s.doctorId === doctorId)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

export async function holdSlot(ctx: Ctx, slotId: string): Promise<Slot> {
  const store = getStore()
  await Promise.resolve()
  const slot = scoped(ctx, store.slots).find((s) => s.id === slotId)
  if (!slot) throw new NotFoundError('Slot not found')
  if (!canBookSlot(slot)) throw new SlotAlreadyBookedError()
  slot.status = 'held'
  slot.heldUntil = holdExpiresAt()
  logger.info('slot.hold', { slotId: slot.id, actorId: ctx.userId })
  return { ...slot }
}

export async function createSlot(
  ctx: Ctx,
  input: { doctorId: string; startsAt: string; endsAt: string },
): Promise<Slot> {
  const store = getStore()
  await Promise.resolve()
  const slot: Slot = {
    id: `slot-${input.doctorId}-${Date.now()}`,
    hospitalId: ctx.hospitalId,
    doctorId: input.doctorId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: 'open',
    heldUntil: null,
  }
  store.slots.push(slot)
  store.audit.push({
    id: `audit-${Date.now()}`,
    action: 'slot.create',
    actorId: ctx.userId,
    targetId: slot.id,
    createdAt: new Date().toISOString(),
  })
  logger.info('slot.create', { slotId: slot.id, actorId: ctx.userId })
  return { ...slot }
}

export function releaseExpiredHolds(slots: Slot[], now: number = Date.now()): number {
  let released = 0
  for (const slot of slots) {
    if (isHoldExpired(slot, now)) {
      slot.status = 'open'
      slot.heldUntil = null
      released += 1
    }
  }
  return released
}

export async function releaseHolds(ctx: Ctx): Promise<{ released: number }> {
  const store = getStore()
  await Promise.resolve()
  const released = releaseExpiredHolds(scoped(ctx, store.slots))
  logger.info('slot.release_holds', { actorId: ctx.userId })
  return { released }
}

// --- Appointments ---

export async function getAppointmentsForPatient(
  ctx: Ctx,
  patientId: string,
): Promise<(Appointment & { doctor: Doctor })[]> {
  const store = getStore()
  await Promise.resolve()
  return scoped(ctx, store.appointments)
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .map((a) => ({
      ...a,
      doctor: DOCTORS.find((d) => d.id === a.doctorId) as Doctor,
    }))
}

export async function getAppointmentsForDoctor(
  ctx: Ctx,
  doctorId: string,
): Promise<Appointment[]> {
  const store = getStore()
  await Promise.resolve()
  return scoped(ctx, store.appointments)
    .filter((a) => a.doctorId === doctorId && a.status !== 'cancelled')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
}

export async function getAllAppointments(ctx: Ctx): Promise<Appointment[]> {
  const store = getStore()
  await Promise.resolve()
  return scoped(ctx, store.appointments).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

/**
 * Booking with optimistic-locking semantics:
 * 1. lock slot (single-threaded here; Prisma transaction in prod)
 * 2. verify OPEN / expired-hold
 * 3. insert appointment + mark BOOKED
 */
export async function createAppointment(
  ctx: Ctx,
  input: { doctorId: string; slotId: string; patientId: string; patientName: string; reason?: string },
): Promise<Appointment> {
  const store = getStore()
  await Promise.resolve()
  const slot = scoped(ctx, store.slots).find((s) => s.id === input.slotId)
  if (!slot || slot.doctorId !== input.doctorId) throw new NotFoundError('Slot not found')
  if (!canFinalizeBooking(slot)) throw new SlotAlreadyBookedError()
  const appointment: Appointment = {
    id: `appt-${Date.now()}`,
    hospitalId: ctx.hospitalId,
    doctorId: input.doctorId,
    patientId: input.patientId,
    patientName: input.patientName,
    slotId: slot.id,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    status: 'pending',
    reason: input.reason ?? '',
    createdAt: new Date().toISOString(),
  }
  store.appointments.push(appointment)
  slot.status = 'booked'
  slot.heldUntil = null
  store.audit.push({
    id: `audit-${Date.now()}`,
    action: 'appointment.create',
    actorId: ctx.userId,
    targetId: appointment.id,
    createdAt: new Date().toISOString(),
  })
  logger.info('appointment.create', { appointmentId: appointment.id, actorId: ctx.userId })
  return { ...appointment }
}

export async function cancelAppointment(
  ctx: Ctx,
  appointmentId: string,
): Promise<Appointment> {
  const store = getStore()
  await Promise.resolve()
  const appointment = scoped(ctx, store.appointments).find((a) => a.id === appointmentId)
  if (!appointment) throw new NotFoundError('Appointment not found')
  appointment.status = 'cancelled'
  const slot = store.slots.find((s) => s.id === appointment.slotId)
  if (slot) {
    slot.status = 'open'
    slot.heldUntil = null
  }
  store.audit.push({
    id: `audit-${Date.now()}`,
    action: 'appointment.cancel',
    actorId: ctx.userId,
    targetId: appointment.id,
    createdAt: new Date().toISOString(),
  })
  logger.info('appointment.cancel', { appointmentId: appointment.id, actorId: ctx.userId })
  return { ...appointment }
}

export async function updateAppointmentStatus(  ctx: Ctx,
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const store = getStore()
  await Promise.resolve()
  const appointment = scoped(ctx, store.appointments).find((a) => a.id === appointmentId)
  if (!appointment) throw new NotFoundError('Appointment not found')
  appointment.status = status
  logger.info('appointment.status', { appointmentId: appointment.id, actorId: ctx.userId })
  return { ...appointment }
}

export async function rescheduleAppointment(
  ctx: Ctx,
  appointmentId: string,
  newSlotId: string,
): Promise<Appointment> {
  const store = getStore()
  await Promise.resolve()
  const appointment = scoped(ctx, store.appointments).find((a) => a.id === appointmentId)
  if (!appointment) throw new NotFoundError('Appointment not found')
  if (appointment.status === 'cancelled') throw new NotFoundError('Appointment not found')
  const newSlot = scoped(ctx, store.slots).find((s) => s.id === newSlotId)
  if (!newSlot || newSlot.doctorId !== appointment.doctorId) {
    throw new NotFoundError('Slot not found')
  }
  if (!canFinalizeBooking(newSlot)) throw new SlotAlreadyBookedError()
  const oldSlot = store.slots.find((s) => s.id === appointment.slotId)
  if (oldSlot) {
    oldSlot.status = 'open'
    oldSlot.heldUntil = null
  }
  newSlot.status = 'booked'
  newSlot.heldUntil = null
  appointment.slotId = newSlot.id
  appointment.startsAt = newSlot.startsAt
  appointment.endsAt = newSlot.endsAt
  appointment.status = 'pending'
  store.audit.push({
    id: `audit-${Date.now()}`,
    action: 'appointment.reschedule',
    actorId: ctx.userId,
    targetId: appointment.id,
    createdAt: new Date().toISOString(),
  })
  logger.info('appointment.reschedule', { appointmentId: appointment.id, actorId: ctx.userId })
  return { ...appointment }
}

export async function getNextAppointment(
  ctx: Ctx,
  patientId: string,
): Promise<(Appointment & { doctor: Doctor }) | null> {
  const store = getStore()
  await Promise.resolve()
  const now = Date.now()
  const next = scoped(ctx, store.appointments)
    .filter(
      (a) =>
        a.patientId === patientId &&
        (a.status === 'pending' || a.status === 'confirmed') &&
        new Date(a.startsAt).getTime() > now,
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
  if (!next) return null
  return { ...next, doctor: DOCTORS.find((d) => d.id === next.doctorId) as Doctor }
}

export async function getAppointment(ctx: Ctx, id: string): Promise<Appointment> {  const store = getStore()
  await Promise.resolve()
  const appointment = scoped(ctx, store.appointments).find((a) => a.id === id)
  if (!appointment) throw new NotFoundError('Appointment not found')
  return { ...appointment }
}

// --- Prescriptions ---
export async function getPrescriptionsForPatient(
  ctx: Ctx,
  patientId: string,
): Promise<(Prescription & { doctor: Doctor })[]> {
  const store = getStore()
  await Promise.resolve()
  return scoped(ctx, store.prescriptions)
    .filter((p) => p.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => ({
      ...p,
      doctor: DOCTORS.find((d) => d.id === p.doctorId) as Doctor,
    }))
}

export async function getPrescription(ctx: Ctx, id: string): Promise<Prescription> {
  const store = getStore()
  await Promise.resolve()
  const rx = scoped(ctx, store.prescriptions).find((p) => p.id === id)
  if (!rx) throw new NotFoundError('Prescription not found')
  return { ...rx, medications: rx.medications.map((m) => ({ ...m })) }
}

export async function createPrescription(
  ctx: Ctx,
  input: {
    appointmentId: string
    patientId: string
    doctorId: string
    diagnosis: string
    notes?: string
    medications: Prescription['medications']
  },
): Promise<Prescription> {
  const store = getStore()
  await Promise.resolve()
  const rx: Prescription = {
    id: `rx-${Date.now()}`,
    hospitalId: ctx.hospitalId,
    appointmentId: input.appointmentId,
    doctorId: input.doctorId,
    patientId: input.patientId,
    diagnosis: input.diagnosis,
    notes: input.notes ?? '',
    medications: input.medications.map((m) => ({ ...m })),
    createdAt: new Date().toISOString(),
  }
  store.prescriptions.push(rx)
  store.audit.push({
    id: `audit-${Date.now()}`,
    action: 'prescription.issue',
    actorId: ctx.userId,
    targetId: rx.id,
    createdAt: new Date().toISOString(),
  })
  logger.info('prescription.issue', { prescriptionId: rx.id, actorId: ctx.userId })
  return { ...rx }
}

// --- Admin metrics ---

export interface HospitalMetrics {
  totalAppointments: number
  confirmed: number
  pending: number
  cancelled: number
  noShowRate: number
  revenueCents: number
  doctorsCount: number
  patientsCount: number
}

export async function getHospitalMetrics(ctx: Ctx): Promise<HospitalMetrics> {
  const store = getStore()
  await Promise.resolve()
  const appointments = scoped(ctx, store.appointments)
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length
  const pending = appointments.filter((a) => a.status === 'pending').length
  const cancelled = appointments.filter((a) => a.status === 'cancelled').length
  const revenueCents = appointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => {
      const doctor = DOCTORS.find((d) => d.id === a.doctorId)
      return sum + (doctor?.feeCents ?? 0)
    }, 0)
  return {
    totalAppointments: appointments.length,
    confirmed,
    pending,
    cancelled,
    noShowRate: appointments.length === 0 ? 0 : Math.round((cancelled / appointments.length) * 100),
    revenueCents,
    doctorsCount: scoped(ctx, DOCTORS).length,
    patientsCount: PATIENTS.length,
  }
}

export function getPatients(): typeof PATIENTS {
  return PATIENTS
}

// --- Waitlist ---

export async function joinWaitlist(
  ctx: Ctx,
  input: { doctorId: string; patientId: string; patientName: string },
): Promise<WaitlistEntry> {
  const store = getStore()
  await Promise.resolve()
  const existing = scoped(ctx, store.waitlist).find(
    (w) => w.doctorId === input.doctorId && w.patientId === input.patientId,
  )
  if (existing) return { ...existing }
  const entry: WaitlistEntry = {
    id: `wait-${Date.now()}`,
    hospitalId: ctx.hospitalId,
    doctorId: input.doctorId,
    patientId: input.patientId,
    patientName: input.patientName,
    createdAt: new Date().toISOString(),
  }
  store.waitlist.push(entry)
  logger.info('waitlist.join', { waitlistId: entry.id, actorId: ctx.userId })
  return { ...entry }
}

export async function leaveWaitlist(ctx: Ctx, waitlistId: string): Promise<void> {
  const store = getStore()
  await Promise.resolve()
  const index = store.waitlist.findIndex(
    (w) => w.id === waitlistId && w.hospitalId === ctx.hospitalId,
  )
  if (index === -1) throw new NotFoundError('Waitlist entry not found')
  const [removed] = store.waitlist.splice(index, 1)
  logger.info('waitlist.leave', { waitlistId: removed?.id ?? waitlistId, actorId: ctx.userId })
}

export async function getWaitlistForPatient(
  ctx: Ctx,
  patientId: string,
): Promise<(WaitlistEntry & { doctor: Doctor })[]> {
  const store = getStore()
  await Promise.resolve()
  return scoped(ctx, store.waitlist)
    .filter((w) => w.patientId === patientId)
    .map((w) => ({
      ...w,
      doctor: DOCTORS.find((d) => d.id === w.doctorId) as Doctor,
    }))
}

export async function getWaitlistForDoctor(ctx: Ctx, doctorId: string): Promise<WaitlistEntry[]> {
  const store = getStore()
  await Promise.resolve()
  return scoped(ctx, store.waitlist).filter((w) => w.doctorId === doctorId)
}

// --- Availability ---

export async function getOpenSlotCounts(
  ctx: Ctx,
  doctorIds: string[],
): Promise<Record<string, { today: number; total: number }>> {
  const store = getStore()
  await Promise.resolve()
  releaseExpiredHolds(store.slots)
  const todayKey = new Date().toISOString().slice(0, 10)
  const counts: Record<string, { today: number; total: number }> = {}
  for (const id of doctorIds) {
    const open = scoped(ctx, store.slots).filter(
      (s) => s.doctorId === id && s.status === 'open',
    )
    counts[id] = {
      today: open.filter((s) => s.startsAt.slice(0, 10) === todayKey).length,
      total: open.length,
    }
  }
  return counts
}

// --- Doctor earnings ---

export interface DoctorEarnings {
  visits: number
  revenueCents: number
  outstandingCents: number
}

export async function getDoctorEarnings(ctx: Ctx, doctorId: string): Promise<DoctorEarnings> {
  const store = getStore()
  await Promise.resolve()
  const doctor = scoped(ctx, DOCTORS).find((d) => d.id === doctorId)
  const fee = doctor?.feeCents ?? 0
  const rows = scoped(ctx, store.appointments).filter((a) => a.doctorId === doctorId)
  const paid = rows.filter((a) => a.status === 'confirmed' || a.status === 'completed')
  const outstanding = rows.filter((a) => a.status === 'pending')
  return {
    visits: paid.length,
    revenueCents: paid.length * fee,
    outstandingCents: outstanding.length * fee,
  }
}

export async function getPrescriptionByAppointment(
  ctx: Ctx,
  appointmentId: string,
): Promise<Prescription | null> {
  const store = getStore()
  await Promise.resolve()
  const rx = scoped(ctx, store.prescriptions).find((p) => p.appointmentId === appointmentId)
  return rx ? { ...rx, medications: rx.medications.map((m) => ({ ...m })) } : null
}

export interface AuditEntry {
  id: string
  action: string
  actorId: string
  targetId: string
  createdAt: string
}

export async function getAuditLog(ctx: Ctx, limit = 50): Promise<AuditEntry[]> {
  const store = getStore()
  await Promise.resolve()
  void ctx
  return store.audit.slice(-limit).reverse()
}

export async function createDoctor(
  ctx: Ctx,
  input: { name: string; specialty: string; bio?: string; languages: string[]; feeCents: number },
): Promise<Doctor> {
  const store = getStore()
  await Promise.resolve()
  void store
  const id = `doctor-${Date.now()}`
  const initials = input.name
    .replace(/^Dr\.\s*/i, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const doctor: Doctor = {
    id,
    hospitalId: ctx.hospitalId,
    name: input.name,
    specialty: input.specialty,
    bio: input.bio ?? '',
    languages: input.languages,
    gender: 'Not specified',
    feeCents: input.feeCents,
    rating: 5.0,
    reviewsCount: 0,
    yearsExperience: 1,
    hospital: 'MediBook General Hospital',
    address: '12 Marina Health Blvd, Lagos',
    initials,
    nextAvailable: 'Tomorrow',
  }
  DOCTORS.push(doctor)
  logger.info('doctor.onboard', { doctorId: id, actorId: ctx.userId })
  return doctor
}
