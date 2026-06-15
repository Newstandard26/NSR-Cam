import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get("status") as "ACTIVE" | "ARCHIVED" | null
  const query = searchParams.get("query")
  const labelId = searchParams.get("label_id")

  const projects = await db.project.findMany({
    where: {
      status: status ?? "ACTIVE",
      ...(query && {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
        ],
      }),
      ...(labelId && { labels: { some: { labelId } } }),
    },
    include: {
      labels: { include: { label: true } },
      users: { include: { user: true } },
      photos: { orderBy: { createdAt: "desc" }, take: 4, select: { id: true, uri: true } },
      _count: { select: { photos: true, documents: true, checklists: true, pages: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, street1, city, state, postalCode, customerId } = body

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

  const project = await db.project.create({
    data: { name, street1, city, state, postalCode, customerId },
  })

  return NextResponse.json(project, { status: 201 })
}
