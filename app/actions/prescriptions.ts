'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/lib/clerk/roles'
import { createPrescription } from '@/lib/db/queries'
import { toSafeErrorMessage } from '@/lib/errors'
import { createPrescriptionSchema } from '@/lib/validations/prescription'

export async function createPrescriptionAction(
  input: unknown,
): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole('doctor')
    const data = createPrescriptionSchema.parse(input)
    await createPrescription(ctx, {
      doctorId: 'doctor-1',
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      diagnosis: data.diagnosis,
      notes: data.notes,
      medications: data.medications,
    })
    revalidatePath('/doctor/prescriptions')
    revalidatePath('/patient/prescriptions')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}
