"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppleIcon, GoogleIcon } from "@/components/auth/AuthMark";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthTurnstile } from "@/components/auth/AuthTurnstile";
import { signIn } from "@/lib/auth-client";

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

function oauthErrorMessage(code: string | null) {
  if (!code) return null;
  if (code === "state_mismatch" || code === "state_security_mismatch") {
    return "Google sign-in could not complete (session state lost). Try again once. If it keeps failing, confirm BETTER_AUTH_URL is https://priple.vercel.app and Google redirect URI matches.";
  }
  if (code === "access_denied") return "Google sign-in was cancelled.";
  return `Sign-in error: ${code}`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    const fromOauth = oauthErrorMessage(searchParams.get("error"));
    if (fromOauth) setError(fromOauth);
  }, [searchParams]);

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
                "Google sign-in failed. Confirm Google OAuth redirect URI is https://priple.vercel.app/api/auth/callback/google and BETTER_AUTH_URL matches.",
            );
            setPending(false);
          },
        },
      });
    } catch {
      setError(
        "Google sign-in failed. Confirm Google OAuth redirect URI is https://priple.vercel.app/api/auth/callback/google and BETTER_AUTH_URL matches.",
      );
      setPending(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="font-sans text-[2.15rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.35rem]">
        Sign In
      </h1>
      <p className="mt-2 font-mono text-[12px] leading-5 text-zinc-500">
        Continue to access your dashboard
      </p>

      <div className="mt-8 space-y-3">
        <SocialButton label="Sign in with Google" onClick={handleGoogleSignIn} disabled={pending}>
          <GoogleIcon />
        </SocialButton>
        <SocialButton label="Sign in with Apple" disabled>
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

          const form = event.currentTarget;
          const email = (form.elements.namedItem("email") as HTMLInputElement).value;
          const password = (form.elements.namedItem("password") as HTMLInputElement).value;

          if (captchaRequired && !captchaToken) {
            setError("Complete the captcha check before continuing.");
            return;
          }

          setPending(true);

          await signIn.email(
            {
              email,
              password,
              callbackURL: "/app",
            },
            {
              headers: captchaToken
                ? {
                    "x-captcha-response": captchaToken,
                  }
                : undefined,
              onSuccess: () => {
                router.push("/app");
                router.refresh();
              },
              onError: (ctx) => {
                setError(ctx.error.message ?? "Sign in failed.");
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

        <label className="block">
          <span className="flex items-center justify-between">
            <span className="font-mono text-[12px] font-semibold text-white">Password</span>
            <Link
              href="/forgot-password"
              className="font-mono text-[11px] text-white underline underline-offset-2"
            >
              Forgot Password?
            </Link>
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
            placeholder="Enter your password"
            className="auth-input mt-2"
          />
        </label>

        {/* Captcha errors stay inside the widget — do not block Google above. */}
        <AuthTurnstile
          onToken={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
        />

        <button type="submit" className="auth-submit mt-2 disabled:opacity-60" disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-7 font-mono text-[12px] text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-zinc-400 underline underline-offset-2">
          Create an Account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell><p className="font-mono text-[12px] text-zinc-500">Loading…</p></AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
