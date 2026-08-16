import { createAuthClient } from "better-auth/react";

/**
 * Prefer same-origin in the browser so OAuth/callback always hit the deployed host.
 * Server components fall back to BETTER_AUTH_URL when set.
 */
function resolveAuthBaseURL() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || undefined;
}

export const authClient = createAuthClient({
  baseURL: resolveAuthBaseURL(),
});

export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword } =
  authClient;
