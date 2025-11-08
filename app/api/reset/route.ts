// app/api/auth/reset/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth-reset";


export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token || !email || !newPassword) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // basic password policy check
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }

    // Lookup user
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.resetPasswordToken || !user.resetPasswordTokenExpiry) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Verify expiry
    if (user.resetPasswordTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // Compare hashed token
    const hashed = hashToken(token);
    if (hashed !== user.resetPasswordToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    // All good: hash new password and update user record
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    // (Optional) If you use a session invalidation strategy, do it here:
    // - Set `passwordChangedAt: new Date()` or increment a tokenVersion
    // - Then check that value in your `jwt` callback to reject old tokens
    //
    // Example (if your Prisma schema includes `passwordChangedAt`):
    // await db.user.update({
    //   where: { id: user.id },
    //   data: {
    //     password: passwordHash,
    //     resetPasswordToken: null,
    //     resetPasswordTokenExpiry: null,
    //     passwordChangedAt: new Date(),
    //   },
    // });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("reset password route error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
