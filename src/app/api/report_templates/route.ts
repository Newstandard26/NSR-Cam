import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await db.reportTemplate.findMany({ orderBy: { updatedAt: "desc" } }))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const t = await db.reportTemplate.create({ data: { name, description: description ?? null } })
  return NextResponse.json(t, { status: 201 })
}
