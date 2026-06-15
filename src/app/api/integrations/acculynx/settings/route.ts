import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await db.integrationSettings.findUnique({ where: { provider: "acculynx" } })
  // Never return the raw key — just whether one is set.
  return NextResponse.json({
    enabled: settings?.enabled ?? false,
    baseUrl: settings?.baseUrl ?? "",
    hasApiKey: Boolean(settings?.apiKey),
  })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { enabled, apiKey, baseUrl } = await req.json()

  const settings = await db.integrationSettings.upsert({
    where: { provider: "acculynx" },
    update: {
      enabled: enabled ?? undefined,
      baseUrl: baseUrl ?? undefined,
      // Only overwrite the key when a non-empty value is provided.
      ...(apiKey ? { apiKey } : {}),
    },
    create: { provider: "acculynx", enabled: enabled ?? false, baseUrl, apiKey },
  })

  return NextResponse.json({
    enabled: settings.enabled,
    baseUrl: settings.baseUrl,
    hasApiKey: Boolean(settings.apiKey),
  })
}
