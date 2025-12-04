// API routes for class management (CRUD operations)
// GET: List all classes, POST: Create new class

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export const runtime = "nodejs";

// GET all classes (with filters)
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const isLive = searchParams.get("isLive");
    const adminId = searchParams.get("adminId");

    const classes = await prisma.class.findMany({
      where: {
        ...(isLive !== null && { isLive: isLive === "true" }),
        ...(adminId && { createdById: adminId }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        registrations: {
          where: {
            paymentStatus: 'COMPLETED',
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    // Add registration count to each class
    // @ts-ignore
    const classesWithCount = classes.map((c) => ({
      ...c,
      registrationCount: c.registrations.length,
    }));

    return NextResponse.json({ classes: classesWithCount });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// POST: Create new class
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();

    const {
      title,
      description,
      scheduledAt,
      duration,
      meetingLink,
      price,
      maxParticipants,
    } = await request.json();

    // Validate required fields
    if (!title || !description || !scheduledAt) {
      return NextResponse.json(
        { error: "Title, description, and scheduled time are required" },
        { status: 400 }
      );
    }

    // Validate scheduled date is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        title,
        description,
        scheduledAt: scheduledDate,
        duration: duration || 60,
        meetingLink: meetingLink || null,
        price: price || 29,
        maxParticipants: maxParticipants || null,
        isLive: false, // Start as draft
        createdById: admin.id,
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
      class: newClass,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create class" },
      { status: 500 }
    );
  }
}
