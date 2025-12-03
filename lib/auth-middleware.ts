// Authentication middleware for protected API routes
// Verifies JWT tokens and checks admin permissions

import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "./prisma";

interface AdminJWTPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'SUPERADMIN';
}

// Verify and decode JWT token from request
export async function verifyAuth(request: NextRequest): Promise<AdminJWTPayload | null> {
  try {
    const token = request.cookies.get("admin_session")?.value;

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production"
    );

    const { payload } = await jwtVerify(token, secret);

    // Extract and validate payload
    if (
      typeof payload.id === 'string' &&
      typeof payload.email === 'string' &&
      (payload.role === 'ADMIN' || payload.role === 'SUPERADMIN')
    ) {
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Get authenticated admin from request
export async function getAuthAdmin(request: NextRequest) {
  const payload = await verifyAuth(request);

  if (!payload) {
    return null;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: payload.id },
  });

  if (!admin || !admin.isApproved) {
    return null;
  }

  return admin;
}

// Require authentication (throws error if not authenticated)
export async function requireAuth(request: NextRequest) {
  const admin = await getAuthAdmin(request);

  if (!admin) {
    throw new Error("Unauthorized");
  }

  return admin;
}

// Require superadmin role (throws error if not superadmin)
export async function requireSuperAdmin(request: NextRequest) {
  const admin = await requireAuth(request);

  if (admin.role !== 'SUPERADMIN') {
    throw new Error("Superadmin access required");
  }

  return admin;
}
