"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

type Stats = { totalProjects: number; totalPhotos: number; totalChecklists: number; totalUsers: number }

export function AnalyticsDashboard({ stats }: { stats: Stats }) {
  const data = [
    { name: "Projects", value: stats.totalProjects },
    { name: "Photos", value: stats.totalPhotos },
    { name: "Checklists", value: stats.totalChecklists },
    { name: "Team", value: stats.totalUsers },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {data.map((s) => (
          <div key={s.name} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.name}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
