const env = (key: string): string => process.env[key]?.trim() || "";

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[ch] || ch);
}

export function passwordResetEmailConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY") && env("RESET_EMAIL_FROM"));
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  name?: string | null;
  resetUrl: string;
}): Promise<void> {
  const apiKey = env("RESEND_API_KEY");
  const from = env("RESET_EMAIL_FROM");
  if (!apiKey || !from) {
    console.error("[auth-email] Password reset email is not configured: set RESEND_API_KEY and RESET_EMAIL_FROM");
    return;
  }

  const safeName = escapeHtml(opts.name?.trim() || "there");
  const safeUrl = escapeHtml(opts.resetUrl);
  const subject = "Reset your Mr Wallpapers password";
  const text = `Hi ${opts.name?.trim() || "there"},\n\nUse this link to reset your Mr Wallpapers password:\n${opts.resetUrl}\n\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.\n`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f6f6;margin:0;padding:32px;color:#111"><div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:32px"><h1 style="margin:0 0 16px;font-size:28px">Reset your password</h1><p>Hi ${safeName},</p><p>Use the button below to choose a new password for your Mr Wallpapers account.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px">Reset password</a></p><p style="font-size:13px;color:#666">This link expires in 1 hour. If you did not request this reset, you can ignore this email.</p></div></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: [opts.to], subject, html, text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[auth-email] Resend failed (${response.status}) ${detail.slice(0, 300)}`);
    throw new Error("Password reset email could not be sent");
  }
}


export async function sendAccountDeletionEmail(opts: {
  to: string;
  name?: string | null;
  deleteUrl: string;
}): Promise<void> {
  const apiKey = env("RESEND_API_KEY");
  const from = env("RESET_EMAIL_FROM");
  if (!apiKey || !from) {
    throw new Error("Account deletion email is not configured");
  }

  const safeName = escapeHtml(opts.name?.trim() || "there");
  const safeUrl = escapeHtml(opts.deleteUrl);
  const subject = "Confirm deletion of your Mr Wallpapers account";
  const text = `Hi ${opts.name?.trim() || "there"},\n\nOpen this link to permanently delete your Mr Wallpapers account:\n${opts.deleteUrl}\n\nIf you did not request this, you can ignore this email.\n`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f6f6;margin:0;padding:32px;color:#111"><div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:32px"><h1 style="margin:0 0 16px;font-size:28px">Delete your account?</h1><p>Hi ${safeName},</p><p>This link permanently deletes your Mr Wallpapers account and personal app data.</p><p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 20px;border-radius:10px">Delete account</a></p><p style="font-size:13px;color:#666">If you did not request this, you can ignore this email.</p></div></body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to: [opts.to], subject, html, text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[auth-email] Account deletion email failed (${response.status}) ${detail.slice(0, 300)}`);
    throw new Error("Account deletion email could not be sent");
  }
}
