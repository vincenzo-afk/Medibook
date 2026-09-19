export default function Loading() {
  return (
    <div className="space-y-3 py-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-lg border border-hairline bg-panel p-4">
          <div className="h-4 w-1/3 rounded bg-panel-2" />
          <div className="mt-2 h-3 w-2/3 rounded bg-panel-2" />
        </div>
      ))}
    </div>
  )
}
