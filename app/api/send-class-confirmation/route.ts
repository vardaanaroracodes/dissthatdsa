import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, email, classDate, paymentId } = await request.json();

    // Validate required fields
    if (!name || !email || !classDate) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Format the class date for display
    const formattedDate = new Date(classDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `Class Registration Confirmed - Diss That DSA`;

    const emailBody = `
Hi ${name},

Thank you for registering for our DSA class!

Your payment of ₹29 has been received successfully.
Payment ID: ${paymentId}

Class Details:
Date & Time: ${formattedDate}

IMPORTANT: You will receive the class link 15 minutes before the scheduled time.

Please check your email 15 minutes before the class starts.

If you have any questions, feel free to reach out to us.

Best regards,
Team Diss That DSA
    `.trim();

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Diss That DSA <onboarding@resend.dev>",
      to: email,
      subject: subject,
      text: emailBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
          <h2 style="color: #ff0000; border-bottom: 2px solid #ff0000; padding-bottom: 10px;">
            Class Registration Confirmed ✓
          </h2>

          <div style="margin-top: 20px;">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Thank you for registering for our DSA class!</p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #1a1a1a; border-left: 4px solid #00ff00;">
            <p style="margin: 0; color: #00ff00;"><strong>✓ Payment Confirmed</strong></p>
            <p style="margin: 10px 0 0 0;">Amount: <strong>₹29</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #888;">Payment ID: ${paymentId}</p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #1a1a1a; border-left: 4px solid #ff0000;">
            <h3 style="color: #ff0000; margin-top: 0;">Class Details</h3>
            <p><strong>Date & Time:</strong><br>${formattedDate}</p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; color: #000; border-radius: 5px;">
            <p style="margin: 0;"><strong>⚠️ IMPORTANT</strong></p>
            <p style="margin: 10px 0 0 0;">You will receive the class link <strong>15 minutes before</strong> the scheduled time.</p>
            <p style="margin: 10px 0 0 0;">Please check your email before the class starts.</p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #1a1a1a;">
            <p>If you have any questions, feel free to reach out to us.</p>
            <p style="margin-top: 20px;">Best regards,<br><strong style="color: #ff0000;">Team Diss That DSA</strong></p>
          </div>

          <p style="margin-top: 30px; color: #666; font-size: 12px; text-align: center;">
            This is an automated confirmation email from Diss That DSA.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Confirmation email sent successfully", id: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in send-class-confirmation route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
