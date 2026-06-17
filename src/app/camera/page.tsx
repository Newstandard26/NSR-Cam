import { CameraCapture } from "@/components/camera/camera-capture"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function CameraPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const { project } = await searchParams
  let lockedName: string | undefined
  if (project) {
    const p = await db.project.findUnique({ where: { id: project }, select: { name: true } })
    lockedName = p?.name
  }
  return (
    <div className="h-full flex flex-col">
      <CameraCapture lockedProjectId={project} lockedProjectName={lockedName} />
    </div>
  )
}
