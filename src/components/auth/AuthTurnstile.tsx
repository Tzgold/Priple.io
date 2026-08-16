"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useCallback, useRef, useState } from "react";

type AuthTurnstileProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: (message: string) => void;
};

function extractErrorCode(error: unknown): string | null {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (typeof error === "number") return String(error);
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["code", "errorCode", "error", "message"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number") return String(value);
    }
  }
  return null;
}

function turnstileErrorMessage(code: string | null) {
  if (code === "110100") {
    return "Invalid Turnstile site key. Confirm NEXT_PUBLIC_TURNSTILE_SITE_KEY matches the widget Site Key (not the Secret).";
  }
  if (code === "110200") {
    return "Hostname not allowed. In Cloudflare Turnstile → your widget → Hostname management, add exactly: priple.vercel.app and localhost (no https://).";
  }
  if (code === "110600") {
    return "Captcha challenge failed. Tap Retry.";
  }
  if (code) {
    return `Captcha error (${code}). Add priple.vercel.app + localhost in Turnstile Hostname management, then Retry.`;
  }
  return "Captcha failed to load. Add hostnames priple.vercel.app and localhost in Cloudflare Turnstile, confirm the Site Key, then Retry.";
}

/**
 * Managed Turnstile checkbox — stable (no auto-reset flicker loop).
 */
export function AuthTurnstile({ onToken, onExpire, onError }: AuthTurnstileProps) {
  const ref = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [remountKey, setRemountKey] = useState(0);

  const handleSuccess = useCallback(
    (token: string) => {
      setStatus("ok");
      setErrorText(null);
      onToken(token);
    },
    [onToken],
  );

  const handleExpire = useCallback(() => {
    setStatus("idle");
    onExpire?.();
  }, [onExpire]);

  const handleError = useCallback(
    (error?: unknown) => {
      // Never reset() here — that causes the light on/off loop with auto-retry.
      const code = extractErrorCode(error);
      const message = turnstileErrorMessage(code);
      setStatus("error");
      setErrorText(message);
      onError?.(message);
    },
    [onError],
  );

  const retry = useCallback(() => {
    setErrorText(null);
    setStatus("idle");
    onExpire?.();
    setRemountKey((n) => n + 1);
  }, [onExpire]);

  if (!siteKey) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-mono text-[11px] text-amber-200">
        Captcha is not configured. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to your environment and
        redeploy.
      </p>
    );
  }

  return (
    <div className="auth-turnstile">
      <Turnstile
        key={remountKey}
        ref={ref}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onExpire={handleExpire}
        onError={handleError}
        options={{
          theme: "dark",
          size: "normal",
          // Always show the managed checkbox — more reliable than interaction-only.
          appearance: "always",
          retry: "never",
          refreshExpired: "manual",
        }}
      />

      {status === "ok" ? (
        <p className="auth-turnstile-status auth-turnstile-status--ok">Verified</p>
      ) : null}

      {status === "error" && errorText ? (
        <div className="auth-turnstile-error">
          <p>{errorText}</p>
          <p className="auth-turnstile-hint">
            This page host:{" "}
            {typeof window !== "undefined" ? window.location.hostname : "—"} · Vercel site key
            starts with {siteKey.slice(0, 12)}… Open Cloudflare → Turnstile → the widget whose
            Site Key starts the same, confirm Hostnames lists priple.vercel.app (saved after
            refresh). Redeploy only if you changed the Vercel site key — hostname edits apply
            immediately.
          </p>
          <button type="button" className="auth-turnstile-retry" onClick={retry}>
            Retry captcha
          </button>
        </div>
      ) : null}
    </div>
  );
}
