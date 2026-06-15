import { db } from "@/lib/db"
import { PhotoFeed } from "@/components/photos/photo-feed"

export default async function PhotosPage() {
  const photos = await db.photo.findMany({
    include: {
      user: true,
      project: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { capturedAt: "desc" },
    take: 50,
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Photos</h1>
      <PhotoFeed photos={photos} />
    </div>
  )
}
