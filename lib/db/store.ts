import {
  INITIAL_APPOINTMENTS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_SLOTS,
  type Appointment,
  type NotificationEntry,
  type Prescription,
  type Slot,
} from '@/lib/db/seed-data'

export interface WaitlistEntry {
  id: string
  hospitalId: string
  doctorId: string
  patientId: string
  patientName: string
  createdAt: string
}

interface Store {
  slots: Slot[]
  appointments: Appointment[]
  prescriptions: Prescription[]
  notifications: NotificationEntry[]
  waitlist: WaitlistEntry[]
  audit: Array<{
    id: string
    action: string
    actorId: string
    targetId: string
    createdAt: string
  }>
}

// Module-level in-memory store seeded deterministically (demo mode).
// Production uses Prisma + PostgreSQL via the same query signatures.
const globalStore = globalThis as unknown as { __mbStore?: Store }

function fresh(): Store {
  return {
    slots: INITIAL_SLOTS.map((s) => ({ ...s })),
    appointments: INITIAL_APPOINTMENTS.map((a) => ({ ...a })),
    prescriptions: INITIAL_PRESCRIPTIONS.map((p) => ({
      ...p,
      medications: p.medications.map((m) => ({ ...m })),
    })),
    notifications: [],
    waitlist: [],
    audit: [],
  }
}

export function getStore(): Store {
  if (!globalStore.__mbStore) globalStore.__mbStore = fresh()
  return globalStore.__mbStore
}

export function resetStore(): void {
  globalStore.__mbStore = fresh()
}
