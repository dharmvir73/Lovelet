import { sql, parseContent, type Purchase, purchase } from '@/lib/db';
import { active, allowed, owned } from '@/lib/http';
import { readPhoto } from '@/lib/storage';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    const u = new URL(req.url);
    let p: Purchase | undefined;
    if (u.searchParams.has('owner'))
      p = await owned(req, u.searchParams.get('owner')!);
    else {
      p = (
        await sql<Purchase>('SELECT * FROM purchases WHERE slug=?', [
          u.searchParams.get('page') || '',
        ])
      )[0];
      if (!p || !active(p) || !(await allowed(p)))
        throw new Error('Unavailable');
    }
    if (!p || p.removed || !parseContent(p).photos.includes(key))
      throw new Error('Unavailable');
    return new Response(new Uint8Array(await readPhoto(key)), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch {
    return new Response('Image unavailable', { status: 404 });
  }
}
