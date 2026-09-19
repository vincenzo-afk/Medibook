import { Download, ShieldCheck, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Privacy & data rights</h2>
        <p className="text-[13px] text-muted">
          GDPR · PIPEDA · DPDP Act 2023 — access, rectify, erase, and port your data
        </p>
      </div>
      <Card>
        <CardHeader>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldCheck size={15} className="text-success" /> Your rights
          </h3>
        </CardHeader>
        <CardBody className="space-y-3 text-[13px] text-muted">
          <p>
            Request a copy of your records, correct inaccuracies, or ask for erasure where
            regulation permits. Clinical records are retained 7 years; notification logs 1 year.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              <Download size={14} /> Export my data
            </Button>
            <Button variant="secondary" size="sm">
              <Trash2 size={14} /> Request erasure
            </Button>
          </div>
          <p className="text-xs">
            Requests are handled within 30 days at privacy@medibook.example. Audit events for
            your records are append-only and retained 7 years.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
