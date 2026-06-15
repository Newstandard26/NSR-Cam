import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await db.webhook.findMany({ orderBy: { createdAt: "desc" } }))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { url, events } = await req.json()
  if (!url || !Array.isArray(events)) return NextResponse.json({ error: "url and events required" }, { status: 400 })
  const webhook = await db.webhook.create({ data: { url, events, secret: randomBytes(24).toString("hex") } })
  return NextResponse.json(webhook, { status: 201 })
}
