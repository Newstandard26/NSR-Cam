import { db } from "@/lib/db"
import { WebhookManager } from "@/components/settings/webhook-manager"

export default async function WebhooksPage() {
  const webhooks = await db.webhook.findMany({ orderBy: { createdAt: "desc" } })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Webhooks</h1>
      <WebhookManager webhooks={webhooks} />
    </div>
  )
}
