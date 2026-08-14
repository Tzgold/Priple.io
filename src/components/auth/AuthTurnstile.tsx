"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";

type AuthTurnstileProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

export function AuthTurnstile({ onToken, onExpire, onError }: AuthTurnstileProps) {
  const ref = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-mono text-[11px] text-amber-200">
        Captcha is not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your environment.
      </p>
    );
  }

  return (
    <div className="auth-turnstile">
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        onSuccess={onToken}
        onExpire={() => {
          ref.current?.reset();
          onExpire?.();
        }}
        onError={() => {
          ref.current?.reset();
          onError?.();
        }}
        options={{
          theme: "dark",
          size: "normal",
          appearance: "always",
        }}
      />
    </div>
  );
}
