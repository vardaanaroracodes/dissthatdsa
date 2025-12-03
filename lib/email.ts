// Email service using Resend for sending transactional emails
// Handles class confirmations, reminders, and admin-triggered campaigns

import { Resend } from 'resend'
import { prisma } from './prisma'
import { EmailStatus } from '@prisma/client'

const resend = new Resend(process.env.RESEND_API_KEY!)

interface SendEmailParams {
  to: string
  subject: string
  html: string
  registrationId?: string
  emailId?: string
}

// Send a single email with tracking
export async function sendEmail({ to, subject, html, registrationId, emailId }: SendEmailParams) {
  try {
    const result = await resend.emails.send({
      from: 'Class Notifications <noreply@yourdomain.com>', // Update with your verified domain
      to,
      subject,
      html,
    })

    // Track email in database if emailId and registrationId provided
    if (emailId && registrationId) {
      await prisma.emailRecipient.update({
        where: {
          emailId_registrationId: {
            emailId,
            registrationId,
          },
        },
        data: {
          status: EmailStatus.SENT,
          sentAt: new Date(),
        },
      })
    }

    return { success: true, messageId: result.data?.id }
  } catch (error) {
    console.error('Email send error:', error)

    // Track failure in database
    if (emailId && registrationId) {
      await prisma.emailRecipient.update({
        where: {
          emailId_registrationId: {
            emailId,
            registrationId,
          },
        },
        data: {
          status: EmailStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    }

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Send confirmation email after successful payment
export async function sendClassConfirmationEmail(registrationId: string) {
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      class: true,
    },
  })

  if (!registration) {
    throw new Error('Registration not found')
  }

  const classDate = new Date(registration.class.scheduledAt).toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Class Registration Confirmed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Registration Confirmed!</h1>
        </div>

        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${registration.name},</p>

          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for registering for <strong>${registration.class.title}</strong>!
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 25px 0;">
            <h2 style="margin-top: 0; color: #dc2626; font-size: 20px;">Class Details</h2>
            <p style="margin: 10px 0;"><strong>Title:</strong> ${registration.class.title}</p>
            <p style="margin: 10px 0;"><strong>Date & Time:</strong> ${classDate}</p>
            <p style="margin: 10px 0;"><strong>Duration:</strong> ${registration.class.duration} minutes</p>
            <p style="margin: 10px 0;"><strong>Amount Paid:</strong> ₹${registration.amount}</p>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Important:</strong> You will receive the class link via email 15 minutes before the scheduled time.
            </p>
          </div>

          <p style="font-size: 16px; margin-top: 25px;">
            If you have any questions, please don't hesitate to reach out to us.
          </p>

          <p style="font-size: 16px; margin-top: 25px;">
            Best regards,<br>
            <strong>The Diss That DSA Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: registration.email,
    subject: `Registration Confirmed - ${registration.class.title}`,
    html,
  })
}

// Send class reminder with meeting link
export async function sendClassReminderEmail(classId: string) {
  const classData = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      registrations: {
        where: {
          paymentStatus: 'COMPLETED',
        },
      },
    },
  })

  if (!classData) {
    throw new Error('Class not found')
  }

  const classDate = new Date(classData.scheduledAt).toLocaleString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })

  // Send to all registered users
  const sendPromises = classData.registrations.map(async (registration) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Class Starting Soon!</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🎓 Class Starting in 15 Minutes!</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${registration.name},</p>

            <p style="font-size: 16px; margin-bottom: 20px;">
              Your class <strong>${classData.title}</strong> is starting soon!
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <p style="margin: 10px 0; font-size: 14px; color: #6b7280;">Class Time</p>
              <p style="margin: 10px 0; font-size: 20px; font-weight: bold; color: #dc2626;">${classDate}</p>
            </div>

            ${
              classData.meetingLink
                ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${classData.meetingLink}"
                 style="display: inline-block; background: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
                Join Class Now
              </a>
            </div>

            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 15px;">
              Or copy this link: <br>
              <a href="${classData.meetingLink}" style="color: #dc2626; word-break: break-all;">${classData.meetingLink}</a>
            </p>
            `
                : `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 25px 0;">
              <p style="margin: 0; color: #92400e;">
                The meeting link will be shared shortly. Please keep an eye on your email.
              </p>
            </div>
            `
            }

            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 25px 0;">
              <p style="margin: 0; color: #1e40af;">
                <strong>💡 Tip:</strong> Make sure you have a stable internet connection and join a few minutes early!
              </p>
            </div>

            <p style="font-size: 16px; margin-top: 25px;">
              See you in class!<br>
              <strong>The Diss That DSA Team</strong>
            </p>
          </div>
        </body>
      </html>
    `

    return sendEmail({
      to: registration.email,
      subject: `🚀 Starting Soon: ${classData.title}`,
      html,
    })
  })

  await Promise.all(sendPromises)

  // Update reminder schedule
  await prisma.reminderSchedule.upsert({
    where: { classId },
    create: {
      classId,
      status: 'SENT',
      reminderSentAt: new Date(),
    },
    update: {
      status: 'SENT',
      reminderSentAt: new Date(),
    },
  })

  return { success: true, count: classData.registrations.length }
}

// Send custom email campaign from admin
export async function sendBulkEmail(
  emailId: string,
  recipientIds: string[],
  subject: string,
  html: string
) {
  const results = []

  for (const registrationId of recipientIds) {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    })

    if (!registration) {
      results.push({ registrationId, success: false, error: 'Registration not found' })
      continue
    }

    const result = await sendEmail({
      to: registration.email,
      subject,
      html,
      registrationId,
      emailId,
    })

    results.push({ registrationId, ...result })
  }

  return results
}
