import { requireOrigin, isDemo } from '@/lib/security';
import { owned, json, error } from '@/lib/http';
import { publish } from '@/lib/payments';
import { PRICE } from '@/lib/content';
export async function POST(req: Request) {
  try {
    requireOrigin(req);
    if (!isDemo()) return json({ error: 'Demo payments are disabled.' }, 404);
    const { id } = await req.json();
    const p = await owned(req, id);
    if (!p.order_id?.startsWith('demo_'))
      throw new Error('Create a demo order first.');
    const r = await publish(id, {
      id: `demo_payment_${id}`,
      order_id: p.order_id,
      amount: PRICE,
      currency: 'INR',
      status: 'captured',
    });
    return json({ slug: r.slug });
  } catch (e) {
    return error(e);
  }
}
