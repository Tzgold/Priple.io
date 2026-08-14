"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppleIcon, GoogleIcon } from "@/components/auth/AuthMark";
import { AuthShell } from "@/components/auth/AuthShell";
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

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    await signIn.social({
      provider: "google",
      callbackURL: "/app",
      fetchOptions: {
        onError: (ctx) => {
          setError(ctx.error.message ?? "Google sign-in failed.");
        },
      },
    });
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
          setPending(true);

          const form = event.currentTarget;
          const email = (form.elements.namedItem("email") as HTMLInputElement).value;
          const password = (form.elements.namedItem("password") as HTMLInputElement).value;

          await signIn.email(
            {
              email,
              password,
              callbackURL: "/app",
            },
            {
              onSuccess: () => {
                router.push("/app");
                router.refresh();
              },
              onError: (ctx) => {
                setError(ctx.error.message ?? "Sign in failed.");
                setPending(false);
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
