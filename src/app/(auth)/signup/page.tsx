"use client";

import Link from "next/link";
import { useState } from "react";
import { AppleIcon, GoogleIcon } from "@/components/auth/AuthMark";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthTurnstile } from "@/components/auth/AuthTurnstile";
import { signIn, signUp } from "@/lib/auth-client";

function SocialButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="auth-social disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
      {label}
    </button>
  );
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/app",
        errorCallbackURL: "/login",
        fetchOptions: {
          onError: (ctx) => {
            setError(
              ctx.error.message ??
                "Google sign-up failed. Confirm Google OAuth redirect URI is https://priple.vercel.app/api/auth/callback/google.",
            );
            setPending(false);
          },
        },
      });
    } catch {
      setError(
        "Google sign-up failed. Confirm Google OAuth redirect URI is https://priple.vercel.app/api/auth/callback/google.",
      );
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-sans text-[2.15rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.35rem]">
        Sign Up
      </h1>
      <p className="mt-2 font-mono text-[12px] leading-5 text-zinc-500">
        Create an account to access your dashboard
      </p>

      <div className="mt-8 space-y-3">
        <SocialButton label="Sign up with Google" onClick={handleGoogleSignIn} disabled={pending}>
          <GoogleIcon />
        </SocialButton>
        <SocialButton label="Sign up with Apple" disabled>
          <AppleIcon />
        </SocialButton>
      </div>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/12" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-black px-3 font-mono text-[11px] tracking-[0.14em] text-zinc-500">
            OR
          </span>
        </div>
      </div>

      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setNotice(null);

          const form = event.currentTarget;
          const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
          const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
          const password = (form.elements.namedItem("password") as HTMLInputElement).value;
          const confirmPassword = (
            form.elements.namedItem("confirmPassword") as HTMLInputElement
          ).value;

          if (!name) {
            setError("Enter your name.");
            return;
          }

          if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
          }

          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
          }

          if (captchaRequired && !captchaToken) {
            setError("Complete the captcha check before continuing.");
            return;
          }

          setPending(true);

          await signUp.email(
            {
              email,
              password,
              name,
              callbackURL: "/app",
            },
            {
              headers: captchaToken
                ? {
                    "x-captcha-response": captchaToken,
                  }
                : undefined,
              onRequest: () => {
                setPending(true);
              },
              onSuccess: () => {
                setPending(false);
                setCaptchaToken(null);
                setNotice(
                  "Check your email to verify your account, then sign in. Unverified password accounts cannot be linked to Google.",
                );
              },
              onError: (ctx) => {
                setError(ctx.error.message ?? "Sign up failed.");
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
        {notice ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-[11px] text-emerald-200">
            {notice}
          </p>
        ) : null}

        <label className="block">
          <span className="font-mono text-[12px] font-semibold text-white">Name</span>
          <input
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={pending}
            placeholder="Your name"
            className="auth-input mt-2"
          />
        </label>

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

        <label className="block">
          <span className="font-mono text-[12px] font-semibold text-white">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            placeholder="At least 8 characters"
            className="auth-input mt-2"
          />
        </label>

        <label className="block">
          <span className="font-mono text-[12px] font-semibold text-white">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending}
            placeholder="Re-enter your password"
            className="auth-input mt-2"
          />
        </label>

        <AuthTurnstile
          onToken={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
        />

        <button
          type="submit"
          className="auth-submit mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending || (captchaRequired && !captchaToken)}
        >
          {pending ? "Creating account…" : "Create an Account"}
        </button>
      </form>

      <p className="mt-7 font-mono text-[12px] text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="text-zinc-400 underline underline-offset-2">
          Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
