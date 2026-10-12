import { requireOrigin, isDemo } from '@/lib/security';
import { owned, json, error } from '@/lib/http';
import { sql, rateLimit, track } from '@/lib/db';
import { razorpay } from '@/lib/payments';
import { mailConfigured } from '@/lib/mail';
import { PRICE } from '@/lib/content';
export async function POST(req: Request) {
  try {
    requireOrigin(req);
    const { id } = await req.json();
    const p = await owned(req, id);
    await rateLimit(`order:${id}`, 10);
    if (p.removed || ['refunded', 'refund_pending'].includes(p.status))
      throw new Error('This purchase is unavailable.');
    if (p.status === 'published')
      return json({ published: true, slug: p.slug });
    if (!isDemo()) {
      if (!mailConfigured())
        throw new Error('Email delivery is not configured yet.');
      if (
        !process.env.SUPPORT_EMAIL ||
        !process.env.BUSINESS_NAME ||
        !process.env.BUSINESS_ADDRESS
      )
        throw new Error(
          'Business and support information is not configured yet.',
        );
      if (
        process.env.NODE_ENV === 'production' &&
        (!process.env.APP_SECRET ||
          !process.env.RAZORPAY_WEBHOOK_SECRET ||
          !process.env.CRON_SECRET ||
          !process.env.ADMIN_TOKEN ||
          !process.env.APP_URL?.startsWith('https://'))
      )
        throw new Error(
          'Production security and payment recovery are not configured yet.',
        );
    }
    if (p.order_id)
      return json({
        orderId: p.order_id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: PRICE,
        currency: 'INR',
        demo: p.order_id.startsWith('demo_') && isDemo(),
      });
    if (isDemo()) {
      const orderId = `demo_${id}`;
      await sql(
        "UPDATE purchases SET order_id=?,status='ordered' WHERE id=? AND order_id IS NULL",
        [orderId, id],
      );
      return json({ orderId, demo: true, amount: PRICE, currency: 'INR' });
    }
    // Atomic reservation: concurrent clients never create a second payment order.
    const reserved = await sql<{ id: string }>(
      "UPDATE purchases SET status='ordering' WHERE id=? AND status='draft' AND order_id IS NULL RETURNING id",
      [id],
    );
    let order;
    if (reserved.length)
      order = await razorpay('orders', 'POST', {
        amount: PRICE,
        currency: 'INR',
        receipt: id.slice(0, 40),
        notes: { purchase_id: id },
      });
    else {
      const existing = await razorpay(
        `orders?receipt=${encodeURIComponent(id.slice(0, 40))}`,
      );
      order = existing.items?.find(
        (o: { receipt: string }) => o.receipt === id.slice(0, 40),
      );
      if (!order)
        throw new Error(
          'Your order is being prepared. Retry shortly, or contact support. No payment has been requested again.',
        );
    }
    if (order.amount !== PRICE || order.currency !== 'INR')
      throw new Error('Unexpected payment order.');
    await sql(
      "UPDATE purchases SET order_id=?,status='ordered' WHERE id=? AND order_id IS NULL",
      [order.id, id],
    );
    await track('checkouts');
    return json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: PRICE,
      currency: 'INR',
    });
  } catch (e) {
    return error(e);
  }
}
