"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PhotoModal } from "./photo-modal"

export type PhotoItem = {
  id: string
  uri: string
  description: string | null
  capturedAt: Date | string
  lat: number | null
  lng: number | null
  user: { id: string; name: string | null; color: string | null } | null
  project?: { id: string; name: string } | null
  tags: { tag: { id: string; name: string; color: string } }[]
}

export function PhotoGrid({ photos }: { photos: PhotoItem[] }) {
  const [active, setActive] = useState<number | null>(null)
  const router = useRouter()

  if (photos.length === 0) {
    return <div className="text-sm text-gray-400 py-8 text-center">No photos yet.</div>
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActive(i)}
            className="aspect-square rounded-lg overflow-hidden bg-gray-100 group relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.uri}
              alt={p.description ?? ""}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <PhotoModal
          photos={photos}
          initialIndex={active}
          onClose={() => setActive(null)}
          onChanged={() => router.refresh()}
        />
      )}
    </>
  )
}
