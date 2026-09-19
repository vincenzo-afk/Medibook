import { getCtx } from '@/lib/clerk/roles'
import { getAuditLog } from '@/lib/db/queries'
import { Card, CardHeader } from '@/components/ui/Card'

export default async function AdminAuditPage() {
  const ctx = await getCtx()
  const entries = await getAuditLog(ctx)
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">Audit log</h2>
        <p className="text-[13px] text-muted">
          Append-only · every PHI mutation · retained 7 years
        </p>
      </div>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-ink">Recent events ({entries.length})</h3>
        </CardHeader>
        <div>
          {entries.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted">
              No mutations yet this session — book or cancel an appointment to generate events.
            </p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 border-b border-hairline px-4 py-2.5 font-mono text-xs last:border-0">
              <span className="text-muted">{new Date(e.createdAt).toLocaleString()}</span>
              <span className="rounded border border-hairline bg-canvas px-1.5 py-0.5 text-ink">
                {e.action}
              </span>
              <span className="truncate text-muted">target {e.targetId}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
