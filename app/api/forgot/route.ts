// app/api/auth/forgot/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateResetToken } from "@/lib/auth-reset";
import sendResetEmail from "@/lib/send-reset-email";


export async function POST(req: Request) {
  try {
    // Only accept JSON body
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      // Keep generic 200 response for non-disclosure; you can change to 415 if you want strict behaviour
      return NextResponse.json({ ok: true });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    // Generic response to avoid disclosing whether email exists
    const genericResponse = { ok: true };

    if (!email) return NextResponse.json(genericResponse);

    // Find user
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal non-existence; optionally log for monitoring
      console.info("Forgot password requested for unknown email", { email });
      return NextResponse.json(genericResponse);
    }

    // Generate token + hashed token
    const { token, hashedToken } = generateResetToken();
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Persist hashed token and expiry
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordTokenExpiry: expiry,
      },
    });

    // Build absolute reset URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
    // Fallback to originless path if baseUrl missing — still send token but ensure you set NEXTAUTH_URL in env
    const resetUrl =
      baseUrl && !baseUrl.startsWith("http") ? `https://${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}` :
      baseUrl ? `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}&email=${encodeURIComponent(email)}` :
      `/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send the reset email (throws on failure)
    try {
      await sendResetEmail({ to: email, resetUrl, name: user.name ?? undefined });
    } catch (emailErr) {
      // Log email errors but still return generic response to client
      console.error("Failed to send reset email", { email, err: emailErr });
    }

    return NextResponse.json(genericResponse);
  } catch (err) {
    console.error("Forgot password route error", err);
    // keep the generic response (do not leak error details to user)
    return NextResponse.json({ ok: true });
  }
}
