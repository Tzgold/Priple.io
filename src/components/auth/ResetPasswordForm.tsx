"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { resetPassword } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidToken = searchParams.get("error") === "INVALID_TOKEN";

  const [error, setError] = useState<string | null>(
    invalidToken ? "This reset link is invalid or has expired." : null,
  );
  const [pending, setPending] = useState(false);

  if (!token && !invalidToken) {
    return (
      <AuthShell>
        <h1 className="font-sans text-[2.15rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.35rem]">
          Reset Password
        </h1>
        <p className="mt-2 font-mono text-[12px] leading-5 text-zinc-500">
          This page needs a valid reset link from your email.
        </p>
        <Link
          href="/forgot-password"
          className="auth-submit mt-8 inline-flex items-center justify-center"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="font-sans text-[2.15rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.35rem]">
        Reset Password
      </h1>
      <p className="mt-2 font-mono text-[12px] leading-5 text-zinc-500">
        Choose a new password for your account
      </p>

      <form
        className="mt-8 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          if (!token) {
            setError("This reset link is invalid or has expired.");
            return;
          }

          const form = event.currentTarget;
          const password = (form.elements.namedItem("password") as HTMLInputElement).value;
          const confirmPassword = (
            form.elements.namedItem("confirmPassword") as HTMLInputElement
          ).value;

          if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
          }

          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
          }

          setPending(true);

          await resetPassword(
            {
              newPassword: password,
              token,
            },
            {
              onSuccess: () => {
                router.push("/login");
                router.refresh();
              },
              onError: (ctx) => {
                setError(ctx.error.message ?? "Could not reset password.");
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
          <span className="font-mono text-[12px] font-semibold text-white">New password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={pending || !token}
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
            disabled={pending || !token}
            placeholder="Re-enter your password"
            className="auth-input mt-2"
          />
        </label>

        <button
          type="submit"
          className="auth-submit mt-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending || !token}
        >
          {pending ? "Updating…" : "Update Password"}
        </button>
      </form>

      <p className="mt-7 font-mono text-[12px] text-zinc-500">
        <Link href="/login" className="text-zinc-400 underline underline-offset-2">
          Back to Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
