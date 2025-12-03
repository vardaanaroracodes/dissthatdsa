import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    // Verify signature
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

    // Update registration status
    const registration = await db.getRegistrationByOrderId(razorpay_order_id);
    if (!registration) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    await db.updateRegistration(registration.id, {
      paymentId: razorpay_payment_id,
      status: "completed",
    });

    // Trigger email sending
    const emailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-class-confirmation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registration.name,
          email: registration.email,
          classDate: registration.classDate,
          paymentId: razorpay_payment_id,
        }),
      }
    );

    if (!emailResponse.ok) {
      console.error("Failed to send confirmation email");
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      registration: {
        name: registration.name,
        email: registration.email,
        classDate: registration.classDate,
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
