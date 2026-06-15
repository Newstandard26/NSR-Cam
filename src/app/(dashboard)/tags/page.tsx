import { db } from "@/lib/db"
import { TagManager } from "@/components/tags/tag-manager"

export default async function TagsPage() {
  const tags = await db.tag.findMany({
    include: { _count: { select: { photoTags: true } } },
    orderBy: { name: "asc" },
  })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tags</h1>
      <TagManager tags={tags} />
    </div>
  )
}
