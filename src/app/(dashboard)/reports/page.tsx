import { db } from "@/lib/db"
import { ReportsList } from "@/components/reports/reports-list"

export default async function ReportsPage() {
  const reports = await db.report.findMany({
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
      <ReportsList reports={reports} />
    </div>
  )
}
