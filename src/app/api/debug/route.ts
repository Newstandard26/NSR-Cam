import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function maskHost(url: string | undefined) {
  if (!url) return null
  try {
    const u = new URL(url)
    return {
      host: u.hostname,
      database: u.pathname.replace("/", ""),
      user: u.username,
    }
  } catch {
    return { raw: "unparseable" }
  }
}

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: maskHost(process.env.DATABASE_URL),
    POSTGRES_URL: maskHost(process.env.POSTGRES_URL),
    POSTGRES_PRISMA_URL: maskHost(process.env.POSTGRES_PRISMA_URL),
    resolved_priority: process.env.DATABASE_URL
      ? "DATABASE_URL"
      : process.env.POSTGRES_URL
        ? "POSTGRES_URL"
        : process.env.POSTGRES_PRISMA_URL
          ? "POSTGRES_PRISMA_URL"
          : "NONE",
  })
}
