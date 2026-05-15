const config = require('../config/env');
const logger = require('../config/logger');

// Base email sender using Brevo API
const sendEmail = async ({ to, subject, html }) => {
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': config.email.apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: { email: config.email.from, name: 'AuthVault' },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send email via Brevo');
        }

        logger.info(`Email sent to ${to}: ${data.messageId || 'Success'}`);
        return data;
    } catch (error) {
        logger.error(`Email failed to ${to}: ${error.message}`);
        throw error;
    }
};

// ─── Email Templates ───────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0f0f1a; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 40px auto; }
    .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 16px;
            overflow: hidden; }
    .header { background: linear-gradient(135deg, #7c3aed, #4f46e5);
              padding: 40px 32px; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .header p  { color: rgba(255,255,255,0.8); margin-top: 6px; font-size: 14px; }
    .body { padding: 40px 32px; }
    .body p { color: #cbd5e1; line-height: 1.7; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 14px 32px;
           background: linear-gradient(135deg, #7c3aed, #4f46e5);
           color: #fff !important; text-decoration: none; border-radius: 10px;
           font-weight: 600; font-size: 15px; margin: 24px 0;
           transition: opacity 0.2s; }
    .footer { padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.08);
              text-align: center; }
    .footer p { color: #64748b; font-size: 12px; line-height: 1.6; }
    .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 24px 0; }
    .highlight { color: #a78bfa; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>🔐 AuthVault</h1>
        <p>Secure Identity Management</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>This email was sent by AuthVault. If you didn't request this, you can safely ignore it.</p>
        <p style="margin-top:8px;">© ${new Date().getFullYear()} AuthVault. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

// Send email verification link
const sendVerificationEmail = async (email, name, token) => {
    const verifyUrl = `${config.clientUrl}/verify-email?token=${token}`;

    // Always log to terminal for easy debugging on Render/Local
    logger.info(`📧 Verification Link for ${email}: ${verifyUrl}`);

    await sendEmail({
        to: email,
        subject: 'Verify your AuthVault account',
        html: baseTemplate(`
      <p>Hi <span class="highlight">${name}</span>,</p>
      <p>Welcome to AuthVault! Please verify your email address to activate your account.</p>
      <p>Click the button below — this link expires in <strong>24 hours</strong>.</p>
      <div style="text-align:center;">
        <a href="${verifyUrl}" class="btn">Verify Email Address</a>
      </div>
      <div class="divider"></div>
      <p>Or copy this link into your browser:</p>
      <p style="word-break:break-all; color:#a78bfa; font-size:13px;">${verifyUrl}</p>
    `),
    });
};

// Send password reset link
const sendPasswordResetEmail = async (email, name, token) => {
    const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

    // Always log to terminal for easy debugging on Render/Local
    logger.info(`🔑 Password Reset Link for ${email}: ${resetUrl}`);

    await sendEmail({
        to: email,
        subject: 'Reset your AuthVault password',
        html: baseTemplate(`
      <p>Hi <span class="highlight">${name}</span>,</p>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <p>This link is valid for <strong>1 hour</strong>.</p>
      <div style="text-align:center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <div class="divider"></div>
      <p style="color:#f87171; font-size:13px;"> If you didn't request this, please ignore this email — your password will remain unchanged.</p>
    `),
    });
};

// Send welcome email after verification
const sendWelcomeEmail = async (email, name) => {
    await sendEmail({
        to: email,
        subject: 'Welcome to AuthVault!',
        html: baseTemplate(`
      <p>Hi <span class="highlight">${name}</span>,</p>
      <p>Your account has been successfully verified. You're all set to explore AuthVault!</p>
      <div style="text-align:center;">
        <a href="${config.clientUrl}/login" class="btn">Go to Dashboard</a>
      </div>
    `),
    });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendWelcomeEmail,
};
