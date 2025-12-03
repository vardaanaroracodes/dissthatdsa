// API routes for individual class operations
// GET: Get class details, PATCH: Update class, DELETE: Delete class

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export const runtime = "nodejs";

// GET single class with registrations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        registrations: {
          include: {
            emailsSent: {
              include: {
                email: {
                  select: {
                    subject: true,
                    sentAt: true,
                  },
                },
              },
            },
          },
          orderBy: {
            registeredAt: 'desc',
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ class: classData });
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch class" },
      { status: 500 }
    );
  }
}

// PATCH: Update class
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth();
    const { id } = await params;

    const {
      title,
      description,
      scheduledAt,
      duration,
      meetingLink,
      price,
      maxParticipants,
      isLive,
    } = await request.json();

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Only allow updating own classes (or any class for superadmin)
    if (existingClass.createdById !== admin.id && admin.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "You can only edit your own classes" },
        { status: 403 }
      );
    }

    // Validate scheduled date if provided
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: "Scheduled time must be in the future" },
          { status: 400 }
        );
      }
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(duration !== undefined && { duration }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(price !== undefined && { price }),
        ...(maxParticipants !== undefined && { maxParticipants }),
        ...(isLive !== undefined && { isLive }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      class: updatedClass,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update class" },
      { status: 500 }
    );
  }
}

// DELETE: Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth();
    const { id } = await params;

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: {
        registrations: {
          where: {
            paymentStatus: 'COMPLETED',
          },
        },
      },
    });

    if (!existingClass) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Only allow deleting own classes (or any class for superadmin)
    if (existingClass.createdById !== admin.id && admin.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "You can only delete your own classes" },
        { status: 403 }
      );
    }

    // Prevent deletion if there are paid registrations
    if (existingClass.registrations.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete class with existing registrations" },
        { status: 400 }
      );
    }

    // Delete class (cascades to registrations)
    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete class" },
      { status: 500 }
    );
  }
}
