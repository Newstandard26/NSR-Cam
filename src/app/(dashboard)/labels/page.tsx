import { db } from "@/lib/db"
import { LabelManager } from "@/components/labels/label-manager"

export default async function LabelsPage() {
  const labels = await db.label.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Labels</h1>
      <LabelManager labels={labels} />
    </div>
  )
}
