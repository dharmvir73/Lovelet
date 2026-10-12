import { admin, json, error, secureCookie } from '@/lib/http';
import { requireOrigin, equals, isDemo } from '@/lib/security';
import { sql, purchase, parseContent, rateLimit } from '@/lib/db';
import { razorpay, reconcile } from '@/lib/payments';
import { removePhoto } from '@/lib/storage';
import { cleanup } from '@/lib/cleanup';
export async function GET(req: Request) {
  try {
    await admin(req);
    const purchases = await sql(
      'SELECT id,email,status,slug,order_id,payment_id,created,paid,removed,refund_id FROM purchases ORDER BY created DESC LIMIT 100',
    );
    const events = await sql('SELECT name,count FROM events');
    return json({ purchases, events });
  } catch {
    return json({ error: 'Unauthorized' }, 401);
  }
}
export async function POST(req: Request) {
  try {
    requireOrigin(req);
    const b = await req.json();
    if (b.action === 'login') {
      await rateLimit('admin:login', 20);
      if (
        !process.env.ADMIN_TOKEN ||
        !equals(String(b.token), process.env.ADMIN_TOKEN)
      )
        return json({ error: 'Unauthorized' }, 401);
      const r = json({ ok: true });
      r.cookies.set('lovelet_admin', b.token, {
        ...secureCookie,
        maxAge: 3600,
      });
      return r;
    }
    await admin(req);
    if (b.action === 'logout') {
      const r = json({ ok: true });
      r.cookies.delete('lovelet_admin');
      return r;
    }
    if (b.action === 'cleanup') return json(await cleanup());
    const p = await purchase(b.id);
    if (!p) throw new Error('Purchase not found.');
    if (b.action === 'reconcile') {
      const r = await reconcile(p);
      return json({ status: r.status });
    }
    if (b.action === 'remove') {
      await sql('UPDATE purchases SET removed=1 WHERE id=?', [p.id]);
      for (const key of parseContent(p).photos) await removePhoto(key);
      return json({ ok: true });
    }
    if (b.action === 'refund') {
      if (!p.payment_id || !p.paid)
        throw new Error('No captured payment to refund.');
      if (p.refund_id) return json({ refundId: p.refund_id });
      const locked = await sql<{ id: string }>(
        "UPDATE purchases SET status='refund_pending' WHERE id=? AND status='published' RETURNING id",
        [p.id],
      );
      if (!locked.length)
        throw new Error(
          'Refund is already pending. Check Razorpay before retrying.',
        );
      let refund;
      try {
        refund =
          isDemo() && p.payment_id.startsWith('demo_')
            ? { id: `demo_refund_${p.id}`, status: 'processed' }
            : await razorpay(
                `payments/${encodeURIComponent(p.payment_id)}/refund`,
                'POST',
                { amount: 19900, notes: { purchase_id: p.id } },
              );
      } catch {
        throw new Error(
          'Refund status is uncertain. Check Razorpay before any further refund attempt.',
        );
      }
      await sql(
        'UPDATE purchases SET refund_id=?,status=?,removed=1 WHERE id=?',
        [
          refund.id,
          refund.status === 'processed' ? 'refunded' : 'refund_pending',
          p.id,
        ],
      );
      return json({ refundId: refund.id });
    }
    throw new Error('Unknown action.');
  } catch (e) {
    return error(e);
  }
}
