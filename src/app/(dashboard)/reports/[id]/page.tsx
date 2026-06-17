import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

type WalkthruContent = {
  summary?: string
  sections?: { heading: string; bullets: string[]; photos?: string[] }[]
  actionItems?: string[]
  rawTranscript?: string
  durationSeconds?: number
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const report = await db.report.findUnique({
    where: { id },
    include: { project: { select: { id: true, name: true } } },
  })
  if (!report) notFound()

  const c = (report.content as WalkthruContent) || {}
  const isWalkthru = report.kind === "walkthru"

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-1 text-sm text-gray-400 mb-3">
        <Link href="/reports" className="hover:text-gray-600">Reports</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 truncate">{report.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        <Link href={`/projects/${report.project.id}`} className="text-brand hover:underline">{report.project.name}</Link>
        {" · "}{new Date(report.createdAt).toLocaleString()}
        {isWalkthru && c.durationSeconds ? ` · ${Math.round(c.durationSeconds / 60)} min walkthrough` : ""}
      </p>

      {!isWalkthru ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {report.pdfUri ? <a href={report.pdfUri} target="_blank" rel="noreferrer" className="text-brand hover:underline">Download PDF</a> : <p className="text-sm text-gray-500">Standard report.</p>}
        </div>
      ) : (
        <div className="space-y-5">
          {c.summary && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm text-gray-800">{c.summary}</p>
            </div>
          )}

          {(c.sections || []).map((s, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="font-semibold text-gray-900 mb-2">{s.heading}</h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 mb-3">
                {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
              {s.photos && s.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {s.photos.map((url, k) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={k} src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          ))}

          {c.actionItems && c.actionItems.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="font-semibold text-gray-900 mb-2">Action Items</h2>
              <ul className="space-y-1 text-sm text-gray-700">
                {c.actionItems.map((a, i) => <li key={i} className="flex items-start gap-2"><span className="text-brand">▢</span> {a}</li>)}
              </ul>
            </div>
          )}

          {c.rawTranscript && (
            <details className="rounded-xl border border-gray-200 bg-white p-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">Raw transcript</summary>
              <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">{c.rawTranscript}</p>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
