import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  return NextResponse.json(await db.photoTask.findMany({ where: { photoId: id }, include: { assignee: true }, orderBy: { createdAt: "asc" } }))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { text, assigneeId, dueDate } = await req.json()
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 })
  const task = await db.photoTask.create({
    data: { photoId: id, text, assigneeId: assigneeId || null, dueDate: dueDate ? new Date(dueDate) : null },
    include: { assignee: true },
  })
  return NextResponse.json(task, { status: 201 })
}
