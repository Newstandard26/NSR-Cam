import { Avatar } from "@/components/ui/badges"

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  _count: { projects: number }
}

export function CustomersTable({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) {
    return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No customers yet. Customers are created automatically when AccuLynx jobs sync, or add one from a project.</div>
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Phone</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium text-right">Projects</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 flex items-center gap-2">
                <Avatar name={c.name} /> <span className="font-medium text-gray-900">{c.name}</span>
              </td>
              <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
              <td className="px-4 py-3 text-gray-600">{c.email || "—"}</td>
              <td className="px-4 py-3 text-right text-gray-600">{c._count.projects}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
