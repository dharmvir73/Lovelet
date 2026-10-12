import { owned, json, error, secureCookie } from '@/lib/http';
import { draftSchema } from '@/lib/validation';
import { requireOrigin, hashPassword } from '@/lib/security';
import { sql, parseContent } from '@/lib/db';
import { reconcile } from '@/lib/payments';
import { removePhoto } from '@/lib/storage';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let p = await owned(req, id);
    p = await reconcile(p);
    return json({
      id: p.id,
      content: parseContent(p),
      email: p.email,
      status: p.status,
      slug: p.slug,
      paid: p.paid,
      removed: !!p.removed,
      protected: !!p.password,
      expires: p.paid ? Number(p.paid) + 90 * 86400000 : null,
      canEdit:
        !p.removed &&
        (['draft', 'ordered'].includes(p.status) ||
          (p.status === 'published' && Date.now() < Number(p.paid) + 86400000)),
    });
  } catch (e) {
    return error(e);
  }
}
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireOrigin(req);
    const { id } = await params;
    await owned(req, id);
    const auth = req.headers.get('authorization')!.replace(/^Bearer /, '');
    const r = json({ ok: true });
    r.cookies.set(`owner_${id}`, auth, { ...secureCookie, maxAge: 3600 });
    return r;
  } catch (e) {
    return error(e);
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireOrigin(req);
    const { id } = await params;
    const p = await owned(req, id);
    if (
      p.removed ||
      !(
        ['draft', 'ordered'].includes(p.status) ||
        (p.status === 'published' && Date.now() < Number(p.paid) + 86400000)
      )
    )
      throw new Error('The 24-hour editing window has closed.');
    const body = await req.json();
    const v = draftSchema.parse(body);
    if (v.email !== p.email)
      throw new Error('The delivery email cannot be changed.');
    const old = parseContent(p);
    if (v.content.photos.some((k) => !old.photos.includes(k)))
      throw new Error('Photo does not belong to this purchase.');
    const password = body.keepPassword
      ? p.password
      : v.password
        ? hashPassword(v.password)
        : '';
    await sql('UPDATE purchases SET content=?,password=? WHERE id=?', [
      JSON.stringify(v.content),
      password,
      id,
    ]);
    for (const k of old.photos.filter((k) => !v.content.photos.includes(k))) {
      await removePhoto(k);
      await sql('DELETE FROM photo_records WHERE key=?', [k]);
    }
    return json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireOrigin(req);
    const { id } = await params;
    const p = await owned(req, id);
    await sql('UPDATE purchases SET removed=1 WHERE id=?', [id]);
    for (const k of parseContent(p).photos) {
      await removePhoto(k);
      await sql('DELETE FROM photo_records WHERE key=?', [k]);
    }
    await sql('UPDATE purchases SET content=?,password=? WHERE id=?', [
      JSON.stringify({
        ...parseContent(p),
        sender: '',
        recipient: '',
        message: '',
        finalNote: '',
        photos: [],
        purged: true,
      }),
      '',
      id,
    ]);
    await sql('DELETE FROM mail_jobs WHERE purchase_id=?', [id]);
    return json({ ok: true });
  } catch (e) {
    return error(e);
  }
}
