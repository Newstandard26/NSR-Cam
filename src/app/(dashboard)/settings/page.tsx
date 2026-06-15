import Link from "next/link"
import { Plug, Webhook, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

const sections = [
  {
    href: "/settings/integrations",
    icon: Plug,
    title: "Integrations",
    desc: "Connect AccuLynx — sync jobs to projects, map statuses to labels, push photos back.",
  },
  {
    href: "/settings/webhooks",
    icon: Webhook,
    title: "Webhooks",
    desc: "Subscribe external endpoints to NSR Cam events.",
  },
]

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">Manage integrations, webhooks, and workspace configuration.</p>
      <div className="space-y-3">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-medium text-gray-900">{s.title}</h2>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
