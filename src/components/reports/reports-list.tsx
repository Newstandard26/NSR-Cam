import Link from "next/link"
import { FileText } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

type Report = {
  id: string
  name: string
  createdAt: Date | string
  pdfUri: string | null
  project: { id: string; name: string }
}

export function ReportsList({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No reports yet. Create one from a project's Reports tab.</div>
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
      {reports.map((r) => (
        <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
          <FileText className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{r.name}</p>
            <Link href={`/projects/${r.project.id}`} className="text-xs text-blue-600 hover:underline">{r.project.name}</Link>
          </div>
          <span className="text-xs text-gray-400">{formatRelativeTime(r.createdAt)}</span>
          {r.pdfUri && <a href={r.pdfUri} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">PDF</a>}
        </div>
      ))}
    </div>
  )
}
