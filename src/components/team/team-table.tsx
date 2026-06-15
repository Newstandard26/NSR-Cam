import { Avatar } from "@/components/ui/badges"

type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  color: string | null
  _count: { projectUsers: number; photos: number }
}

export function TeamTable({ users }: { users: User[] }) {
  if (users.length === 0) {
    return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">No team members yet.</div>
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
          <tr>
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2 font-medium text-right">Projects</th>
            <th className="px-4 py-2 font-medium text-right">Photos</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 flex items-center gap-2">
                <Avatar name={u.name || "?"} color={u.color} /> <span className="font-medium text-gray-900">{u.name}</span>
              </td>
              <td className="px-4 py-3 text-gray-600">{u.email || "—"}</td>
              <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{u.role}</span></td>
              <td className="px-4 py-3 text-right text-gray-600">{u._count.projectUsers}</td>
              <td className="px-4 py-3 text-right text-gray-600">{u._count.photos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
