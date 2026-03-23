# Deploying the Send Email Notification Edge Function

To replace the simulated email notifications with real emails using Resend, follow these exact steps.

### Step 1: Set Your Secrets in Supabase
You need to save your Resend API key and your "From" email securely in your Supabase project's environment variables.
Run this in your terminal:
```bash
supabase secrets set RESEND_API_KEY="re_123456789_your_actual_key"
supabase secrets set RESEND_FROM_EMAIL="onboarding@yourcompany.com"
```
*(If you are on the free tier of Resend, you must verify your domain in Resend, or use `onboarding@resend.dev` to send messages ONLY to your registered email address for testing).*

### Step 2: Deploy the Edge Function
Now, deploy the edge function to your Supabase project:
```bash
supabase functions deploy send-email-notification
```

### Step 3: Integrating it in the Frontend
I have already implemented the Edge function code in `supabase/functions/send-email-notification/index.ts`. Next, we need to connect the frontend so it stops showing the fake "Email Modal" and actually sends an email via this edge function.

Let me alter the application logic to fire the real Resend emails through Supabase.