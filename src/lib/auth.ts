import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";
import { sendResetPasswordEmail } from "@/lib/email";

const dbPath = path.join(process.cwd(), "sqlite.db");

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

function createDatabase() {
  const url = process.env.DATABASE_URL;

  if (url) {
    return new Pool({
      connectionString: url,
      ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
    });
  }

  return new Database(dbPath);
}

export const auth = betterAuth({
  database: createDatabase(),
  emailAndPassword: {
    enabled: true,
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
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  plugins: authPlugins,
});
