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
  const filter = searchParams.get("filter") // mine | starred

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
      ...(filter === "mine" && { users: { some: { userId: session.user.id } } }),
      ...(filter === "starred" && { starred: true }),
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

  // Best-effort geocode so the project shows on the map.
  let lat: number | null = null
  let lng: number | null = null
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const addr = [street1, city, state, postalCode].filter(Boolean).join(", ")
  if (token && addr) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?limit=1&access_token=${token}`
      const geo = await fetch(url)
      if (geo.ok) {
        const data = await geo.json()
        const center = data.features?.[0]?.center
        if (center) {
          lng = center[0]
          lat = center[1]
        }
      }
    } catch {
      // ignore geocode failures
    }
  }

  const project = await db.project.create({
    data: { name, street1, city, state, postalCode, customerId, lat, lng },
  })

  return NextResponse.json(project, { status: 201 })
}
