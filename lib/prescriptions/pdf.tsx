import type { Prescription } from '@/lib/db/seed-data'

interface PrescriptionPdfProps {
  prescription: Prescription
  doctorName: string
  patientName: string
}

/**
 * E-prescription template. Production renders this with @react-pdf/renderer
 * and streams it from /api/prescriptions/[id]/pdf (never persisted).
 */
export function PrescriptionPdf({ prescription, doctorName, patientName }: PrescriptionPdfProps) {
  return {
    header: 'MediBook General Hospital — E-Prescription',
    prescriptionId: prescription.id,
    doctorName,
    patientName,
    diagnosis: prescription.diagnosis,
    medications: prescription.medications,
    notes: prescription.notes,
    createdAt: prescription.createdAt,
  }
}
