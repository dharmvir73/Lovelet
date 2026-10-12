import { verifySignature } from '@/lib/security';
import { sql, type Purchase } from '@/lib/db';
import { publish, razorpay } from '@/lib/payments';
import { json } from '@/lib/http';
export async function POST(req: Request) {
  const body = await req.text(),
    secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (
    !secret ||
    !verifySignature(
      body,
      req.headers.get('x-razorpay-signature') || '',
      secret,
    )
  )
    return json({ error: 'Invalid signature' }, 401);
  try {
    const event = JSON.parse(body);
    if (['payment.captured', 'order.paid'].includes(event.event)) {
      const entity = event.payload?.payment?.entity;
      if (!entity?.id || !entity.order_id)
        return json({ error: 'Missing payment' }, 400);
      const p = (
        await sql<Purchase>('SELECT * FROM purchases WHERE order_id=?', [
          entity.order_id,
        ])
      )[0];
      if (!p) return json({ error: 'Order is not yet available; retry' }, 503);
      if (!p.removed && !['refunded', 'refund_pending'].includes(p.status))
        await publish(
          p.id,
          await razorpay(`payments/${encodeURIComponent(entity.id)}`),
        );
    }
    if (event.event === 'refund.processed') {
      const entity = event.payload?.refund?.entity;
      if (entity?.payment_id)
        await sql(
          "UPDATE purchases SET status='refunded',removed=1,refund_id=? WHERE payment_id=?",
          [entity.id, entity.payment_id],
        );
    }
    return json({ ok: true });
  } catch {
    return json({ error: 'Processing failed; retry webhook' }, 503);
  }
}
