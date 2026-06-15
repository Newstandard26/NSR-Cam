"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FolderOpen,
  Camera,
  Users,
  ClipboardList,
  FileText,
  Map,
  UserCircle,
  Star,
  Image,
  LayoutGrid,
  Tag,
  Layers,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  BarChart2,
  LogOut,
  LogIn,
} from "lucide-react"
import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { cn, getUserInitials } from "@/lib/utils"

const nav = [
  {
    label: "Projects",
    icon: FolderOpen,
    items: [
      { label: "All Projects", href: "/projects" },
      { label: "Boards", href: "/projects/boards" },
    ],
  },
  { label: "Camera", href: "/camera", icon: Camera },
  { label: "Photos", href: "/photos", icon: Image },
  { label: "Customers", href: "/customers", icon: UserCircle },
  { label: "Checklists", href: "/checklists", icon: ClipboardList },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Map", href: "/map", icon: Map },
  { label: "Team", href: "/team", icon: Users },
  {
    label: "Marketing",
    icon: Star,
    items: [
      { label: "Reviews", href: "/reviews" },
      { label: "Portfolio", href: "/portfolio" },
    ],
  },
  {
    label: "Resources",
    icon: Layers,
    items: [
      { label: "Integrations", href: "/settings/integrations" },
      { label: "Templates", href: "/templates" },
      { label: "Tags", href: "/tags" },
      { label: "Labels", href: "/labels" },
      { label: "Automations", href: "/automations" },
      { label: "Webhooks", href: "/settings/webhooks" },
    ],
  },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState<string[]>(["Projects", "Marketing", "Resources"])

  function toggle(label: string) {
    setOpen((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-gray-100 flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="text-lg font-bold tracking-tight text-white">NSR Cam</span>
        <p className="text-xs text-gray-400 mt-0.5">New Standard Restoration</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {nav.map((item) => {
          if ("items" in item) {
            const isOpen = open.includes(item.label)
            const Icon = item.icon
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
                {isOpen && (
                  <div className="ml-6 mt-0.5 space-y-0.5">
                    {(item.items ?? []).map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onNavigate}
                        className={cn(
                          "block px-2 py-1.5 rounded-md text-sm transition-colors",
                          pathname === sub.href || pathname.startsWith(sub.href + "/")
                            ? "bg-blue-600 text-white"
                            : "text-gray-400 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-700 px-2 py-2 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
            pathname.startsWith("/settings")
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-2 px-2 py-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
              style={{ backgroundColor: session.user.color || "#3B82F6" }}
            >
              {getUserInitials(session.user.name || session.user.email || "?")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {session.user.name || session.user.email}
              </p>
              {session.user.role && (
                <p className="text-[10px] text-gray-400 capitalize">
                  {session.user.role.toLowerCase()}
                </p>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  )
}
