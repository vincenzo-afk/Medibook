import { describe, expect, it } from 'vitest'

import { DEMO_CTX } from '@/lib/clerk/types'
import { resetStore, getAppointmentsForPatient, createAppointment, cancelAppointment } from '@/lib/db/queries'
import { SlotAlreadyBookedError } from '@/lib/errors'

describe('booking integration (in-memory store)', () => {
  it('books an open slot then rejects a double-book', async () => {
    resetStore()
    const ctx = DEMO_CTX.patient
    const created = await createAppointment(ctx, {
      doctorId: 'doctor-2',
      slotId: 'slot-doctor-2-0-1',
      patientId: 'patient-1',
      patientName: 'Adaeze Eze',
      reason: 'Skin check',
    })
    expect(created.status).toBe('pending')
    await expect(
      createAppointment(ctx, {
        doctorId: 'doctor-2',
        slotId: 'slot-doctor-2-0-1',
        patientId: 'patient-2',
        patientName: 'Tunde Bakare',
      }),
    ).rejects.toBeInstanceOf(SlotAlreadyBookedError)
  })

  it('cancelling frees the slot', async () => {
    resetStore()
    const ctx = DEMO_CTX.patient
    const rows = await getAppointmentsForPatient(ctx, 'patient-1')
    const target = rows.find((a) => a.status !== 'cancelled')
    expect(target).toBeDefined()
    const cancelled = await cancelAppointment(ctx, target!.id)
    expect(cancelled.status).toBe('cancelled')
  })
})
