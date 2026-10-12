import { PRICE } from './content';
import { sql, purchase, type Purchase } from './db';
import { token, verifySignature, isDemo } from './security';
import { deliverPurchase } from './mail';
export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
};
export async function razorpay(path: string, method = 'GET', body?: unknown) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    throw new Error('Live payments are not configured yet.');
  const r = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!r.ok)
    throw new Error('The payment service is unavailable. Please try again.');
  return r.json();
}
export function validatePayment(p: Purchase, payment: Payment) {
  if (
    payment.order_id !== p.order_id ||
    payment.amount !== PRICE ||
    payment.currency !== 'INR' ||
    payment.status !== 'captured'
  )
    throw new Error('Payment has not been captured for this order.');
}
export async function publish(id: string, payment: Payment) {
  const p = await purchase(id);
  if (!p || p.removed || ['refunded', 'refund_pending'].includes(p.status))
    throw new Error('This purchase is unavailable.');
  validatePayment(p, payment);
  if (p.payment_id && p.payment_id !== payment.id)
    throw new Error('Payment does not match this purchase.');
  const rows = await sql<{ id: string }>(
    "UPDATE purchases SET status='published',payment_id=?,slug=COALESCE(slug,?),paid=COALESCE(paid,?) WHERE id=? AND removed=0 AND status IN ('ordered','published') AND (payment_id IS NULL OR payment_id=?) RETURNING id",
    [payment.id, token(), Date.now(), id, payment.id],
  );
  if (!rows.length)
    throw new Error('Payment cannot be applied to this purchase.');
  await deliverPurchase(id).catch(() => {});
  return (await purchase(id))!;
}
export function checkoutValid(
  order: string,
  payment: string,
  signature: string,
) {
  return verifySignature(
    `${order}|${payment}`,
    signature,
    process.env.RAZORPAY_KEY_SECRET || '',
  );
}
export async function reconcile(p: Purchase) {
  if (p.status === 'published') {
    await deliverPurchase(p.id).catch(() => {});
    return p;
  }
  if (isDemo()) return p;
  if (!p.order_id && p.status === 'ordering') {
    const orders = await razorpay(
      `orders?receipt=${encodeURIComponent(p.id.slice(0, 40))}`,
    );
    const order = orders.items?.find(
      (o: { receipt: string; amount: number; currency: string }) =>
        o.receipt === p.id.slice(0, 40) &&
        o.amount === PRICE &&
        o.currency === 'INR',
    );
    if (order) {
      await sql(
        "UPDATE purchases SET order_id=?,status='ordered' WHERE id=? AND order_id IS NULL",
        [order.id, p.id],
      );
      p = (await purchase(p.id))!;
    }
  }
  if (!p.order_id) return p;
  const result = await razorpay(
    `orders/${encodeURIComponent(p.order_id)}/payments`,
  );
  const captured = result.items.find((v: Payment) => v.status === 'captured');
  return captured ? publish(p.id, captured) : p;
}
