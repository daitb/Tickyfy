# Payment Setup Guide

## Overview
This guide explains how to configure payment webhooks and return URLs for both local development and production environments.

## Problem
Payment gateways (VNPay/MoMo) cannot reach `localhost` URLs. They need publicly accessible URLs to send webhook notifications.

## Solution

### For Local Development

#### Option 1: Use ngrok (Recommended for Testing)
1. Install ngrok: https://ngrok.com/download
2. Start your backend server on `localhost:5179`
3. In a new terminal, run:
   ```bash
   ngrok http 5179
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update `appsettings.json`:
   ```json
   "VNPay": {
     "IpnUrl": "https://abc123.ngrok.io/api/payment/webhook/vnpay"
   },
   "MomoAPI": {
     "NotifyUrl": "https://abc123.ngrok.io/api/payment/webhook/momo"
   }
   ```
6. Restart your backend server

**Note:** The ngrok URL changes each time you restart ngrok (unless you have a paid plan with a static domain).

#### Option 2: Use Return URL Verification (Current Implementation)
The system now supports verifying payments directly from return URL parameters, which works even without webhooks. This is the default behavior and works for localhost development.

### For Production

1. Deploy your backend to a public server (Azure, AWS, etc.)
2. Update `appsettings.Production.json`:
   ```json
   {
     "Payments": {
       "ReturnUrl": "https://yourdomain.com/payment/return"
     },
     "VNPay": {
       "IpnUrl": "https://api.yourdomain.com/api/payment/webhook/vnpay"
     },
     "MomoAPI": {
       "ReturnUrl": "https://yourdomain.com/payment/return",
       "NotifyUrl": "https://api.yourdomain.com/api/payment/webhook/momo"
     }
   }
   ```

3. Ensure your production server:
   - Has a valid SSL certificate (HTTPS)
   - Is publicly accessible
   - Has the webhook endpoints properly configured

## How It Works

### Payment Flow
1. **User initiates payment** → Frontend calls `/api/payment/create-intent`
2. **Backend creates payment** → Payment record created with `Pending` status
3. **User redirected** → To payment gateway (VNPay/MoMo)
4. **User completes payment** → Payment gateway processes payment
5. **User redirected back** → To `/payment/return` with payment parameters
6. **Frontend verifies** → Calls `/api/payment/{id}/verify-return-url` with return URL parameters
7. **Backend processes** → Updates payment status, confirms booking, creates tickets
8. **Webhook (optional)** → Payment gateway also sends webhook (if configured)

### Verification Methods

#### Method 1: Return URL Verification (Primary)
- **Endpoint:** `POST /api/payment/{id}/verify-return-url`
- **When:** Immediately when user returns from payment gateway
- **How:** Processes return URL parameters directly
- **Advantage:** Works even without webhooks (perfect for localhost)

#### Method 2: Standard Verification (Fallback)
- **Endpoint:** `POST /api/payment/{id}/verify`
- **When:** Checks database status
- **How:** Verifies if payment status is already `Completed`
- **Advantage:** Works if webhook already processed payment

#### Method 3: Webhook (Background)
- **Endpoint:** `POST/GET /api/payment/webhook/{provider}`
- **When:** Payment gateway sends notification
- **How:** Processes webhook payload
- **Advantage:** Automatic, doesn't require user interaction

## Current Configuration

### Development (appsettings.json)
- **Return URLs:** `http://localhost:3000/payment/return`
- **Webhook URLs:** `http://localhost:5179/api/payment/webhook/{provider}`
- **Note:** Webhooks won't work with localhost, but return URL verification will

### Production (appsettings.Production.json)
- Update with your production domain
- Ensure HTTPS is enabled
- Configure webhook URLs in payment gateway dashboards

## Testing

1. **Test Return URL Verification:**
   - Complete a payment
   - Check browser console for verification logs
   - Payment should be verified immediately from return URL

2. **Test Webhook (if using ngrok):**
   - Check backend console for webhook logs
   - Payment should also be processed via webhook

3. **Check Database:**
   - Payment status should be `Completed`
   - Booking status should be `Confirmed`
   - Tickets should be created

## Troubleshooting

### Payment stuck in "Pending" status
- Check if return URL verification is working (check browser console)
- Verify payment gateway returned success codes
- Check backend logs for errors

### Webhook not received
- Verify webhook URL is publicly accessible
- Check payment gateway dashboard for webhook logs
- Return URL verification should still work as fallback

### Payment verified but tickets not created
- Check backend logs for ticket creation errors
- Verify booking status is `Confirmed`
- Check database for ticket records

