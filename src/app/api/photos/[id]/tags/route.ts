import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// Replace the photo's tags with the given set.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { tagIds } = await req.json()
  await db.$transaction([
    db.photoTag.deleteMany({ where: { photoId: id } }),
    db.photoTag.createMany({
      data: (tagIds || []).map((tagId: string) => ({ photoId: id, tagId })),
      skipDuplicates: true,
    }),
  ])
  const tags = await db.photoTag.findMany({ where: { photoId: id }, include: { tag: true } })
  return NextResponse.json(tags)
}
