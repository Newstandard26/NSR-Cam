import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const checklist = await db.checklist.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      assignees: { include: { user: true } },
      items: { include: { completions: { include: { user: true } } }, orderBy: { order: "asc" } },
    },
  })
  if (!checklist) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(checklist)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name } = await req.json()
  const checklist = await db.checklist.update({ where: { id }, data: { name } })
  return NextResponse.json(checklist)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.checklist.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
