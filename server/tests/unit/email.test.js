import { describe, it, expect, vi } from 'vitest';
import nodemailer from 'nodemailer';

import { sendPasswordResetEmail, sendVerificationEmail } from '../../src/utils/email.js';

describe('email utility', () => {
  describe('sendPasswordResetEmail', () => {
    it('sends an email with the correct recipient and token', async () => {
      // Mock the transporter
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-123' });
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      try {
        const to = 'user@example.com';
        const token = 'abc123token';

        await sendPasswordResetEmail(to, token);

        expect(createTransportMock).toHaveBeenCalled();
        expect(sendMailMock).toHaveBeenCalled();

        const mailOptions = sendMailMock.mock.calls[0][0];
        expect(mailOptions.to).toBe(to);
        expect(mailOptions.subject).toContain('Password Reset');
        expect(mailOptions.text).toContain(token);
        expect(mailOptions.html).toContain(token);
      } finally {
        createTransportMock.mockRestore();
      }
    });

    it('includes the reset URL in the email', async () => {
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-456' });
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      try {
        const to = 'user@example.com';
        const token = 'reset-token-xyz';

        await sendPasswordResetEmail(to, token);

        const mailOptions = sendMailMock.mock.calls[0][0];
        expect(mailOptions.text).toContain('reset-password');
        expect(mailOptions.html).toContain('reset-password');
      } finally {
        createTransportMock.mockRestore();
      }
    });

    it('handles SMTP errors gracefully', async () => {
      const sendMailMock = vi.fn().mockRejectedValue(new Error('SMTP connection failed'));
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      try {
        await expect(
          sendPasswordResetEmail('user@example.com', 'token123'),
        ).rejects.toThrow('SMTP connection failed');
      } finally {
        createTransportMock.mockRestore();
      }
    });

    it('uses JSON transport when SMTP_HOST is not set', async () => {
      // In the test environment, SMTP_HOST is not set, so JSON transport is used.
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'json-transport' });
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      try {
        await sendPasswordResetEmail('user@example.com', 'token123');

        // Verify jsonTransport was used (no host/port config).
        const transportConfig = createTransportMock.mock.calls[0][0];
        expect(transportConfig.jsonTransport).toBe(true);
      } finally {
        createTransportMock.mockRestore();
      }
    });

    it('does not log the token', async () => {
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'test-789' });
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const token = 'super-secret-token-123';
        await sendPasswordResetEmail('user@example.com', token);

        const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls]
          .map((args) => args.map(String).join(' '))
          .join('\n');

        expect(logged).not.toContain(token);
      } finally {
        createTransportMock.mockRestore();
        logSpy.mockRestore();
        errorSpy.mockRestore();
      }
    });
  });

  describe('sendVerificationEmail', () => {
    it('sends an email with the correct recipient and token', async () => {
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'verify-123' });
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      try {
        const to = 'user@example.com';
        const token = 'verify-token-abc';

        await sendVerificationEmail(to, token);

        expect(createTransportMock).toHaveBeenCalled();
        expect(sendMailMock).toHaveBeenCalled();

        const mailOptions = sendMailMock.mock.calls[0][0];
        expect(mailOptions.to).toBe(to);
        expect(mailOptions.subject).toContain('Verify');
        expect(mailOptions.text).toContain(token);
        expect(mailOptions.html).toContain(token);
      } finally {
        createTransportMock.mockRestore();
      }
    });

    it('includes the verification URL in the email', async () => {
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'verify-456' });
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      try {
        const to = 'user@example.com';
        const token = 'verify-token-xyz';

        await sendVerificationEmail(to, token);

        const mailOptions = sendMailMock.mock.calls[0][0];
        expect(mailOptions.text).toContain('verify-email');
        expect(mailOptions.html).toContain('verify-email');
      } finally {
        createTransportMock.mockRestore();
      }
    });

    it('handles SMTP errors gracefully', async () => {
      const sendMailMock = vi.fn().mockRejectedValue(new Error('SMTP connection failed'));
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      try {
        await expect(
          sendVerificationEmail('user@example.com', 'token123'),
        ).rejects.toThrow('SMTP connection failed');
      } finally {
        createTransportMock.mockRestore();
      }
    });

    it('does not log the token', async () => {
      const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'verify-789' });
      const createTransportMock = vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
        sendMail: sendMailMock,
      });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const token = 'super-secret-verify-token';
        await sendVerificationEmail('user@example.com', token);

        const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls]
          .map((args) => args.map(String).join(' '))
          .join('\n');

        expect(logged).not.toContain(token);
      } finally {
        createTransportMock.mockRestore();
        logSpy.mockRestore();
        errorSpy.mockRestore();
      }
    });
  });
});
