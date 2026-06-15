import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  acculynxRequest,
  isAccuLynxEnabled,
  syncJobToProject,
  type AccuLynxJob,
} from "@/lib/integrations/acculynx"

export const dynamic = "force-dynamic"

// Manual pull: fetch jobs from AccuLynx and sync them into NSR Cam.
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!(await isAccuLynxEnabled())) {
    return NextResponse.json({ error: "AccuLynx is not configured" }, { status: 400 })
  }

  // AccuLynx returns paginated jobs. Shape varies by account/API version;
  // we tolerate either { items: [...] } or a bare array.
  const raw = await acculynxRequest<{ items?: AccuLynxJob[] } | AccuLynxJob[]>(
    "GET",
    "/jobs?pageSize=100"
  )
  const jobs = Array.isArray(raw) ? raw : (raw.items ?? [])

  const results: { jobId: string; projectId?: string; error?: string }[] = []
  for (const job of jobs) {
    try {
      const projectId = await syncJobToProject(job)
      results.push({ jobId: job.id, projectId })
    } catch (err) {
      results.push({ jobId: job.id, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
