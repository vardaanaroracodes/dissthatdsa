// Authentication helpers for NextAuth
// Use these in API routes that need authentication

import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function getAuthAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
  });

  if (!admin || !admin.isApproved) {
    return null;
  }

  return admin;
}

export async function requireAuth() {
  const admin = await getAuthAdmin();

  if (!admin) {
    throw new Error("Unauthorized");
  }

  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAuth();

  if (admin.role !== 'SUPERADMIN') {
    throw new Error("Superadmin access required");
  }

  return admin;
}
