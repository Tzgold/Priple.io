import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthDatabase, getPgPool, lockPublicTable } from "@/lib/db";
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

/** Better Auth OAuth state / email verification storage (shared across serverless). */
async function ensureAuthVerificationTable() {
  try {
    await getPgPool().query(`
      CREATE TABLE IF NOT EXISTS verification (
        id text PRIMARY KEY,
        identifier text NOT NULL,
        value text NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz DEFAULT now(),
        "updatedAt" timestamptz DEFAULT now()
      )
    `);
    await getPgPool().query(`
      CREATE INDEX IF NOT EXISTS verification_identifier_idx
      ON verification (identifier)
    `);
    // Skip lockPublicTable on boot — concurrent ALTER/REVOKE under pool pressure
    // caused "tuple concurrently updated" and burned session slots.
    if (process.env.AUTH_LOCK_VERIFICATION_TABLE === "1") {
      await lockPublicTable("verification");
    }
  } catch (error) {
    console.error(
      "[auth] verification table ensure failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

void ensureAuthVerificationTable();

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
);

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

const baseUrl = (
  process.env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000"
).replace(/\/$/, "");

const extraOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.AUTH_TRUSTED_ORIGINS,
]
  .flatMap((raw) =>
    (raw || "")
      .split(",")
      .map((value) => value.trim().replace(/\/$/, ""))
      .filter((value) => /^https?:\/\//i.test(value)),
  );

const trustedOrigins = Array.from(
  new Set(
    [
      baseUrl,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
      isProd() ? null : "http://localhost:3000",
      ...extraOrigins,
    ].filter(Boolean) as string[],
  ),
);

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

const cookieHost = hostnameOf(baseUrl);
const onPublicSuffixHost =
  cookieHost.endsWith(".vercel.app") || cookieHost === "vercel.app";

export const auth = betterAuth({
  database: createAuthDatabase(),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: baseUrl,
  // Land OAuth failures on login with a readable message (not the marketing home).
  onAPIError: {
    errorURL: "/login",
  },
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
    // Persist OAuth state in Postgres so serverless instances share it.
    storeStateStrategy: "database",
    /**
     * `.vercel.app` is on the public suffix list — browsers often drop the
     * OAuth state cookie. Custom domains can validate the cookie normally.
     */
    skipStateCookieCheck:
      onPublicSuffixHost || process.env.AUTH_SKIP_STATE_COOKIE === "1",
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: true,
    },
  },
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          prompt: "select_account",
        },
      }
    : {},
  trustedOrigins,
  advanced: {
    useSecureCookies: isProd(),
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isProd(),
      path: "/",
      httpOnly: true,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
  },
  plugins: authPlugins,
});
