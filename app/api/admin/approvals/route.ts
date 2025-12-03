// API routes for admin approval management (superadmin only)
// GET: List pending admins, POST: Approve/reject admin

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth-helpers";

export const runtime = "nodejs";

// GET all admins (pending and approved)
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const admins = await prisma.admin.findMany({
      where: {
        ...(status === "pending" && { isApproved: false }),
        ...(status === "approved" && { isApproved: true }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
        _count: {
          select: {
            createdClasses: true,
            sentEmails: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch admins" },
      { status: error instanceof Error && error.message.includes('Superadmin') ? 403 : 500 }
    );
  }
}

// POST: Approve or reject admin
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const { adminId, action } = await request.json();

    if (!adminId || !action) {
      return NextResponse.json(
        { error: "Admin ID and action are required" },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Approve admin
      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: { isApproved: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Admin approved successfully",
        admin: updatedAdmin,
      });
    } else {
      // Reject (delete) admin
      await prisma.admin.delete({
        where: { id: adminId },
      });

      return NextResponse.json({
        success: true,
        message: "Admin rejected and removed",
      });
    }
  } catch (error) {
    console.error("Error processing approval:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process approval" },
      { status: error instanceof Error && error.message.includes('Superadmin') ? 403 : 500 }
    );
  }
}
