import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthDatabase } from "@/lib/db";
import { sendResetPasswordEmail } from "@/lib/email";

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

export const auth = betterAuth({
  database: createAuthDatabase(),
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
