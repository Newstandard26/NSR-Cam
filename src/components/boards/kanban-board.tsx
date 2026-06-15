import Link from "next/link"
import { Avatar } from "@/components/ui/badges"

type Project = {
  id: string
  name: string
  city: string | null
  state: string | null
  labels: { label: { id: string; name: string; color: string } }[]
  users: { user: { id: string; name: string | null; color: string | null } }[]
  _count: { photos: number }
}
type Board = { id: string; name: string; columns: { id: string; name: string; color: string; labelName: string | null }[] }
type Label = { id: string; name: string; color: string }

const DEFAULT_COLUMNS = [
  { id: "lead", name: "Lead", color: "#F97316", labelName: "Lead" },
  { id: "prospect", name: "Prospect", color: "#3B82F6", labelName: "Prospect" },
  { id: "approved", name: "Approved", color: "#22C55E", labelName: "Approved" },
  { id: "completed", name: "Completed", color: "#6B7280", labelName: "Completed" },
]

export function KanbanBoard({ boards, projects }: { boards: Board[]; projects: Project[]; labels: Label[] }) {
  const columns = boards[0]?.columns?.length ? boards[0].columns : DEFAULT_COLUMNS

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const cards = projects.filter((p) => p.labels.some((l) => l.label.name === col.labelName))
        return (
          <div key={col.id} className="w-72 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="font-medium text-gray-900 text-sm">{col.name}</h3>
              <span className="text-xs text-gray-400">{cards.length}</span>
            </div>
            <div className="space-y-2">
              {cards.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="block rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm">
                  <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">{[p.city, p.state].filter(Boolean).join(", ")}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-gray-400">{p._count.photos} photos</span>
                    <div className="flex -space-x-2">{p.users.slice(0, 3).map((u) => <Avatar key={u.user.id} name={u.user.name || "?"} color={u.user.color} />)}</div>
                  </div>
                </Link>
              ))}
              {cards.length === 0 && <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-xs text-gray-300">Empty</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
