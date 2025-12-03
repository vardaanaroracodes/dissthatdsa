// Google OAuth signin endpoint
// Handles Google OAuth user creation and verification

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifySuperAdminsNewAdminRequest } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!existingAdmin) {
      // Create new admin account (pending approval)
      const newAdmin = await prisma.admin.create({
        data: {
          email,
          name: name || email.split('@')[0],
          passwordHash: '', // No password for OAuth users
          role: 'ADMIN',
          isApproved: false,
        }
      });

      // Notify superadmins about the new admin request
      // Don't await to avoid blocking the response
      notifySuperAdminsNewAdminRequest(email, name || email.split('@')[0])
        .catch((error) => {
          console.error('Failed to notify superadmins:', error);
        });

      return NextResponse.json({
        approved: false,
        role: 'ADMIN',
        id: newAdmin.id,
      });
    }

    // Return existing admin info
    return NextResponse.json({
      approved: existingAdmin.isApproved,
      role: existingAdmin.role,
      id: existingAdmin.id,
    });
  } catch (error) {
    console.error("Google signin error:", error);
    return NextResponse.json(
      { error: "Google signin failed" },
      { status: 500 }
    );
  }
}
