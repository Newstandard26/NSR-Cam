import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const reports = await db.report.findMany({
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(reports)
}

// Create a report. Attaches the project's current photos as report items.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, projectId, photoIds } = await req.json()
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 })

  let ids: string[] = photoIds
  if (!ids?.length) {
    const photos = await db.photo.findMany({ where: { projectId }, select: { id: true } })
    ids = photos.map((p) => p.id)
  }

  const project = await db.project.findUnique({ where: { id: projectId }, select: { name: true } })
  const report = await db.report.create({
    data: {
      name: name || `${project?.name ?? "Project"} Inspection Photos`,
      projectId,
      photoItems: { create: ids.map((photoId, order) => ({ photoId, order })) },
    },
    include: { project: { select: { id: true, name: true } } },
  })
  return NextResponse.json(report, { status: 201 })
}
