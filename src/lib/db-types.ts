// Auto-generated from your database schema — do not edit by hand.
// Regenerates automatically whenever a table is created or altered.

export type AppointmentsRow = {
  id: string
  patientUserId: string
  patientName: string
  patientEmail: string
  doctorId: string
  doctorName: string
  specialty: string
  appointmentDate: string
  appointmentTime: string
  status: string
  reason: string | null
  createdAt: string
  updatedAt: string
}

export type AuditLogsRow = {
  id: string
  actorUserId: string
  action: string
  entityId: string
  metadata: string | null
  createdAt: string
}

export type DoctorsRow = {
  id: string
  name: string
  specialty: string
  hospital: string
  location: string
  experience: string
  bio: string | null
  isActive: boolean
  createdAt: string
}

export type NotificationsRow = {
  id: string
  userId: string
  appointmentId: string | null
  title: string
  body: string
  kind: string
  read: boolean
  createdAt: string
}

export type QueueEntriesRow = {
  id: string
  appointmentId: string
  doctorId: string
  patientName: string
  appointmentTime: string
  status: string
  queueNumber: string
  createdAt: string
  updatedAt: string
}

export type UserProfilesRow = {
  id: string
  userId: string
  fullName: string
  phone: string | null
  role: string
  createdAt: string
  updatedAt: string
}
