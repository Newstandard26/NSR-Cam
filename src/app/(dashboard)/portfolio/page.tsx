import { db } from "@/lib/db"
import { PortfolioGrid } from "@/components/portfolio/portfolio-grid"

export default async function PortfolioPage() {
  const showcases = await db.showcase.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: { select: { name: true, city: true, state: true } } },
  })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Portfolio & Showcases</h1>
      <PortfolioGrid showcases={showcases} />
    </div>
  )
}
