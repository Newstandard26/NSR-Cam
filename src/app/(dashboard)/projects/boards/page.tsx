import { db } from "@/lib/db"
import { KanbanBoard } from "@/components/boards/kanban-board"

export default async function BoardsPage() {
  const [boards, projects, labels] = await Promise.all([
    db.board.findMany({ include: { columns: { orderBy: { order: "asc" } } } }),
    db.project.findMany({
      where: { status: "ACTIVE" },
      include: {
        labels: { include: { label: true } },
        users: { include: { user: true } },
        _count: { select: { photos: true } },
      },
    }),
    db.label.findMany(),
  ])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Boards</h1>
      </div>
      <KanbanBoard boards={boards} projects={projects} labels={labels} />
    </div>
  )
}
