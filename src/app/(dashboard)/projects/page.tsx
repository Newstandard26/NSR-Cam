import { db } from "@/lib/db"
import { ProjectsTable } from "@/components/projects/projects-table"
import { CreateProjectButton } from "@/components/projects/create-project-button"

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    where: { status: "ACTIVE" },
    include: {
      labels: { include: { label: true } },
      users: { include: { user: true } },
      photos: { orderBy: { createdAt: "desc" }, take: 4, select: { id: true, uri: true } },
      _count: { select: { photos: true, documents: true, checklists: true, pages: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} active projects</p>
        </div>
        <CreateProjectButton />
      </div>
      <ProjectsTable projects={projects} />
    </div>
  )
}
