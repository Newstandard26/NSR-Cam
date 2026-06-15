import { db } from "@/lib/db"
import { TeamTable } from "@/components/team/team-table"

export default async function TeamPage() {
  const users = await db.user.findMany({
    include: { _count: { select: { projectUsers: true, photos: true } } },
    orderBy: { name: "asc" },
  })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Team</h1>
      <TeamTable users={users} />
    </div>
  )
}
