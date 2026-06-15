import { AccuLynxSettings } from "@/components/integrations/acculynx-settings"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function IntegrationsPage() {
  const settings = await db.integrationSettings.findUnique({ where: { provider: "acculynx" } })
  const syncCount = await db.accuLynxSync.count()
  const lastEvent = await db.accuLynxEvent.findFirst({ orderBy: { receivedAt: "desc" } })

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Integrations</h1>
      <p className="text-sm text-gray-500 mb-6">
        Connect NSR Cam to your other tools.
      </p>
      <AccuLynxSettings
        initial={{
          enabled: settings?.enabled ?? false,
          baseUrl: settings?.baseUrl ?? "",
          hasApiKey: Boolean(settings?.apiKey),
        }}
        syncedProjects={syncCount}
        lastEventAt={lastEvent?.receivedAt?.toISOString() ?? null}
      />
    </div>
  )
}
