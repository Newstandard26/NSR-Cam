import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user || !user.email || !user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
      }
      // Refresh user fields on sign-in and on session update (e.g. after password change)
      if (user || trigger === "update") {
        const dbUser = await db.user.findUnique({ where: { id: token.id as string } })
        token.role = dbUser?.role ?? undefined
        token.initials = dbUser?.initials ?? undefined
        token.color = dbUser?.color ?? undefined
        token.mustChangePassword = dbUser?.mustChangePassword ?? false
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.initials = token.initials as string
        session.user.color = token.color as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
}
