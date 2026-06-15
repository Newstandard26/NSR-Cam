import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const project = await db.project.findUnique({
    where: { id },
    include: {
      customer: true,
      labels: { include: { label: true } },
      users: { include: { user: true } },
      collaborators: true,
      tasks: true,
      _count: { select: { photos: true, documents: true, checklists: true, pages: true } },
    },
  })

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const project = await db.project.update({ where: { id }, data: body })
  return NextResponse.json(project)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.project.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
