import nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
}

export interface SMTPConfig {
    smtpServer: string;
    smtpPort: number;
    smtpEmail: string;
    appPassword: string;
}

/**
 * Sends an email using SMTP (priority) or Resend API (fallback).
 * SMTP is preferred because emails will come from the user's configured email address.
 * Resend is only used as fallback when no SMTP config is available.
 */
export async function sendEmail(options: EmailOptions, config?: SMTPConfig) {
    const resendKey = process.env.RESEND_API_KEY;

    // PRIORITY: Use SMTP if config is provided (emails come from user's email)
    if (config && config.smtpEmail && config.appPassword) {
        console.log(`[EmailService] Using SMTP to send email to ${options.to} (From: ${config.smtpEmail})`);
        return sendWithSMTP(options, config);
    }

    // FALLBACK: Use Resend API if available (emails come from onboarding@resend.dev)
    if (resendKey) {
        console.log(`[EmailService] Using Resend API to send email to ${options.to} (SMTP not configured)`);
        return sendWithResend(options, resendKey);
    }

    throw new Error("Email configuration is required. Please configure SMTP settings or set RESEND_API_KEY.");
}

async function sendWithResend(options: EmailOptions, apiKey: string) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            from: options.from || process.env.FROM_EMAIL || 'onboarding@resend.dev',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    return await response.json();
}

async function sendWithSMTP(options: EmailOptions, config: SMTPConfig) {
    const transporter = nodemailer.createTransport({
        host: config.smtpServer,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
            user: config.smtpEmail,
            pass: config.appPassword,
        },
        tls: {
            // Don't fail on invalid certs
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
    });

    const mailOptions = {
        from: options.from || `"${process.env.APP_NAME || 'HRM Portal'}" <${config.smtpEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };

    return await transporter.sendMail(mailOptions);
}
