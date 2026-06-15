import Link from "next/link"
import { MapPin } from "lucide-react"
import { LabelBadge } from "@/components/ui/badges"

type Project = {
  id: string
  name: string
  street1: string | null
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
  labels: { label: { id: string; name: string; color: string } }[]
  _count: { photos: number }
}

export function ProjectMap({ projects }: { projects: Project[] }) {
  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-gray-200 overflow-y-auto bg-white">
        <div className="p-3 text-xs text-gray-500 border-b">{projects.length} located project(s)</div>
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="block px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand" /><span className="font-medium text-gray-900 text-sm">{p.name}</span></div>
            <p className="text-xs text-gray-500 ml-6">{[p.street1, p.city, p.state].filter(Boolean).join(", ")}</p>
            <div className="ml-6 mt-1 flex gap-1">{p.labels.map((l) => <LabelBadge key={l.label.id} name={l.label.name} color={l.label.color} />)}</div>
          </Link>
        ))}
      </div>
      <div className="flex-1 bg-gray-100 flex items-center justify-center text-sm text-gray-400">
        Map view — add NEXT_PUBLIC_MAPBOX_TOKEN to render interactive pins. Projects are geocoded by lat/lng.
      </div>
    </div>
  )
}
