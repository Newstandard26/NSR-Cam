export function ReviewDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Average Rating", value: "—" },
          { label: "Total Reviews", value: "—" },
          { label: "Response Rate", value: "—" },
          { label: "Requests Sent", value: "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
        Connect a Google Business Profile to pull reviews and send review requests after a project is marked Completed.
      </div>
    </div>
  )
}
