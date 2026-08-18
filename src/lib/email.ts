type SendEmailInput = {
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

function isProd() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function renderBoxedEmail(input: { title: string; body: string; cta: string; url: string }) {
  const safeUrl = escapeHtml(input.url);
  const safeTitle = escapeHtml(input.title);
  const safeBody = escapeHtml(input.body);
  const safeCta = escapeHtml(input.cta);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#000;padding:32px 16px;font-family:IBM Plex Mono,ui-monospace,monospace;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#09090b;border:1px solid rgba(255,255,255,.12);padding:32px;">
            <tr><td style="color:#71717a;font-size:11px;letter-spacing:.16em;text-transform:uppercase;">Priple</td></tr>
            <tr><td style="padding-top:16px;color:#fff;font-size:22px;font-weight:600;font-family:Instrument Sans,sans-serif;">${safeTitle}</td></tr>
            <tr><td style="padding-top:12px;color:#a1a1aa;font-size:13px;line-height:1.7;">${safeBody}</td></tr>
            <tr>
              <td style="padding-top:24px;">
                <a href="${safeUrl}" style="display:inline-block;background:#fff;color:#000;font-size:12px;font-weight:600;text-decoration:none;padding:12px 20px;">${safeCta}</a>
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

async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  devLabel: string;
  url: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Priple <onboarding@resend.dev>";

  if (!apiKey) {
    if (isProd()) {
      console.error(`[email] RESEND_API_KEY missing — cannot send ${input.devLabel} in production.`);
      throw new Error("Email delivery is not configured.");
    }
    console.warn(`[email] RESEND_API_KEY missing. ${input.devLabel} for ${input.to}: ${input.url}`);
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
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[email] Resend rejected ${input.devLabel}: ${response.status} ${detail}`);
    throw new Error("Failed to send email.");
  }
}

export async function sendResetPasswordEmail({ to, url }: SendEmailInput) {
  await sendResendEmail({
    to,
    subject: "Reset your Priple password",
    html: renderBoxedEmail({
      title: "Reset your password",
      body: "Use the button below to choose a new password. This link expires soon and can only be used once.",
      cta: "Reset password",
      url,
    }),
    text: `Reset your Priple password:\n${url}`,
    devLabel: "Password reset",
    url,
  });
}

export async function sendVerificationEmail({ to, url }: SendEmailInput) {
  await sendResendEmail({
    to,
    subject: "Verify your Priple email",
    html: renderBoxedEmail({
      title: "Verify your email",
      body: "Confirm this address to finish setting up your Priple account and unlock account linking.",
      cta: "Verify email",
      url,
    }),
    text: `Verify your Priple email:\n${url}`,
    devLabel: "Email verification",
    url,
  });
}

export async function sendAlertEmail(input: { to: string; title: string; detail: string }) {
  const appUrl = (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://priple.vercel.app").replace(
    /\/$/,
    "",
  );
  const url = `${appUrl}/app/alerts`;
  await sendResendEmail({
    to: input.to,
    subject: `Priple alert: ${input.title.slice(0, 80)}`,
    html: renderBoxedEmail({
      title: input.title.slice(0, 80),
      body: `${input.detail.slice(0, 400)}\n\nThis is a research alert, not investment advice.`,
      cta: "Open alerts",
      url,
    }),
    text: `${input.title}\n${input.detail}\n${url}`,
    devLabel: "Desk alert",
    url,
  });
}
