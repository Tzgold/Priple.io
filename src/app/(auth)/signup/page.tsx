"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M12 2C6.477 2 2 6.586 2 12.253c0 4.53 2.865 8.37 6.839 9.723.5.094.682-.222.682-.482 0-.237-.009-.866-.014-1.7-2.782.617-3.369-1.372-3.369-1.372-.454-1.178-1.11-1.492-1.11-1.492-.908-.635.069-.622.069-.622 1.003.072 1.53 1.056 1.53 1.056.892 1.563 2.341 1.112 2.91.85.092-.661.35-1.112.636-1.367-2.22-.259-4.555-1.14-4.555-5.073 0-1.12.39-2.037 1.03-2.756-.103-.26-.447-1.302.098-2.714 0 0 .84-.275 2.75 1.052A9.35 9.35 0 0 1 12 6.844a9.35 9.35 0 0 1 2.504.345c1.909-1.327 2.748-1.052 2.748-1.052.546 1.412.202 2.454.1 2.714.64.719 1.028 1.636 1.028 2.756 0 3.944-2.338 4.811-4.566 5.065.359.316.679.942.679 1.899 0 1.37-.012 2.475-.012 2.812 0 .263.18.58.688.48A10.27 10.27 0 0 0 22 12.253C22 6.586 17.523 2 12 2z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        opacity=".9"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        opacity=".75"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        opacity=".85"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        opacity=".95"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-[380px] animate-fade-up">
      <div className="mx-auto mb-8 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black text-sm font-semibold text-white">
        P
      </div>

      <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
        Create a Priple account
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="text-white underline-offset-4 hover:underline">
          Log in.
        </Link>
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button variant="outline" className="rounded-lg" type="button">
          <GoogleIcon />
          Google
        </Button>
        <Button variant="outline" className="rounded-lg" type="button">
          <GitHubIcon />
          GitHub
        </Button>
      </div>

      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-transparent px-3 text-zinc-500 backdrop-blur-sm">or</span>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/app");
        }}
      >
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="alan.turing@example.com"
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••••••"
          autoComplete="new-password"
          required
          trailing={
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="hover:text-zinc-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <Button type="submit" className="mt-2 w-full rounded-lg" size="lg">
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-[11px] leading-5 text-zinc-600">
        By signing up, you agree to the{" "}
        <span className="underline underline-offset-2">Terms</span>,{" "}
        <span className="underline underline-offset-2">Acceptable Use</span>, and{" "}
        <span className="underline underline-offset-2">Privacy Policy</span>.
      </p>
    </div>
  );
}
