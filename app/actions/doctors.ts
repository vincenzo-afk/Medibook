'use server'

import { revalidatePath } from 'next/cache'

import { requireRole } from '@/lib/clerk/roles'
import { createDoctor } from '@/lib/db/queries'
import { toSafeErrorMessage } from '@/lib/errors'
import { doctorProfileSchema } from '@/lib/validations/user'

export async function createDoctorAction(
  input: unknown,
): Promise<{ ok: boolean; error: string }> {
  try {
    const ctx = await requireRole('admin')
    const data = doctorProfileSchema.parse(input)
    await createDoctor(ctx, data)
    revalidatePath('/admin/doctors')
    return { ok: true, error: '' }
  } catch (err) {
    return { ok: false, error: toSafeErrorMessage(err) }
  }
}
