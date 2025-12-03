// API route for sending bulk email campaigns
// Allows admins to compose and send emails to selected registrants

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { sendBulkEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();

    const {
      subject,
      body,
      recipientIds,
      classId,
    } = await request.json();

    // Validate required fields
    if (!subject || !body || !recipientIds || recipientIds.length === 0) {
      return NextResponse.json(
        { error: "Subject, body, and at least one recipient are required" },
        { status: 400 }
      );
    }

    // Create email record
    const email = await prisma.email.create({
      data: {
        subject,
        body,
        sentById: admin.id,
        classId: classId || null,
      },
    });

    // Create email recipient records
    await prisma.emailRecipient.createMany({
      data: recipientIds.map((registrationId: string) => ({
        emailId: email.id,
        registrationId,
        status: 'PENDING',
      })),
    });

    // Send emails asynchronously
    const results = await sendBulkEmail(
      email.id,
      recipientIds,
      subject,
      body
    );

    // Calculate success rate
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      emailId: email.id,
      stats: {
        total: recipientIds.length,
        sent: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send emails" },
      { status: 500 }
    );
  }
}
