import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  return NextResponse.json(await db.comment.findMany({ where: { photoId: id }, include: { user: true }, orderBy: { createdAt: "asc" } }))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { body } = await req.json()
  if (!body) return NextResponse.json({ error: "body required" }, { status: 400 })
  const comment = await db.comment.create({
    data: { text: body, photoId: id, userId: session.user.id },
    include: { user: true },
  })
  return NextResponse.json(comment, { status: 201 })
}
