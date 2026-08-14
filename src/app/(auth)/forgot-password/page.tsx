"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthTurnstile } from "@/components/auth/AuthTurnstile";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  return (
    <AuthShell>
      <h1 className="font-sans text-[2.15rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.35rem]">
        Forgot Password
      </h1>
      <p className="mt-2 font-mono text-[12px] leading-5 text-zinc-500">
        Enter your email and we&apos;ll send a reset link
      </p>

      {sent ? (
        <div className="mt-8 space-y-6">
          <p className="rounded-lg border border-white/12 bg-white/[0.03] px-3 py-3 font-mono text-[12px] leading-5 text-zinc-300">
            If an account exists for that email, a reset link is on its way. Check your inbox
            and spam folder.
          </p>
          <Link href="/login" className="auth-submit inline-flex items-center justify-center">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form
          className="mt-8 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);

            const email = (
              event.currentTarget.elements.namedItem("email") as HTMLInputElement
            ).value.trim();

            if (captchaRequired && !captchaToken) {
              setError("Complete the captcha check before continuing.");
              return;
            }

            setPending(true);

            await requestPasswordReset(
              {
                email,
                redirectTo: "/reset-password",
              },
              {
                headers: captchaToken
                  ? {
                      "x-captcha-response": captchaToken,
                    }
                  : undefined,
                onSuccess: () => {
                  setSent(true);
                  setPending(false);
                },
                onError: (ctx) => {
                  setError(ctx.error.message ?? "Could not send reset email.");
                  setPending(false);
                  setCaptchaToken(null);
                },
              },
            );
          }}
        >
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-[11px] text-red-300">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="font-mono text-[12px] font-semibold text-white">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
              placeholder="Enter your email"
              className="auth-input mt-2"
            />
          </label>

          <AuthTurnstile
            onToken={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            onError={() => {
              setCaptchaToken(null);
              setError("Captcha failed to load. Refresh and try again.");
            }}
          />

          <button
            type="submit"
            className="auth-submit mt-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending || (captchaRequired && !captchaToken)}
          >
            {pending ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}

      <p className="mt-7 font-mono text-[12px] text-zinc-500">
        Remembered it?{" "}
        <Link href="/login" className="text-zinc-400 underline underline-offset-2">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
