import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const p = await db.project.findUnique({ where: { id }, select: { starred: true } })
  const updated = await db.project.update({ where: { id }, data: { starred: !p?.starred } })
  return NextResponse.json({ starred: updated.starred })
}
