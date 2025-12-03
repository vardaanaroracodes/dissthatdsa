// NextAuth configuration with Google OAuth
// Handles admin authentication via Google and creates pending admin accounts

import { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string }
        })

        if (!admin || !admin.isApproved) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password as string,
          admin.passwordHash
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Check if admin exists
        const existingAdmin = await prisma.admin.findUnique({
          where: { email: user.email! }
        })

        if (!existingAdmin) {
          // Create new admin account (pending approval)
          await prisma.admin.create({
            data: {
              email: user.email!,
              name: user.name || user.email!.split('@')[0],
              passwordHash: '', // No password for OAuth users
              role: 'ADMIN',
              isApproved: false, // Requires superadmin approval
            }
          })

          return false // Don't sign in until approved
        }

        // Check if approved
        if (!existingAdmin.isApproved) {
          return false
        }

        return true
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/admin',
  },
  session: {
    strategy: "jwt"
  }
} satisfies NextAuthConfig
