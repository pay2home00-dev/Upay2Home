// lib/send-reset-email.ts
import nodemailer from "nodemailer";

/**
 * 🔐 Create a reusable transporter using Gmail App Password.
 * Make sure you have:
 * - EMAIL_USER="you@gmail.com"
 * - EMAIL_PASS="your_app_password"
 * - EMAIL_FROM="Upay2Home <you@gmail.com>"
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 📧 Send password reset email via Gmail.
 * Uses a simple, branded HTML template.
 */
export default async function sendResetEmail({
  to,
  resetUrl,
  name,
}: {
  to: string;
  resetUrl: string;
  name?: string | null;
}) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!from) throw new Error("EMAIL_FROM not set in environment");

  const subject = "Reset your password";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 10px; border: 1px solid #e5e7eb;">
      <h2 style="color: #111827;">Hello${name ? `, ${name}` : ""} 👋</h2>
      <p style="color: #374151; line-height: 1.6;">
        You recently requested to reset your password for your <b>Upay2Home</b> account.
      </p>
      <p style="color: #374151; line-height: 1.6;">Click the button below to set a new password:</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" target="_blank" rel="noopener noreferrer"
          style="background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Reset Password
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
        This link will expire in <b>1 hour</b>. If you didn’t request a password reset, you can safely ignore this email — your password will remain unchanged.
      </p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        This email was sent automatically by Upay2Home. Please do not reply.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log("✅ Password reset email sent successfully:", {
      to,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error("❌ Failed to send reset email:", err?.message || err);
    throw new Error("Failed to send reset email");
  }
}
