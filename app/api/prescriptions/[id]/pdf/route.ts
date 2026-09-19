import { DEMO_CTX } from '@/lib/clerk/types'
import { getDoctor, getPrescription } from '@/lib/db/queries'
import { prescriptionPdfText } from '@/lib/prescriptions/sign'

function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/** Minimal valid single-page PDF streamed on demand — never persisted. */
function toPdfBytes(title: string, lines: string[]): Uint8Array {
  const content = [
    'BT /F1 14 Tf 40 760 Td (MediBook E-Prescription) Tj ET',
    ...lines.slice(0, 32).map(
      (line, i) => `BT /F1 10 Tf 40 ${735 - i * 16} Td (${escapePdf(line).slice(0, 110)}) Tj ET`,
    ),
  ].join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj`,
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ]
  void title
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += `${obj}\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(pdf)
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const ctx = DEMO_CTX.patient
  try {
    const rx = await getPrescription(ctx, id)
    const doctor = await getDoctor(ctx, rx.doctorId)
    const text = prescriptionPdfText(rx, doctor.name)
    const bytes = toPdfBytes(rx.id, text.split('\n'))
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="prescription-${rx.id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new Response('Prescription not found', { status: 404 })
  }
}
