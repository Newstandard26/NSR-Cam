import { db } from "@/lib/db"
import { ProjectMap } from "@/components/map/project-map"

export default async function MapPage() {
  const projects = await db.project.findMany({
    where: { status: "ACTIVE", lat: { not: null }, lng: { not: null } },
    include: {
      labels: { include: { label: true } },
      _count: { select: { photos: true } },
    },
  })
  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 border-b bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Map</h1>
      </div>
      <div className="flex-1">
        <ProjectMap projects={projects} />
      </div>
    </div>
  )
}
