import { sql, parseContent, type Purchase } from '@/lib/db';
import {
  active,
  allowed,
  accessValue,
  secureCookie,
  json,
  error,
} from '@/lib/http';
import { checkPassword, requireOrigin } from '@/lib/security';
import { rateLimit } from '@/lib/db';
async function get(slug: string) {
  const p = (
    await sql<Purchase>('SELECT * FROM purchases WHERE slug=?', [slug])
  )[0];
  return p && active(p) ? p : undefined;
}
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const p = await get((await params).slug);
  if (!p)
    return json({ error: 'This surprise is unavailable or has expired.' }, 404);
  if (!(await allowed(p)))
    return json({ locked: true, recipient: parseContent(p).recipient });
  return json({ content: parseContent(p) });
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    requireOrigin(req);
    const { slug } = await params;
    const p = await get(slug);
    if (!p) return json({ error: 'This surprise is unavailable.' }, 404);
    await rateLimit(`unlock:${slug}`, 30);
    const { password } = await req.json();
    if (
      typeof password !== 'string' ||
      password.length > 100 ||
      !checkPassword(password, p.password)
    )
      return json(
        { error: 'That password did not match. Please try again.' },
        401,
      );
    const r = json({ content: parseContent(p) });
    r.cookies.set(`access_${slug}`, accessValue(p), {
      ...secureCookie,
      maxAge: 86400,
    });
    return r;
  } catch (e) {
    return error(e);
  }
}
