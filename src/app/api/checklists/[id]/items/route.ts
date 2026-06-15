import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

// Toggle a checklist item's completion for the current user.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { itemId, completed } = await req.json()
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 })

  if (completed) {
    await db.checklistItemCompletion.create({
      data: { itemId, userId: session.user.id },
    })
  } else {
    await db.checklistItemCompletion.deleteMany({ where: { itemId } })
  }
  await db.checklist.update({ where: { id }, data: { updatedAt: new Date() } })
  return NextResponse.json({ success: true })
}
