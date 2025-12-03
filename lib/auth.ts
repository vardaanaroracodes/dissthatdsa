// Better Auth configuration for admin authentication
// Handles login, session management, and role-based access control

import { betterAuth } from "better-auth"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// Custom auth implementation with Prisma
export const auth = betterAuth({
  database: {
    // Custom database adapter for Prisma
    async getUser(userId: string) {
      return await prisma.admin.findUnique({
        where: { id: userId },
      })
    },

    async getUserByEmail(email: string) {
      return await prisma.admin.findUnique({
        where: { email },
      })
    },

    async createUser(data: any) {
      // Hash password before storing
      const passwordHash = await bcrypt.hash(data.password, 10)

      return await prisma.admin.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
          role: data.role || 'ADMIN',
          isApproved: false, // Requires approval
        },
      })
    },

    async updateUser(userId: string, data: any) {
      return await prisma.admin.update({
        where: { id: userId },
        data,
      })
    },
  },

  emailAndPassword: {
    enabled: true,
    // Custom password verification
    async verifyPassword(password: string, hash: string) {
      return await bcrypt.compare(password, hash)
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
})

// Helper function to check if user is authenticated admin
export async function getAuthenticatedAdmin(request: Request) {
  const sessionToken = request.headers.get('cookie')?.split('session=')[1]?.split(';')[0]

  if (!sessionToken) {
    return null
  }

  // Verify session and get admin
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user?.id) {
      return null
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.user.id },
    })

    // Check if admin is approved
    if (!admin || !admin.isApproved) {
      return null
    }

    return admin
  } catch (error) {
    return null
  }
}

// Helper to check if user is superadmin
export async function isSuperAdmin(request: Request) {
  const admin = await getAuthenticatedAdmin(request)
  return admin?.role === 'SUPERADMIN'
}

// Helper to require authentication
export async function requireAuth(request: Request) {
  const admin = await getAuthenticatedAdmin(request)

  if (!admin) {
    throw new Error('Unauthorized - Please login')
  }

  return admin
}

// Helper to require superadmin
export async function requireSuperAdmin(request: Request) {
  const admin = await requireAuth(request)

  if (admin.role !== 'SUPERADMIN') {
    throw new Error('Unauthorized - Superadmin access required')
  }

  return admin
}
