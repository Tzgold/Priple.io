import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthDatabase } from "@/lib/db";
import { sendResetPasswordEmail } from "@/lib/email";

function assertAuthSecrets() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  if (isProd) {
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

const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

const authPlugins = [
  ...(turnstileSecret
    ? [
        captcha({
          provider: "cloudflare-turnstile",
          secretKey: turnstileSecret,
          endpoints: ["/sign-up/email", "/request-password-reset"],
        }),
      ]
    : []),
  nextCookies(),
];

const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
const trustedOrigins = Array.from(
  new Set(
    [
      baseUrl,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      // Localhost only outside production — avoids trusting http://localhost in prod auth.
      isProd ? null : "http://localhost:3000",
    ].filter(Boolean) as string[],
  ),
);

export const auth = betterAuth({
  database: createAuthDatabase(),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: baseUrl,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
      requireLocalEmailVerified: false,
    },
  },
  socialProviders: google,
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  plugins: authPlugins,
});
