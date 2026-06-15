import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

// Geocode an address to { lat, lng } via Mapbox. Requires NEXT_PUBLIC_MAPBOX_TOKEN.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const address = req.nextUrl.searchParams.get("address")
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 })

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return NextResponse.json({ error: "Mapbox token not configured" }, { status: 503 })

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?limit=1&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: "Geocoding failed" }, { status: 502 })
  const data = await res.json()
  const center = data.features?.[0]?.center
  if (!center) return NextResponse.json({ error: "No result" }, { status: 404 })

  return NextResponse.json({ lng: center[0], lat: center[1] })
}
