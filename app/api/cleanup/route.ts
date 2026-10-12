import { equals } from '@/lib/security';
import { cleanup } from '@/lib/cleanup';
import { json } from '@/lib/http';
export async function POST(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    !equals(
      req.headers.get('authorization') || '',
      `Bearer ${process.env.CRON_SECRET}`,
    )
  )
    return json({ error: 'Unauthorized' }, 401);
  return json(await cleanup());
}
