"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useLanguage } from "@/lib/language-context";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const { language } = useLanguage();

  // Redirect logged-in users
  useEffect(() => {
    if (session?.data?.user) router.push("/");
  }, [session, router]);

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If no token/email in query, set an error early
    if (!token || !email) {
      setError(language === "en" ? "Invalid or missing reset link." : "अमान्य या गुम लिंक।");
    }
  }, [token, email, language]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!token || !email) {
      setError(language === "en" ? "Invalid or missing reset link." : "अमान्य या गुम लिंक।");
      return;
    }

    if (!password || password.length < 6) {
      setError(language === "en" ? "Password must be at least 6 characters." : "पासवर्ड कम से कम 6 वर्ण का होना चाहिए।");
      return;
    }

    if (password !== confirm) {
      setError(language === "en" ? "Passwords do not match." : "पासवर्ड मेल नहीं खाते हैं।");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: password }),
      });

      if (res.ok) {
        setSuccessMsg(language === "en" ? "Password reset! Signing you in..." : "पासवर्ड रिसेट हो गया! साइन इन किया जा रहा है...");
        // Optionally auto sign-in using credentials
        try {
          const signin = await signIn("credentials", { redirect: false, email, password });
          // signIn returns an object or undefined; if ok push to home or login
          // If signIn succeeded we navigate to home, otherwise to login
          // If you prefer to force user to login manually, remove this block
          if ((signin as any)?.ok) {
            router.push("/");
          } else {
            router.push("/login");
          }
        } catch (err) {
          console.error("Auto sign-in failed", err);
          router.push("/login");
        }
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || language === "en" ? "Failed to reset password." : "पासवर्ड रिसेट करने में विफल।");
      }
    } catch (err) {
      console.error("Reset request error", err);
      setError(language === "en" ? "Something went wrong. Try again." : "कुछ गलत हुआ। फिर से प्रयास करें।");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upay2Home</h1>
          <p className="text-muted-foreground">
            {language === "en" ? "Reset your password" : "अपना पासवर्ड रीसेट करें"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm text-success">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === "en" ? "New Password" : "नया पासवर्ड"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === "en" ? "At least 6 characters" : "कम से कम 6 वर्ण"}
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {language === "en" ? "Confirm Password" : "पासवर्ड की पुष्टि करें"}
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={language === "en" ? "Confirm your password" : "अपने पासवर्ड की पुष्टि करें"}
              className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading
              ? language === "en"
                ? "Resetting..."
                : "रीसेट कर रहे हैं..."
              : language === "en"
              ? "Reset password"
              : "पासवर्ड रीसेट करें"}
          </button>
        </form>

        {/* <p className="text-center mt-6 text-sm text-muted-foreground">
          {language === "en" ? "Need help? " : "मदद चाहिए? "}
          <button onClick={() => router.push("/contact")} className="text-primary font-medium hover:underline">
            {language === "en" ? "Contact support" : "सहायता से संपर्क करें"}
          </button>
        </p> */}
      </div>
    </div>
  );
}
