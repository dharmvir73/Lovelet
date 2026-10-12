import { appUrl, isDemo } from './security';
import { sql } from './db';
export function mailConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}
export async function sendMail(
  email: string,
  subject: string,
  text: string,
  idempotencyKey?: string,
) {
  if (!mailConfigured()) {
    if (isDemo()) return;
    throw new Error('Email delivery is not configured.');
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [email],
      subject,
      text,
    }),
  });
  if (!r.ok) throw new Error('Email delivery is temporarily unavailable.');
}
export async function deliverPurchase(id: string) {
  const rows = await sql<{
    email: string;
    slug: string;
    edit_token: string;
    sent: number;
  }>(
    'SELECT p.email,p.slug,m.edit_token,m.sent FROM purchases p JOIN mail_jobs m ON p.id=m.purchase_id WHERE p.id=? AND p.status=? AND p.removed=0',
    [id, 'published'],
  );
  const r = rows[0];
  if (!r || r.sent) return;
  await sendMail(
    r.email,
    'Your Lovelet is ready ♡',
    `Your surprise is ready to share:\n${appUrl()}/s/${r.slug}\n\nManage, edit for 24 hours, or remove your page:\n${appUrl()}/manage/${id}#${r.edit_token}\n\nYour page is hosted for 90 days after payment. Keep your management link private.\nLovelet`,
    `purchase-${id}`,
  );
  await sql('UPDATE mail_jobs SET sent=1,edit_token=? WHERE purchase_id=?', [
    '',
    id,
  ]);
}
