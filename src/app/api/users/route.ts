import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hashPassword, generateTempPassword } from "@/lib/password"
import { getUserInitials, getUserColor } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, color: true },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(users)
}

// Invite a new team member. Generates a temp password, returns it ONCE so it
// can be shared with the user. They must change it on first sign-in.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const { name, email, role } = await req.json()
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 })

  const tempPassword = generateTempPassword()
  const passwordHash = await hashPassword(tempPassword)

  const user = await db.user.create({
    data: {
      name: name || null,
      email,
      role: role || "FIELD",
      initials: name ? getUserInitials(name) : null,
      color: getUserColor(email),
      passwordHash,
      mustChangePassword: true,
    },
    select: { id: true, name: true, email: true, role: true },
  })

  // tempPassword returned once for the admin to relay to the new user.
  return NextResponse.json({ user, tempPassword }, { status: 201 })
}
