# Razorpay Payment Gateway Setup Guide

This guide will help you set up the Razorpay payment gateway for class registrations.

## Features Implemented

1. **Payment Gateway Integration** - Razorpay payment processing for ₹29 class registration
2. **Class Registration System** - Users can signup and select class dates
3. **Email Notifications** - Automated confirmation emails via Resend
4. **Success Popup** - Beautiful modal showing registration confirmation
5. **Payment Verification** - Secure signature verification for payments

## Setup Instructions

### 1. Get Razorpay API Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up or log in to your account
3. Navigate to **Settings** → **API Keys**
4. Click on **Generate Keys** (use Test mode for development)
5. Copy the **Key ID** and **Key Secret**

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here

# Resend Configuration (already set up)
RESEND_API_KEY=re_xxxxxxxxxx

# Email Configuration
RECIPIENT_EMAIL=admin@yourdomain.com

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Test the Payment System

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/class-signup`

3. Fill in the form with test details

4. Use Razorpay test card details:
   - **Card Number**: 4111 1111 1111 1111
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **Name**: Any name

### 4. Verify Test Payment

After successful payment:
- ✅ Success modal appears with registration details
- ✅ Confirmation email sent to user
- ✅ Email mentions class link will be sent 15 minutes before class

## File Structure

```
app/
├── api/
│   ├── create-order/route.ts       # Creates Razorpay order
│   ├── verify-payment/route.ts     # Verifies payment signature
│   └── send-class-confirmation/route.ts  # Sends confirmation email
├── class-signup/page.tsx           # Registration form with payment
components/
├── SuccessModal.tsx                # Success popup component
lib/
├── db.ts                           # Database operations (in-memory)
```

## Going Live

### 1. Switch to Live Mode in Razorpay

1. Go to Razorpay Dashboard
2. Switch from **Test Mode** to **Live Mode** (top-left toggle)
3. Complete KYC verification if required
4. Generate new Live API keys
5. Update your production `.env` with live keys

### 2. Database Consideration

The current setup uses an **in-memory database** (`lib/db.ts`). For production:

**Option A: Use a Database Service**
- PostgreSQL with Prisma
- MongoDB with Mongoose
- Supabase
- PlanetScale

**Option B: Quick Firebase Setup**
```bash
npm install firebase
```

Update `lib/db.ts` to use Firebase Firestore instead of in-memory Map.

### 3. Production Checklist

- [ ] Switch Razorpay to Live mode
- [ ] Update environment variables with live keys
- [ ] Set up proper database (replace in-memory storage)
- [ ] Configure custom domain for Resend emails
- [ ] Test payment flow thoroughly
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure webhook for payment notifications (optional)

## Email Configuration

The system sends two types of notifications:

1. **Immediate Confirmation** - Sent right after successful payment
   - Payment confirmation
   - Class date & time
   - Important notice about receiving link 15 min before class

2. **Pre-Class Link** (Manual/Scheduled)
   - You need to set up a scheduled system to send class links 15 minutes before
   - Consider using cron jobs, Vercel Cron, or background jobs

### Setting up Pre-Class Email Automation

You can use:
- **Vercel Cron** - For scheduled tasks
- **Node-cron** - For running cron jobs
- **External services** - Zapier, Make.com

Example cron job endpoint at `app/api/cron/send-class-links/route.ts`:

```typescript
// This would check for classes starting in 15 minutes
// and send the meeting link to registered users
export async function GET() {
  // Verify cron secret for security
  // Check database for upcoming classes
  // Send emails with meeting links
}
```

## Adding the Signup Link to Your Site

Add a link/button to your homepage or navigation:

```tsx
<Link href="/class-signup">
  <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg">
    Register for Class - ₹29
  </button>
</Link>
```

## Troubleshooting

### Payment Failed
- Check if Razorpay API keys are correct
- Verify test card details
- Check browser console for errors

### Email Not Sent
- Verify Resend API key
- Check sender email is verified in Resend
- Look at server logs for errors

### Success Modal Not Showing
- Check browser console for JavaScript errors
- Verify payment verification API is working
- Check network tab for API responses

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Use environment variables** for all sensitive keys
3. **Verify payment signatures** on server-side (already implemented)
4. **Use HTTPS** in production
5. **Implement rate limiting** for API endpoints

## Support

For Razorpay issues:
- Documentation: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

For Resend issues:
- Documentation: https://resend.com/docs
- Support: support@resend.com

## Next Steps

1. Set up your environment variables
2. Test the payment flow in test mode
3. Customize the email templates if needed
4. Set up proper database for production
5. Configure pre-class email automation
6. Go live!
