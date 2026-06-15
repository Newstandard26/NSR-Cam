"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { Avatar, LabelBadge } from "@/components/ui/badges"

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

  if (photos.length === 0) {
    return <div className="text-sm text-gray-400 py-8 text-center">No photos yet.</div>
  }

  const photo = active !== null ? photos[active] : null

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

      {photo && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setActive(null)}
          >
            <X className="w-7 h-7" />
          </button>
          {active! > 0 && (
            <button
              className="absolute left-4 text-white/80 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                setActive(active! - 1)
              }}
            >
              <ChevronLeft className="w-9 h-9" />
            </button>
          )}
          {active! < photos.length - 1 && (
            <button
              className="absolute right-4 text-white/80 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                setActive(active! + 1)
              }}
            >
              <ChevronRight className="w-9 h-9" />
            </button>
          )}
          <div
            className="flex flex-col md:flex-row gap-4 max-w-6xl w-full px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.uri}
              alt={photo.description ?? ""}
              className="max-h-[80vh] object-contain rounded-lg flex-1"
            />
            <div className="md:w-72 bg-white rounded-lg p-4 text-sm">
              {photo.user && (
                <div className="flex items-center gap-2 mb-3">
                  <Avatar name={photo.user.name || "?"} color={photo.user.color} />
                  <span className="font-medium">{photo.user.name}</span>
                </div>
              )}
              <p className="text-gray-500 mb-2">
                {new Date(photo.capturedAt).toLocaleString()}
              </p>
              {photo.project && (
                <p className="text-gray-700 mb-2">{photo.project.name}</p>
              )}
              {photo.description && <p className="text-gray-700 mb-3">{photo.description}</p>}
              {photo.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {photo.tags.map((t) => (
                    <LabelBadge key={t.tag.id} name={t.tag.name} color={t.tag.color} />
                  ))}
                </div>
              )}
              {photo.lat && photo.lng && (
                <a
                  href={`https://maps.google.com/?q=${photo.lat},${photo.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <MapPin className="w-4 h-4" /> View location
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
