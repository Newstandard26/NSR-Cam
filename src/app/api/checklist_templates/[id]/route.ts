import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { name, description, items } = await req.json()
  // Replace items wholesale for simplicity.
  await db.checklistTemplateItem.deleteMany({ where: { templateId: id } })
  const template = await db.checklistTemplate.update({
    where: { id },
    data: {
      name,
      description: description ?? null,
      items: { create: (items || []).map((label: string, order: number) => ({ label, order })) },
    },
    include: { items: true },
  })
  return NextResponse.json(template)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.checklistTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
