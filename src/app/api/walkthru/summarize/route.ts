import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getOpenAI } from "@/lib/openai"

export const dynamic = "force-dynamic"
export const maxDuration = 120

function fmt(secs: number) {
  return `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { transcript, photos, projectId, durationSeconds } = await req.json()
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 })

    const project = await db.project.findUnique({ where: { id: projectId }, select: { name: true } })
    const photoList = (photos || []) as { url: string; timestamp: number }[]

    const prompt = `You are a construction field-documentation assistant for New Standard Restoration.
A technician recorded a job-site walkthrough for project "${project?.name ?? "Unknown"}" (${Math.round((durationSeconds || 0) / 60)} min).

TRANSCRIPT:
${transcript || "(no speech detected)"}

PHOTOS (timestamp seconds): ${photoList.map((p) => p.timestamp).join(", ") || "none"}

Produce a clean professional walkthrough report. Remove ums/uhs/filler. Return JSON only:
{
  "title": "Job Site Walkthrough — <date>",
  "summary": "2-4 sentence executive summary",
  "sections": [{ "heading": "...", "bullets": ["..."], "photoTimestamps": [12,45] }],
  "actionItems": ["..."]
}`

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
    const data = JSON.parse(completion.choices[0].message.content || "{}")

    const sections = (data.sections || []).map((s: { heading: string; bullets: string[]; photoTimestamps?: number[] }) => ({
      heading: s.heading,
      bullets: s.bullets || [],
      photos: photoList.filter((p) => (s.photoTimestamps || []).some((t) => Math.abs(p.timestamp - t) < 30)).map((p) => p.url),
    }))

    const report = await db.report.create({
      data: {
        projectId,
        name: data.title || `Walkthrough — ${new Date().toLocaleDateString()}`,
        kind: "walkthru",
        content: {
          summary: data.summary || "",
          sections,
          actionItems: data.actionItems || [],
          rawTranscript: transcript || "",
          durationSeconds: durationSeconds || 0,
          generatedAt: new Date().toISOString(),
        },
      },
    })
    return NextResponse.json({ reportId: report.id })
  } catch (err) {
    return NextResponse.json({ error: "Summary failed", detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
