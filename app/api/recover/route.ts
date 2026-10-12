import { requireOrigin, token, digest, appUrl } from '@/lib/security';
import { sql, rateLimit, type Purchase } from '@/lib/db';
import { sendMail, mailConfigured } from '@/lib/mail';
import { json, error } from '@/lib/http';
import { z } from 'zod';
export async function POST(req: Request) {
  try {
    requireOrigin(req);
    const email = z
      .email()
      .parse((await req.json()).email)
      .toLowerCase();
    await rateLimit('recover:global', 30);
    await rateLimit(`recover:${digest(email)}`, 3);
    if (!mailConfigured())
      throw new Error(
        'Email recovery is not configured. Keep your original management link.',
      );
    const rows = await sql<Purchase>(
      'SELECT * FROM purchases WHERE LOWER(email)=? AND removed=0 ORDER BY created DESC LIMIT 10',
      [email],
    );
    for (const p of rows) {
      const editToken = token();
      // Email first: delivery failures never revoke an existing management link.
      await sendMail(
        p.email,
        'Your Lovelet management link',
        `Manage your Lovelet:\n${appUrl()}/manage/${p.id}#${editToken}\n\nKeep this link private. Your previous management link will be replaced. Editing is available for 24 hours after payment; removal remains available.`,
      );
      await sql('UPDATE purchases SET edit_hash=? WHERE id=?', [
        digest(editToken),
        p.id,
      ]);
      await sql(
        'UPDATE mail_jobs SET edit_token=?,sent=? WHERE purchase_id=? AND sent=0',
        [
          p.status === 'published' ? '' : editToken,
          p.status === 'published' ? 1 : 0,
          p.id,
        ],
      );
    }
    return json({
      ok: true,
      message: 'If that email has a Lovelet, we have sent a management link.',
    });
  } catch (e) {
    return error(e);
  }
}
