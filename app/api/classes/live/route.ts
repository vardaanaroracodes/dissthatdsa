// Public API route for fetching live classes
// Returns only published classes that are available for registration

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch only live classes that haven't happened yet
    const classes = await prisma.class.findMany({
      where: {
        isLive: true,
        scheduledAt: {
          gt: new Date(), // Future classes only
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        scheduledAt: true,
        duration: true,
        price: true,
        maxParticipants: true,
        _count: {
          select: {
            registrations: {
              where: {
                paymentStatus: 'COMPLETED',
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    // Add available spots calculation
    const classesWithAvailability = classes.map((c: any) => ({
      ...c,
      registrationCount: c._count.registrations,
      availableSpots: c.maxParticipants ? c.maxParticipants - c._count.registrations : null,
      isFull: c.maxParticipants ? c._count.registrations >= c.maxParticipants : false,
    }));

    return NextResponse.json({ classes: classesWithAvailability });
  } catch (error) {
    console.error("Error fetching live classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
