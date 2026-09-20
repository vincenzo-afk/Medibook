import { describe, expect, it } from 'vitest'

import { DEMO_CTX } from '@/lib/clerk/types'
import {
  getWaitlistForDoctor,
  getWaitlistForPatient,
  joinWaitlist,
  leaveWaitlist,
  resetStore,
} from '@/lib/db/queries'
import { NotFoundError } from '@/lib/errors'

describe('waitlist', () => {
  it('joins once per patient and doctor (idempotent)', async () => {
    resetStore()
    const ctx = DEMO_CTX.patient
    const first = await joinWaitlist(ctx, {
      doctorId: 'doctor-5',
      patientId: 'patient-1',
      patientName: 'Adaeze Eze',
    })
    const second = await joinWaitlist(ctx, {
      doctorId: 'doctor-5',
      patientId: 'patient-1',
      patientName: 'Adaeze Eze',
    })
    expect(second.id).toBe(first.id)
    const mine = await getWaitlistForPatient(ctx, 'patient-1')
    expect(mine).toHaveLength(1)
    const forDoctor = await getWaitlistForDoctor(ctx, 'doctor-5')
    expect(forDoctor).toHaveLength(1)
  })

  it('leaves and rejects unknown entries', async () => {
    resetStore()
    const ctx = DEMO_CTX.patient
    const entry = await joinWaitlist(ctx, {
      doctorId: 'doctor-5',
      patientId: 'patient-1',
      patientName: 'Adaeze Eze',
    })
    await leaveWaitlist(ctx, entry.id)
    expect(await getWaitlistForPatient(ctx, 'patient-1')).toHaveLength(0)
    await expect(leaveWaitlist(ctx, 'wait-missing')).rejects.toBeInstanceOf(NotFoundError)
  })
})
