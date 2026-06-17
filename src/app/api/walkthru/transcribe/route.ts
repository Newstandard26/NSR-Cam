import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getOpenAI } from "@/lib/openai"

export const dynamic = "force-dynamic"
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const form = await req.formData()
    const audio = form.get("audio") as File
    if (!audio) return NextResponse.json({ error: "No audio" }, { status: 400 })

    const openai = getOpenAI()
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "en",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = transcription as any
    return NextResponse.json({ transcript: t.text, segments: t.segments ?? [] })
  } catch (err) {
    return NextResponse.json({ error: "Transcription failed", detail: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
