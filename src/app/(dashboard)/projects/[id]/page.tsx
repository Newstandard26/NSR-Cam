import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ProjectDetail } from "@/components/projects/project-detail"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await db.project.findUnique({
    where: { id },
    include: {
      customer: true,
      labels: { include: { label: true } },
      users: { include: { user: true } },
      collaborators: true,
      tasks: { orderBy: { createdAt: "asc" } },
      _count: { select: { photos: true, documents: true, checklists: true, pages: true } },
    },
  })

  if (!project) notFound()

  return <ProjectDetail project={project} />
}
