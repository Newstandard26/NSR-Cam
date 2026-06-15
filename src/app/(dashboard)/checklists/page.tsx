import { db } from "@/lib/db"
import { ChecklistFeed } from "@/components/checklists/checklist-feed"

export default async function ChecklistsPage() {
  const checklists = await db.checklist.findMany({
    include: {
      project: { select: { id: true, name: true, city: true, state: true } },
      assignees: { include: { user: true } },
      items: { include: { completions: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checklists</h1>
      <ChecklistFeed checklists={checklists} />
    </div>
  )
}
