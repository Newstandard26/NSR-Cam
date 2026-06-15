import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const checklists = await db.checklist.findMany({
    include: {
      project: { select: { id: true, name: true, city: true, state: true } },
      assignees: { include: { user: true } },
      items: { include: { completions: true } },
    },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(checklists)
}

// Create a checklist on a project, optionally copying items from a template.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, projectId, templateId, assigneeIds } = await req.json()
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 })

  let itemsData: { label: string; description: string | null; order: number; requirePhoto: boolean }[] = []
  let checklistName = name

  if (templateId) {
    const template = await db.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: { orderBy: { order: "asc" } } },
    })
    if (template) {
      checklistName = checklistName || template.name
      itemsData = template.items.map((i) => ({
        label: i.label,
        description: i.description,
        order: i.order,
        requirePhoto: i.requirePhoto,
      }))
    }
  }

  const checklist = await db.checklist.create({
    data: {
      name: checklistName || "Checklist",
      projectId,
      templateId: templateId || null,
      items: { create: itemsData },
      assignees: assigneeIds?.length
        ? { create: (assigneeIds as string[]).map((userId) => ({ userId })) }
        : undefined,
    },
    include: { items: true, assignees: true },
  })
  return NextResponse.json(checklist, { status: 201 })
}
