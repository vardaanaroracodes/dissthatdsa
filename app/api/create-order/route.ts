// API route for creating Razorpay payment orders
// Validates user data and creates a pending registration in the database

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, classId } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !classId) {
      return NextResponse.json(
        { error: "All fields are required" },
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

    // Validate phone format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number. Please enter 10 digits." },
        { status: 400 }
      );
    }

    // Check if class exists and is live
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    if (!classData.isLive) {
      return NextResponse.json(
        { error: "Class is not available for registration" },
        { status: 400 }
      );
    }

    // Check if class is already full (if max participants set)
    if (classData.maxParticipants) {
      const registrationCount = await prisma.registration.count({
        where: {
          classId,
          paymentStatus: 'COMPLETED',
        },
      });

      if (registrationCount >= classData.maxParticipants) {
        return NextResponse.json(
          { error: "Class is full" },
          { status: 400 }
        );
      }
    }

    const amount = classData.price;
    const currency = "INR";

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        name,
        email,
        phone,
        classId,
      },
    });

    // Store registration in database with pending status
    await prisma.registration.create({
      data: {
        name,
        email,
        phone,
        orderId: order.id,
        amount,
        paymentStatus: 'PENDING',
        classId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
