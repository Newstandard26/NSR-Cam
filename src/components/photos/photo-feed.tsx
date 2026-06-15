"use client"

import { useMemo } from "react"
import { PhotoGrid, type PhotoItem } from "./photo-grid"

function dateHeader(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function PhotoFeed({ photos }: { photos: PhotoItem[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, PhotoItem[]>()
    for (const p of photos) {
      const key = dateHeader(new Date(p.capturedAt))
      const arr = map.get(key) ?? []
      arr.push(p)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [photos])

  if (photos.length === 0) {
    return <div className="text-sm text-gray-400 py-12 text-center">No photos yet.</div>
  }

  return (
    <div className="space-y-8">
      {groups.map(([header, items]) => (
        <div key={header}>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-gray-50 py-1">
            {header}
          </h2>
          <PhotoGrid photos={items} />
        </div>
      ))}
    </div>
  )
}
