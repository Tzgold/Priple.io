import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthDatabase } from "@/lib/db";
import { sendResetPasswordEmail, sendVerificationEmail } from "@/lib/email";

function isProd() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function assertAuthSecrets() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();

  if (isProd()) {
    if (!secret || secret.length < 32) {
      throw new Error(
        "BETTER_AUTH_SECRET must be set to a strong random value (32+ chars) in production.",
      );
    }
    if (!process.env.BETTER_AUTH_URL?.startsWith("https://")) {
      throw new Error("BETTER_AUTH_URL must be an https:// URL in production.");
    }
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required in production.");
    }
    if (!process.env.TURNSTILE_SECRET_KEY?.trim() || !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()) {
      throw new Error(
        "TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY are required in production.",
      );
    }
    if (!process.env.RESEND_API_KEY?.trim()) {
      throw new Error("RESEND_API_KEY is required in production for verification and password reset.");
    }
  }
}

assertAuthSecrets();

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {};

const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
const turnstileEnabled = Boolean(turnstileSecret);

const authPlugins = [
  ...(turnstileEnabled
    ? [
        captcha({
          provider: "cloudflare-turnstile",
          secretKey: turnstileSecret!,
          endpoints: ["/sign-up/email", "/sign-in/email", "/request-password-reset"],
        }),
      ]
    : []),
  nextCookies(),
];

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const trustedOrigins = Array.from(
  new Set(
    [
      baseUrl,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      // Localhost only outside production — avoids trusting http://localhost in prod auth.
      isProd() ? null : "http://localhost:3000",
    ].filter(Boolean) as string[],
  ),
);

export const auth = betterAuth({
  database: createAuthDatabase(),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: baseUrl,
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        url,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        to: user.email,
        url,
      });
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      // Blocks OAuth attach to unverified password accounts (pre-account hijack).
      requireLocalEmailVerified: true,
    },
  },
  socialProviders: google,
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
  },
  plugins: authPlugins,
});
