import type { Prescription } from '@/lib/db/seed-data'

/** Hospital seal signing stub — production signs with the hospital private key. */
export async function signPrescription(prescriptionId: string): Promise<string> {
  await Promise.resolve()
  return `seal:${prescriptionId}:${Date.now()}`
}

export function prescriptionPdfText(rx: Prescription, doctorName: string): string {
  const lines = [
    'MEDIBOOK GENERAL HOSPITAL — E-PRESCRIPTION',
    `Prescription: ${rx.id}`,
    `Doctor: ${doctorName}`,
    `Diagnosis: ${rx.diagnosis}`,
    '',
    ...rx.medications.map(
      (m, i) => `${i + 1}. ${m.name} ${m.dosage} — ${m.frequency} for ${m.duration}`,
    ),
    '',
    `Notes: ${rx.notes || '—'}`,
    `Issued: ${rx.createdAt}`,
  ]
  return lines.join('\n')
}
