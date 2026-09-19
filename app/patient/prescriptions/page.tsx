import Link from 'next/link'
import { Download } from 'lucide-react'

import { getCtx } from '@/lib/clerk/roles'
import { getPrescriptionsForPatient } from '@/lib/db/queries'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

export default async function PrescriptionsPage() {
  const ctx = await getCtx()
  const prescriptions = await getPrescriptionsForPatient(ctx, 'patient-1')
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Prescriptions</h2>
        <p className="text-[13px] text-muted">{prescriptions.length} record(s) · PDFs stream on demand</p>
      </div>
      {prescriptions.map((rx) => (
        <Card key={rx.id}>
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{rx.diagnosis}</p>
                <p className="text-xs text-muted">
                  {rx.doctor.name} · {new Date(rx.createdAt).toLocaleDateString()}
                </p>
                <ul className="mt-2 space-y-1">
                  {rx.medications.map((m) => (
                    <li key={m.name} className="text-[13px] text-muted">
                      <span className="font-medium text-ink">{m.name} {m.dosage}</span> —{' '}
                      {m.frequency} · {m.duration}
                    </li>
                  ))}
                </ul>
                {rx.notes && <p className="mt-2 text-[13px] text-muted">{rx.notes}</p>}
              </div>
              <Link href={`/api/prescriptions/${rx.id}/pdf`}>
                <Button variant="secondary" size="sm">
                  <Download size={14} /> PDF
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ))}
      {prescriptions.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-sm text-muted">No prescriptions yet.</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
