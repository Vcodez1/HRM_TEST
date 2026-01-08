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
 * Sends an email using either Resend API (if API key is present) or SMTP.
 */
export async function sendEmail(options: EmailOptions, config?: SMTPConfig) {
    const resendKey = process.env.RESEND_API_KEY;
    const useResend = !!resendKey;

    console.log(`[EmailService] Check Resend API Key: ${useResend ? 'Assuming Present' : 'Missing'}`);

    if (useResend) {

        console.log(`[EmailService] Using Resend API to send email to ${options.to}`);
        return sendWithResend(options, resendKey!);
    }

    if (!config) {
        throw new Error("SMTP configuration is required when RESEND_API_KEY is not set.");
    }

    console.log(`[EmailService] Using SMTP to send email to ${options.to}`);
    return sendWithSMTP(options, config);
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
