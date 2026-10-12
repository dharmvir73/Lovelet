import { track, rateLimit } from '@/lib/db';
import { requireOrigin } from '@/lib/security';
import { json, error } from '@/lib/http';
export async function POST(req: Request) {
  try {
    requireOrigin(req);
    await rateLimit('events:global', 2000);
    const { name } = await req.json();
    if (!['visits', 'builder_starts', 'previews'].includes(name))
      throw new Error('Invalid event.');
    await track(name);
    return json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
