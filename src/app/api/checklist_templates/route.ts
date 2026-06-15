import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const templates = await db.checklistTemplate.findMany({
    include: { items: { orderBy: { order: "asc" } }, _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, description, items } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const template = await db.checklistTemplate.create({
    data: {
      name,
      description: description || null,
      items: {
        create: (items || []).map((label: string, idx: number) => ({ label, order: idx })),
      },
    },
    include: { items: true },
  })
  return NextResponse.json(template, { status: 201 })
}
