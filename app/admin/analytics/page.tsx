import { getCtx } from '@/lib/clerk/roles'
import { getHospitalMetrics } from '@/lib/db/queries'
import { formatCurrency } from '@/lib/utils'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export default async function AdminAnalyticsPage() {
  const ctx = await getCtx()
  const metrics = await getHospitalMetrics(ctx)
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Analytics</h2>
        <p className="text-[13px] text-muted">No-show rates · revenue · demand</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-muted uppercase">Revenue (active)</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatCurrency(metrics.revenueCents)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-muted uppercase">Cancel / no-show rate</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{metrics.noShowRate}%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-muted uppercase">Patients served</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{metrics.patientsCount}</p>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-ink">Weekly demand (demo)</h3>
        </CardHeader>
        <CardBody>
          <div className="flex h-28 items-end gap-2">
            {[40, 65, 52, 80, 58, 30, 18].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-sm bg-action/80" style={{ height: `${h}px` }} />
                <span className="text-[10px] text-muted">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
