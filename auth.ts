// NextAuth v5 configuration
// Handles Google OAuth and credentials authentication for admins

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        // Delegate password verification to the login API route
        // This runs in Node.js runtime, not Edge Runtime
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!response.ok) {
          return null
        }

        const data = await response.json()
        
        if (data.success && data.admin) {
          return {
            id: data.admin.id,
            email: data.admin.email,
            name: data.admin.name,
            role: data.admin.role,
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true
    },
    async jwt({ token, user, account }) {
      // Handle Google OAuth login
      if (account?.provider === "google" && user?.email) {
        // Call API to handle Google OAuth user creation/verification
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/auth/google-signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          token.approved = data.approved
          token.role = data.role
          token.id = data.id
        } else {
          token.approved = false
          token.role = 'ADMIN'
        }
      } else if (user) {
        // For credentials login
        token.role = (user as any).role
        token.id = user.id
        token.approved = true
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id = token.id as string
        (session.user as any).approved = token.approved as boolean

        // Redirect to error page if not approved
        if (token.approved === false) {
          throw new Error('AccountPendingApproval')
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  session: {
    strategy: "jwt"
  }
})
