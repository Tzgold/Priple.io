"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppleIcon, GoogleIcon } from "@/components/auth/AuthMark";
import { AuthShell } from "@/components/auth/AuthShell";

function SocialButton({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button type="button" className="auth-social">
      {children}
      {label}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthShell>
      <h1 className="font-sans text-[2.15rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.35rem]">
        Sign In
      </h1>
      <p className="mt-2 font-mono text-[12px] leading-5 text-zinc-500">
        Continue to access your dashboard
      </p>

      <div className="mt-8 space-y-3">
        <SocialButton label="Sign in with Google">
          <GoogleIcon />
        </SocialButton>
        <SocialButton label="Sign in with Apple">
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
        onSubmit={(event) => {
          event.preventDefault();
          router.push("/app");
        }}
      >
        <label className="block">
          <span className="font-mono text-[12px] font-semibold text-white">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="Enter your email"
            className="auth-input mt-2"
          />
        </label>

        <label className="block">
          <span className="flex items-center justify-between">
            <span className="font-mono text-[12px] font-semibold text-white">Password</span>
            <a
              href="#forgot"
              className="font-mono text-[11px] text-white underline underline-offset-2"
            >
              Forgot Password?
            </a>
          </span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            className="auth-input mt-2"
          />
        </label>

        <button type="submit" className="auth-submit mt-2">
          Sign In
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
