// Cron job endpoint for sending automated class reminders
// Should be called 15 minutes before each class starts
// Can be triggered by external cron service like Vercel Cron or cron-job.org

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendClassReminderEmail } from "@/lib/email";

// Verify request is from authorized source (simple secret token)
function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET || "your-secret-token";

  if (authHeader !== `Bearer ${expectedToken}`) {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  // Verify authorization
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find classes starting in the next 15-20 minutes that haven't sent reminders
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60 * 1000);

    const upcomingClasses = await prisma.class.findMany({
      where: {
        isLive: true,
        scheduledAt: {
          gte: fifteenMinutesFromNow,
          lte: twentyMinutesFromNow,
        },
      },
      include: {
        registrations: {
          where: {
            paymentStatus: 'COMPLETED',
          },
        },
      },
    });

    const results = [];

    for (const classItem of upcomingClasses) {
      // Check if reminder already sent
      const existingReminder = await prisma.reminderSchedule.findUnique({
        where: { classId: classItem.id },
      });

      if (existingReminder && existingReminder.status === 'SENT') {
        continue; // Already sent
      }

      // Send reminder emails
      try {
        const result = await sendClassReminderEmail(classItem.id);
        results.push({
          classId: classItem.id,
          className: classItem.title,
          success: true,
          recipientCount: result.count,
        });
      } catch (error) {
        results.push({
          classId: classItem.id,
          className: classItem.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Mark as failed
        await prisma.reminderSchedule.upsert({
          where: { classId: classItem.id },
          create: {
            classId: classItem.id,
            status: 'FAILED',
          },
          update: {
            status: 'FAILED',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${upcomingClasses.length} upcoming classes`,
      results,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
