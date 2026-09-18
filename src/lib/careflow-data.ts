import type { DoctorsRow } from '@/lib/db-types'

export type Doctor = DoctorsRow

export const fallbackDoctors: Doctor[] = [
  { id: 'maya-chen', name: 'Dr. Maya Chen', specialty: 'Cardiology', hospital: 'Northstar Medical Center', location: 'Downtown', experience: '14 yrs', bio: 'Focused on preventive cardiology and clear, collaborative care.', isActive: true, createdAt: '2025-01-01' },
  { id: 'jonathan-reed', name: 'Dr. Jonathan Reed', specialty: 'Dermatology', hospital: 'Riverside Health', location: 'West End', experience: '9 yrs', bio: 'Helps patients build simple, sustainable skin health routines.', isActive: true, createdAt: '2025-01-01' },
  { id: 'aisha-patel', name: 'Dr. Aisha Patel', specialty: 'Pediatrics', hospital: 'Northstar Medical Center', location: 'Downtown', experience: '12 yrs', bio: 'Warm, family-centered pediatric care from newborns through teens.', isActive: true, createdAt: '2025-01-01' },
]

export const demoSlots = ['09:30 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:00 PM']
export const avatarTones = ['bg-primary/10 text-primary', 'bg-accent/40 text-accent-foreground', 'bg-secondary text-secondary-foreground']

export function initials(name: string) {
  return name.replace('Dr. ', '').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
}

export function userMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
