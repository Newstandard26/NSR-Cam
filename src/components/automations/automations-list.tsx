type Rule = { id: string; name: string; trigger: string; active: boolean }

export function AutomationRulesList({ rules }: { rules: Rule[] }) {
  if (rules.length === 0) {
    return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No automation rules yet. Rules fire on events like project.created or checklist.completed.</div>
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
      {rules.map((r) => (
        <div key={r.id} className="flex items-center gap-3 px-4 py-3">
          <span className="flex-1 font-medium text-gray-900">{r.name}</span>
          <span className="text-xs text-gray-500">{r.trigger}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${r.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{r.active ? "Active" : "Off"}</span>
        </div>
      ))}
    </div>
  )
}
