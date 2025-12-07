// Enhanced API route for sending bulk emails with attachments
// Accepts FormData with files and JSON metadata
// Uploads files to S3 and sends emails with S3 URLs as attachments

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { sendEmail } from "@/lib/email";
import { uploadToS3, getMimeType } from "@/lib/s3";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth();

    // Parse FormData
    const formData = await request.formData();

    // Extract JSON metadata
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;
    const senderEmail = (formData.get("senderEmail") as string) || "admin@dissthatdsa.dev";
    const recipientEmailsJson = formData.get("recipientEmails") as string;
    const classId = (formData.get("classId") as string) || null;

    // Parse recipient emails
    let recipientEmails: string[] = [];
    try {
      recipientEmails = JSON.parse(recipientEmailsJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid recipient emails format" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!subject || !body) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    if (!recipientEmails || recipientEmails.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient email is required" },
        { status: 400 }
      );
    }

    // Validate sender email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return NextResponse.json(
        { error: "Invalid sender email address" },
        { status: 400 }
      );
    }

    // Create email record in database
    const email = await prisma.email.create({
      data: {
        subject,
        body,
        sentById: admin.id,
        classId,
      },
    });

    // Process and upload attachments
    const attachments: Array<{ filename: string; path: string }> = [];
    const attachmentFiles = formData.getAll("attachments") as File[];

    for (const file of attachmentFiles) {
      try {
        if (file.size > 25 * 1024 * 1024) {
          console.warn(`File ${file.name} exceeds 25MB limit, skipping`);
          continue;
        }

        // Convert File to Buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = getMimeType(file.name);

        // Upload to S3
        const s3Url = await uploadToS3(buffer, file.name, mimeType);

        attachments.push({
          filename: file.name,
          path: s3Url,
        });

        console.log(`Uploaded ${file.name} to S3: ${s3Url}`);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        // Continue with other files
      }
    }

    // Send emails to each recipient
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const recipientEmail of recipientEmails) {
      try {
        // Validate recipient email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
          results.push({
            email: recipientEmail,
            success: false,
            error: "Invalid email address",
          });
          failureCount++;
          continue;
        }

        // Send email with attachments if provided
        const result = await sendEmail({
          to: recipientEmail,
          subject,
          html: body,
          from: senderEmail,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (result.success) {
          successCount++;
          results.push({
            email: recipientEmail,
            success: true,
            messageId: result.messageId,
          });
        } else {
          failureCount++;
          results.push({
            email: recipientEmail,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        failureCount++;
        results.push({
          email: recipientEmail,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update email record with final stats
    await prisma.email.update({
      where: { id: email.id },
      data: {
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      emailId: email.id,
      stats: {
        total: recipientEmails.length,
        sent: successCount,
        failed: failureCount,
        attachments: attachments.length,
      },
      results,
    });
  } catch (error) {
    console.error("Error sending bulk emails:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send emails",
      },
      { status: 500 }
    );
  }
}
