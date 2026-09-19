export type SlotStatus = 'open' | 'held' | 'booked'
export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed'

export interface Doctor {
  id: string
  hospitalId: string
  name: string
  specialty: string
  bio: string
  languages: string[]
  gender: string
  feeCents: number
  rating: number
  reviewsCount: number
  yearsExperience: number
  hospital: string
  address: string
  initials: string
  nextAvailable: string
}

export interface Slot {
  id: string
  hospitalId: string
  doctorId: string
  startsAt: string
  endsAt: string
  status: SlotStatus
  heldUntil: string | null
}

export interface Appointment {
  id: string
  hospitalId: string
  doctorId: string
  patientId: string
  patientName: string
  slotId: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  reason: string
  createdAt: string
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface Prescription {
  id: string
  hospitalId: string
  appointmentId: string
  doctorId: string
  patientId: string
  diagnosis: string
  notes: string
  medications: Medication[]
  createdAt: string
}

export interface NotificationEntry {
  id: string
  channel: 'email' | 'sms'
  status: 'queued' | 'delivered' | 'failed'
  recipient: string
  subject: string
  createdAt: string
}

function slotRange(
  doctorId: string,
  dayOffset: number,
  hour: number,
  minute: number,
  durationMin: number,
  index: number,
  status: SlotStatus = 'open',
): Slot {
  const start = new Date()
  start.setDate(start.getDate() + dayOffset)
  start.setHours(hour, minute, 0, 0)
  const end = new Date(start.getTime() + durationMin * 60_000)
  return {
    id: `slot-${doctorId}-${dayOffset}-${index}`,
    hospitalId: 'hospital-1',
    doctorId,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    status,
    heldUntil: null,
  }
}

export const DOCTORS: Doctor[] = [
  {
    id: 'doctor-1',
    hospitalId: 'hospital-1',
    name: 'Dr. Amara Okafor',
    specialty: 'Cardiology',
    bio: 'Interventional cardiologist with 14 years of experience in preventive care, echocardiography, and heart-failure management.',
    languages: ['English', 'French'],
    gender: 'Female',
    feeCents: 15000,
    rating: 4.9,
    reviewsCount: 412,
    yearsExperience: 14,
    hospital: 'MediBook General Hospital',
    address: '12 Marina Health Blvd, Lagos',
    initials: 'AO',
    nextAvailable: 'Today',
  },
  {
    id: 'doctor-2',
    hospitalId: 'hospital-1',
    name: 'Dr. Daniel Reyes',
    specialty: 'Dermatology',
    bio: 'Board-certified dermatologist focused on acne, eczema, mole mapping, and cosmetic consultations.',
    languages: ['English', 'Spanish'],
    gender: 'Male',
    feeCents: 9000,
    rating: 4.8,
    reviewsCount: 287,
    yearsExperience: 9,
    hospital: 'MediBook General Hospital',
    address: '12 Marina Health Blvd, Lagos',
    initials: 'DR',
    nextAvailable: 'Today',
  },
  {
    id: 'doctor-3',
    hospitalId: 'hospital-1',
    name: 'Dr. Priya Nair',
    specialty: 'Pediatrics',
    bio: 'Pediatrician specializing in newborn care, immunizations, and adolescent health. Gentle, family-first approach.',
    languages: ['English', 'Hindi', 'Malayalam'],
    gender: 'Female',
    feeCents: 7500,
    rating: 4.9,
    reviewsCount: 531,
    yearsExperience: 11,
    hospital: 'MediBook Children’s Wing',
    address: '12 Marina Health Blvd, Lagos',
    initials: 'PN',
    nextAvailable: 'Tomorrow',
  },
  {
    id: 'doctor-4',
    hospitalId: 'hospital-1',
    name: 'Dr. Jonas Weber',
    specialty: 'Orthopedics',
    bio: 'Orthopedic surgeon treating sports injuries, fractures, and joint pain with minimally invasive techniques.',
    languages: ['English', 'German'],
    gender: 'Male',
    feeCents: 18000,
    rating: 4.7,
    reviewsCount: 198,
    yearsExperience: 16,
    hospital: 'MediBook General Hospital',
    address: '12 Marina Health Blvd, Lagos',
    initials: 'JW',
    nextAvailable: 'Tomorrow',
  },
  {
    id: 'doctor-5',
    hospitalId: 'hospital-1',
    name: 'Dr. Sofia Marino',
    specialty: 'Neurology',
    bio: 'Neurologist with a focus on migraines, epilepsy, sleep disorders, and cognitive screening.',
    languages: ['English', 'Italian'],
    gender: 'Female',
    feeCents: 20000,
    rating: 4.8,
    reviewsCount: 164,
    yearsExperience: 12,
    hospital: 'MediBook Neuro Center',
    address: '44 Admiralty Way, Lagos',
    initials: 'SM',
    nextAvailable: 'In 2 days',
  },
  {
    id: 'doctor-6',
    hospitalId: 'hospital-1',
    name: 'Dr. Kwame Mensah',
    specialty: 'General Medicine',
    bio: 'Primary-care physician for checkups, chronic-disease management, and referrals. Same-week availability.',
    languages: ['English', 'Twi'],
    gender: 'Male',
    feeCents: 5000,
    rating: 4.9,
    reviewsCount: 764,
    yearsExperience: 8,
    hospital: 'MediBook General Hospital',
    address: '12 Marina Health Blvd, Lagos',
    initials: 'KM',
    nextAvailable: 'Today',
  },
  {
    id: 'doctor-7',
    hospitalId: 'hospital-1',
    name: 'Dr. Lena Fischer',
    specialty: 'Psychiatry',
    bio: 'Psychiatrist offering confidential consultations for anxiety, depression, burnout, and sleep issues.',
    languages: ['English', 'German'],
    gender: 'Female',
    feeCents: 16000,
    rating: 4.9,
    reviewsCount: 229,
    yearsExperience: 10,
    hospital: 'MediBook Mind Clinic',
    address: '44 Admiralty Way, Lagos',
    initials: 'LF',
    nextAvailable: 'Tomorrow',
  },
  {
    id: 'doctor-8',
    hospitalId: 'hospital-1',
    name: 'Dr. Omar Haddad',
    specialty: 'Ophthalmology',
    bio: 'Ophthalmologist for vision exams, dry-eye treatment, glaucoma screening, and surgical referrals.',
    languages: ['English', 'Arabic'],
    gender: 'Male',
    feeCents: 11000,
    rating: 4.7,
    reviewsCount: 143,
    yearsExperience: 13,
    hospital: 'MediBook Eye Center',
    address: '7 Ikoyi Health Plaza, Lagos',
    initials: 'OH',
    nextAvailable: 'In 2 days',
  },
]

export const SPECIALTIES: string[] = [
  'All',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'General Medicine',
  'Psychiatry',
  'Ophthalmology',
]

function buildSlots(): Slot[] {
  const hours = [9, 10, 11, 13, 14, 15, 16]
  const slots: Slot[] = []
  for (const doctor of DOCTORS) {
    for (let day = 0; day < 5; day++) {
      hours.forEach((hour, i) => {
        // Deterministic pseudo-booked pattern so grids look realistic.
        const booked = (day * 7 + i + doctor.id.length) % 6 === 0
        slots.push(slotRange(doctor.id, day, hour, 0, 30, i, booked ? 'booked' : 'open'))
        slots.push(slotRange(doctor.id, day, hour, 30, 30, i + 100, 'open'))
      })
    }
  }
  // Seed one hold + a couple of booked slots for doctor-1 today.
  const first = slots.find((s) => s.doctorId === 'doctor-1' && s.status === 'open')
  if (first) {
    first.status = 'held'
    first.heldUntil = new Date(Date.now() + 8 * 60_000).toISOString()
  }
  return slots
}

export const INITIAL_SLOTS: Slot[] = buildSlots()

function at(dayOffset: number, hour: number, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function plus30(iso: string): string {
  return new Date(new Date(iso).getTime() + 30 * 60_000).toISOString()
}

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-1',
    hospitalId: 'hospital-1',
    doctorId: 'doctor-1',
    patientId: 'patient-1',
    patientName: 'Adaeze Eze',
    slotId: 'slot-doctor-1-0-0',
    startsAt: at(0, 9),
    endsAt: plus30(at(0, 9)),
    status: 'confirmed',
    reason: 'Chest discomfort and palpitations',
    createdAt: new Date(Date.now() - 2 * 86400_000).toISOString(),
  },
  {
    id: 'appt-2',
    hospitalId: 'hospital-1',
    doctorId: 'doctor-6',
    patientId: 'patient-1',
    patientName: 'Adaeze Eze',
    slotId: 'slot-doctor-6-1-2',
    startsAt: at(1, 11),
    endsAt: plus30(at(1, 11)),
    status: 'pending',
    reason: 'Annual physical + blood work review',
    createdAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
  },
  {
    id: 'appt-3',
    hospitalId: 'hospital-1',
    doctorId: 'doctor-3',
    patientId: 'patient-2',
    patientName: 'Tunde Bakare',
    slotId: 'slot-doctor-3-0-3',
    startsAt: at(0, 13),
    endsAt: plus30(at(0, 13)),
    status: 'confirmed',
    reason: 'Child immunization visit',
    createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
  },
  {
    id: 'appt-4',
    hospitalId: 'hospital-1',
    doctorId: 'doctor-2',
    patientId: 'patient-3',
    patientName: 'Maria Santos',
    slotId: 'slot-doctor-2-2-1',
    startsAt: at(-6, 10),
    endsAt: plus30(at(-6, 10)),
    status: 'cancelled',
    reason: 'Follow-up for eczema',
    createdAt: new Date(Date.now() - 8 * 86400_000).toISOString(),
  },
  {
    id: 'appt-5',
    hospitalId: 'hospital-1',
    doctorId: 'doctor-6',
    patientId: 'patient-4',
    patientName: 'John Adeyemi',
    slotId: 'slot-doctor-6-0-1',
    startsAt: at(0, 10),
    endsAt: plus30(at(0, 10)),
    status: 'confirmed',
    reason: 'Hypertension review',
    createdAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
  },
]

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-1',
    hospitalId: 'hospital-1',
    appointmentId: 'appt-1',
    doctorId: 'doctor-1',
    patientId: 'patient-1',
    diagnosis: 'Mild hypertension — stage 1',
    notes: 'Recheck BP in 2 weeks. Reduce sodium, 30-min walks daily.',
    medications: [
      {
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take in the morning with water.',
      },
      {
        name: 'Aspirin',
        dosage: '75mg',
        frequency: 'Once daily',
        duration: '30 days',
      },
    ],
    createdAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
  },
]

export const PATIENTS = [
  { id: 'patient-1', name: 'Adaeze Eze', email: 'adaeze@example.com', phone: '+234 801 000 0001' },
  { id: 'patient-2', name: 'Tunde Bakare', email: 'tunde@example.com', phone: '+234 801 000 0002' },
  { id: 'patient-3', name: 'Maria Santos', email: 'maria@example.com', phone: '+234 801 000 0003' },
  { id: 'patient-4', name: 'John Adeyemi', email: 'john@example.com', phone: '+234 801 000 0004' },
]
