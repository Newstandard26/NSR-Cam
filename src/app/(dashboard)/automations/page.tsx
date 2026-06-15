import { db } from "@/lib/db"
import { AutomationRulesList } from "@/components/automations/automations-list"

export default async function AutomationsPage() {
  const rules = await db.automationRule.findMany({ orderBy: { createdAt: "desc" } })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Automations</h1>
      <AutomationRulesList rules={rules} />
    </div>
  )
}
