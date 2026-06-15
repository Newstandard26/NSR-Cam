import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await db.label.findMany({ orderBy: { name: "asc" } }))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, color } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  const label = await db.label.create({ data: { name, color: color || "#6B7280" } })
  return NextResponse.json(label, { status: 201 })
}
