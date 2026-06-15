import { getUserInitials } from "@/lib/utils"

export function Avatar({ name, color }: { name: string; color?: string | null }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
      style={{ backgroundColor: color || "#3B82F6" }}
      title={name}
    >
      {getUserInitials(name)}
    </div>
  )
}

export function LabelBadge({ name, color }: { name: string; color?: string | null }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        backgroundColor: (color || "#6B7280") + "22",
        color: color || "#6B7280",
      }}
    >
      {name}
    </span>
  )
}
