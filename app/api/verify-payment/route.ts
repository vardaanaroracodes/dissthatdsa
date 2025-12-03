// API route for verifying Razorpay payment signatures
// Updates registration status and triggers confirmation email

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendClassConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    // Verify Razorpay signature for security
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Find and update registration status
    const registration = await prisma.registration.findUnique({
      where: { orderId: razorpay_order_id },
      include: { class: true },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    // Update payment status to completed
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        paymentId: razorpay_payment_id,
        paymentStatus: 'COMPLETED',
      },
    });

    // Send confirmation email asynchronously
    try {
      await sendClassConfirmationEmail(registration.id);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the payment verification if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        className: registration.class.title,
        classDate: registration.class.scheduledAt,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
