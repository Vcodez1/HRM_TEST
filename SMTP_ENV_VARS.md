# SMTP Environment Variables Setup Guide

## For Render Deployment

If you're deploying to Render or any cloud platform, you can configure SMTP using environment variables instead of (or in addition to) the database configuration.

### Required Environment Variables

Set these in your Render dashboard (Service → Environment → Variables):

```bash
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

### How It Works

The application will check for SMTP configuration in this order:

1. **Database configuration** (saved via `/email-settings` page)
2. **Environment variables** (fallback if database config is missing)

This ensures:
- ✅ Works on Render even before UI configuration
- ✅ Works in local development
- ✅ Secure credential storage in production
- ✅ No hardcoded credentials in code

### For Gmail Users

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (remove spaces)
3. **Use the App Password** (not your regular Gmail password)

### Testing

After setting environment variables on Render:

1. Deploy your application
2. Go to `/test-email`
3. Enter a test email address
4. Click "Send Test Email"
5. Should work without needing to configure via UI first!

### Local Development

Create a `.env` file in your project root (this file is gitignored):

```bash
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

The application will automatically load these using `dotenv`.

### Priority

If BOTH database config AND environment variables are set:
- **Database config takes priority**
- Environment variables are used as fallback only

This allows you to:
- Set global defaults via environment variables
- Override per-environment via UI configuration
