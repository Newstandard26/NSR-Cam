import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { taskId } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if ("text" in body) data.text = body.text
  if ("assigneeId" in body) data.assigneeId = body.assigneeId || null
  if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if ("completed" in body) {
    data.completed = body.completed
    data.completedAt = body.completed ? new Date() : null
  }
  const task = await db.photoTask.update({ where: { id: taskId }, data, include: { assignee: true } })
  return NextResponse.json(task)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { taskId } = await params
  await db.photoTask.delete({ where: { id: taskId } })
  return NextResponse.json({ success: true })
}
