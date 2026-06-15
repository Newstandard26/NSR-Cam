import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Avatar, LabelBadge } from "@/components/ui/badges"
import { BottomTabBar } from "@/components/bottom-tab-bar"
import { formatRelativeTime } from "@/lib/utils"
import { FolderOpen, Map, Users, Star, Camera } from "lucide-react"

export const dynamic = "force-dynamic"

const TILES = [
  { label: "My Stuff", href: "/projects", icon: FolderOpen },
  { label: "Map", href: "/map", icon: Map },
  { label: "Team", href: "/team", icon: Users },
  { label: "Portfolio", href: "/portfolio", icon: Star },
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const [projects, activity] = await Promise.all([
    db.project.findMany({
      where: { status: "ACTIVE" },
      include: {
        labels: { include: { label: true } },
        users: { include: { user: true } },
        photos: { orderBy: { createdAt: "desc" }, take: 1, select: { uri: true } },
        _count: { select: { photos: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    db.photo.findMany({
      include: { user: true, project: { select: { id: true } } },
      orderBy: { capturedAt: "desc" },
      take: 10,
    }),
  ])

  return (
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
      </h1>

      {/* Quick tiles */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {TILES.map((t) => {
          const Icon = t.icon
          return (
            <Link key={t.label} href={t.href} className="flex flex-col items-center gap-1 bg-white border border-gray-200 rounded-xl py-3 hover:border-gray-300">
              <Icon className="w-5 h-5 text-brand" />
              <span className="text-[11px] text-gray-600">{t.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Projects */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-gray-900">Projects</h2>
        <Link href="/projects" className="text-sm text-brand">See All</Link>
      </div>
      <div className="space-y-2 mb-6">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-2">
            <Link href={`/projects/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {(p.coverPhotoUrl || p.photos[0]?.uri) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverPhotoUrl || p.photos[0].uri} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-500 truncate">{[p.city, p.state].filter(Boolean).join(", ") || "No address"}</p>
                <div className="flex gap-1 mt-1">{p.labels.slice(0, 2).map((l) => <LabelBadge key={l.label.id} name={l.label.name} color={l.label.color} />)}</div>
              </div>
            </Link>
            <Link href={`/camera?project=${p.id}`} className="shrink-0 w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center" title={`Camera — ${p.name}`}>
              <Camera className="w-5 h-5" />
            </Link>
          </div>
        ))}
        {projects.length === 0 && <p className="text-sm text-gray-400">No projects yet.</p>}
      </div>

      {/* Activity */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-gray-900">Activity</h2>
        <Link href="/photos" className="text-sm text-brand">See All</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {activity.map((ph) => (
          <Link key={ph.id} href={`/projects/${ph.project.id}`} className="shrink-0 w-24">
            <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.uri} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1 mt-1">
              {ph.user && <Avatar name={ph.user.name || "?"} color={ph.user.color} />}
              <span className="text-[10px] text-gray-400">{formatRelativeTime(ph.capturedAt)}</span>
            </div>
          </Link>
        ))}
        {activity.length === 0 && <p className="text-sm text-gray-400">No recent photos.</p>}
      </div>

      <BottomTabBar />
    </div>
  )
}
