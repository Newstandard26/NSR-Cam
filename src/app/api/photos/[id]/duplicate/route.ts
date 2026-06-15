import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const p = await db.photo.findUnique({ where: { id } })
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const copy = await db.photo.create({
    data: {
      projectId: p.projectId, userId: session.user.id, storageKey: p.storageKey, uri: p.uri,
      description: p.description, lat: p.lat, lng: p.lng, capturedAt: p.capturedAt,
    },
  })
  return NextResponse.json(copy, { status: 201 })
}
