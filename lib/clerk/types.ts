export interface Ctx {
  userId: string
  role: 'patient' | 'doctor' | 'admin'
  hospitalId: string
}

export const DEMO_CTX: Record<Ctx['role'], Ctx> = {
  patient: { userId: 'user-patient-1', role: 'patient', hospitalId: 'hospital-1' },
  doctor: { userId: 'user-doctor-1', role: 'doctor', hospitalId: 'hospital-1' },
  admin: { userId: 'user-admin-1', role: 'admin', hospitalId: 'hospital-1' },
}

export const ROLE_COOKIE = 'mb-role'
export const VALID_ROLES: Ctx['role'][] = ['patient', 'doctor', 'admin']
