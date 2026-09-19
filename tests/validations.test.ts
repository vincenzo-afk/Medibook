import { describe, expect, it } from 'vitest'

import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
} from '@/lib/validations/appointment'
import { createPrescriptionSchema } from '@/lib/validations/prescription'
import { createSlotSchema } from '@/lib/validations/slot'

describe('appointment validations', () => {
  it('accepts a booking with reason', () => {
    const parsed = bookAppointmentSchema.parse({
      doctorId: 'doctor-1',
      slotId: 'slot-1',
      reason: 'Checkup',
    })
    expect(parsed.doctorId).toBe('doctor-1')
  })

  it('rejects empty ids', () => {
    expect(() => bookAppointmentSchema.parse({ doctorId: '', slotId: '' })).toThrow()
  })

  it('parses cancel input', () => {
    expect(cancelAppointmentSchema.parse({ appointmentId: 'appt-1' }).appointmentId).toBe('appt-1')
  })
})

describe('slot validations', () => {
  it('requires endsAt after startsAt at the schema level (ISO datetimes)', () => {
    const parsed = createSlotSchema.parse({
      doctorId: 'doctor-1',
      startsAt: '2026-09-20T09:00:00.000Z',
      endsAt: '2026-09-20T09:30:00.000Z',
    })
    expect(new Date(parsed.endsAt).getTime()).toBeGreaterThan(
      new Date(parsed.startsAt).getTime(),
    )
  })
})

describe('prescription validations', () => {
  it('requires at least one medication', () => {
    expect(() =>
      createPrescriptionSchema.parse({
        appointmentId: 'appt-1',
        patientId: 'patient-1',
        diagnosis: 'Flu',
        medications: [],
      }),
    ).toThrow()
  })
})
