import { db } from "@/lib/db"
import { TemplatesHub } from "@/components/templates/templates-hub"

export default async function TemplatesPage() {
  const [checklistTemplates, reportTemplates, pageTemplates] = await Promise.all([
    db.checklistTemplate.findMany({ include: { _count: { select: { items: true } } }, orderBy: { updatedAt: "desc" } }),
    db.reportTemplate.findMany({ orderBy: { updatedAt: "desc" } }),
    db.pageTemplate.findMany({ orderBy: { updatedAt: "desc" } }),
  ])
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Templates</h1>
      <TemplatesHub checklistTemplates={checklistTemplates} reportTemplates={reportTemplates} pageTemplates={pageTemplates} />
    </div>
  )
}
