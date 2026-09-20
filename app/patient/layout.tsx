import { getCtx } from '@/lib/clerk/roles'
import { getDoctors } from '@/lib/db/queries'
import { Sidebar } from '@/components/shared/Sidebar'
import { Topbar } from '@/components/shared/Topbar'
import { MobileNav } from '@/components/shared/MobileNav'
import { CommandPalette } from '@/components/shared/CommandPalette'

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx()
  const doctors = await getDoctors(ctx)
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar role="patient" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={ctx.role} title="Patient" subtitle="MediBook General Hospital" />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileNav role="patient" />
      <CommandPalette
        role={ctx.role}
        doctors={doctors.map((d) => ({ id: d.id, name: d.name, specialty: d.specialty }))}
      />
    </div>
  )
}
