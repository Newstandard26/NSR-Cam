import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const report = await db.report.findUnique({
    where: { id },
    include: { project: true, photoItems: { orderBy: { order: "asc" } } },
  })
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(report)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.report.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
