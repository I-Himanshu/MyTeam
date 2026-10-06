import nodemailer from 'nodemailer';

import config from '../config/index.js';

/**
 * Create a nodemailer transporter from environment configuration.
 *
 * SMTP settings are read from environment variables (documented in
 * `.env.example`). When `SMTP_HOST` is not set, a JSON transport is used
 * instead — this allows tests and development to inspect emails without a
 * real SMTP server.
 *
 * @returns {import('nodemailer').Transporter} Configured transporter.
 */
function createTransporter() {
  const { smtpHost, smtpPort, smtpUser, smtpPass } = config;

  if (!smtpHost) {
    // JSON transport: serializes the message instead of sending it.
    // Useful for tests and local development without an SMTP server.
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  });
}

/**
 * Send a password reset email to the user.
 *
 * The email contains a link with the reset token. The token is never logged
 * or stored in plaintext — only its SHA-256 hash is persisted in the database.
 *
 * @param {string} to Recipient email address.
 * @param {string} token Plaintext reset token (hashed before storage).
 * @returns {Promise<import('nodemailer').SentMessageInfo>} Send result.
 */
export async function sendPasswordResetEmail(to, token) {
  const { smtpFrom } = config;
  const transporter = createTransporter();
  const resetUrl = `${config.clientUrl}/reset-password?token=${token}`;

  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Use this token: ${token}\n\n` +
      `Or visit: ${resetUrl}\n\n` +
      `This token expires in 1 hour. If you did not request this, ignore this email.`,
    html: `
      <p>You requested a password reset.</p>
      <p>Use this token: <code>${token}</code></p>
      <p>Or visit: <a href="${resetUrl}">${resetUrl}</a></p>
      <p>This token expires in 1 hour. If you did not request this, ignore this email.</p>
    `,
  });

  return info;
}

export default { sendPasswordResetEmail };
