import { db } from "@/lib/db"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export default async function AnalyticsPage() {
  const [totalProjects, totalPhotos, totalChecklists, totalUsers] = await Promise.all([
    db.project.count({ where: { status: "ACTIVE" } }),
    db.photo.count(),
    db.checklist.count(),
    db.user.count(),
  ])
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h1>
      <AnalyticsDashboard stats={{ totalProjects, totalPhotos, totalChecklists, totalUsers }} />
    </div>
  )
}
