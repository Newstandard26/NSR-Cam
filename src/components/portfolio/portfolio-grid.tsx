type Showcase = {
  id: string
  title: string
  serviceType: string | null
  rating: number | null
  published: boolean
  project: { name: string; city: string | null; state: string | null }
}

export function PortfolioGrid({ showcases }: { showcases: Showcase[] }) {
  if (showcases.length === 0) {
    return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No showcases yet. Publish a completed project to feature it here.</div>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {showcases.map((s) => (
        <div key={s.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="h-40 bg-gray-100" />
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">{s.title}</h3>
              {!s.published && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Draft</span>}
            </div>
            <p className="text-xs text-gray-500">{s.serviceType || "—"} · {[s.project.city, s.project.state].filter(Boolean).join(", ")}</p>
            {s.rating && <p className="text-sm text-amber-500 mt-1">{"★".repeat(s.rating)}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
