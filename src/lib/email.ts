type SendResetEmailInput = {
  to: string;
  url: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderResetHtml(url: string) {
  const safeUrl = escapeHtml(url);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#000;padding:32px 16px;font-family:IBM Plex Mono,ui-monospace,monospace;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#09090b;border:1px solid rgba(255,255,255,.12);padding:32px;">
            <tr><td style="color:#71717a;font-size:11px;letter-spacing:.16em;text-transform:uppercase;">Priple</td></tr>
            <tr><td style="padding-top:16px;color:#fff;font-size:22px;font-weight:600;font-family:Instrument Sans,sans-serif;">Reset your password</td></tr>
            <tr><td style="padding-top:12px;color:#a1a1aa;font-size:13px;line-height:1.7;">Use the button below to choose a new password. This link expires soon and can only be used once.</td></tr>
            <tr>
              <td style="padding-top:24px;">
                <a href="${safeUrl}" style="display:inline-block;background:#fff;color:#000;font-size:12px;font-weight:600;text-decoration:none;padding:12px 20px;">Reset password</a>
              </td>
            </tr>
            <tr><td style="padding-top:20px;color:#52525b;font-size:11px;line-height:1.6;word-break:break-all;">${safeUrl}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendResetPasswordEmail({ to, url }: SendResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Priple <onboarding@resend.dev>";

  if (!apiKey) {
    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
    if (isProd) {
      console.error("[email] RESEND_API_KEY missing — cannot send password reset in production.");
      throw new Error("Email delivery is not configured.");
    }
    // Local only: never log reset links in production logs.
    console.warn(`[email] RESEND_API_KEY missing. Password reset for ${to}: ${url}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your Priple password",
      html: renderResetHtml(url),
      text: `Reset your Priple password:\n${url}`,
    }),
  });

  if (!response.ok) {
    console.error(`[email] Resend rejected the request: ${response.status} ${await response.text()}`);
  }
}
