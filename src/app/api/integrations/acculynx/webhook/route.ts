import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { syncJobToProject, type AccuLynxJob } from "@/lib/integrations/acculynx"

export const dynamic = "force-dynamic"

// AccuLynx posts job lifecycle events here. Configure this URL in AccuLynx:
//   https://<your-app>/api/integrations/acculynx/webhook
export async function POST(req: NextRequest) {
  let body: { event?: string; type?: string; job?: AccuLynxJob; data?: AccuLynxJob }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType = body.event || body.type || "unknown"
  const job = body.job || body.data

  const event = await db.accuLynxEvent.create({
    data: {
      eventType,
      acculynxJobId: job?.id ?? null,
      payload: body as object,
    },
  })

  // Respond 200 immediately, then process. (Heavy work could be queued.)
  try {
    if (job?.id && /job\.(created|updated)|job_created|job_updated/i.test(eventType)) {
      await syncJobToProject(job)
    }
    await db.accuLynxEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    })
  } catch (err) {
    await db.accuLynxEvent.update({
      where: { id: event.id },
      data: { error: err instanceof Error ? err.message : String(err) },
    })
  }

  return NextResponse.json({ received: true })
}
