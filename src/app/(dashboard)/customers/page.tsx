import { db } from "@/lib/db"
import { CustomersTable } from "@/components/customers/customers-table"

export default async function CustomersPage() {
  const customers = await db.customer.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { name: "asc" },
  })
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>
      <CustomersTable customers={customers} />
    </div>
  )
}
