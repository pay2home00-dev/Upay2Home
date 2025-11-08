"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/lib/language-context";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const session = useSession();
  const { language } = useLanguage();

  // Redirect logged-in users
  useEffect(() => {
    if (session?.data?.user) router.push("/");
  }, [session, router]);

  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError(language === "en" ? "Please enter a valid email." : "कृपया एक वैध ईमेल दर्ज करें।");
      return;
    }

    setIsLoading(true);

    try {
      // Always show generic success to avoid disclosing account existence
      await fetch("/api/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setIsSent(true);
    } catch (err) {
      console.error("Forgot password error", err);
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
            {language === "en" ? "Forgot password" : "पासवर्ड भूल गए"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Sent message */}
        {isSent ? (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground">
              {language === "en"
                ? "If an account with that email exists, you’ll receive a reset link shortly."
                : "यदि उस ईमेल वाला कोई खाता मौजूद है, तो आपको शीघ्र ही एक रीसेट लिंक प्राप्त होगा।"}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => router.push("/login")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                {language === "en" ? "Back to sign in" : "साइन इन पर वापस जाएँ"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {language === "en" ? "Email" : "ईमेल"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === "en" ? "Enter your email" : "अपना ईमेल दर्ज करें"}
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
                  ? "Sending..."
                  : "भेज रहे हैं..."
                : language === "en"
                ? "Send reset link"
                : "रीसेट लिंक भेजें"}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-muted-foreground">
          {language === "en" ? "Remembered your password? " : "पासवर्ड याद आ गया? "}
          <button
            onClick={() => router.push("/login")}
            className="text-primary font-medium hover:underline"
          >
            {language === "en" ? "Sign in" : "साइन इन करें"}
          </button>
        </p>
      </div>
    </div>
  );
}
