import { requireOrigin } from '@/lib/security';
import { owned, json, error } from '@/lib/http';
import { publish, razorpay, checkoutValid } from '@/lib/payments';
export async function POST(req: Request) {
  try {
    requireOrigin(req);
    const b = await req.json();
    const p = await owned(req, b.id);
    if (
      b.razorpay_order_id !== p.order_id ||
      !checkoutValid(p.order_id!, b.razorpay_payment_id, b.razorpay_signature)
    )
      throw new Error('Payment signature could not be verified.');
    const payment = await razorpay(
      `payments/${encodeURIComponent(b.razorpay_payment_id)}`,
    );
    const result = await publish(p.id, payment);
    return json({ slug: result.slug });
  } catch (e) {
    return error(e);
  }
}
