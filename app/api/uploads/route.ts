import { owned, json, error } from '@/lib/http';
import { requireOrigin, token } from '@/lib/security';
import { sql, parseContent } from '@/lib/db';
import { storePhoto } from '@/lib/storage';
export async function POST(req: Request) {
  try {
    requireOrigin(req);
    if (Number(req.headers.get('content-length') || 0) > 2200000)
      throw new Error('Please use an image under 2 MB.');
    const id = new URL(req.url).searchParams.get('id') || '';
    const p = await owned(req, id);
    if (
      p.removed ||
      !(
        ['draft', 'ordered'].includes(p.status) ||
        (p.status === 'published' && Date.now() < Number(p.paid) + 86400000)
      )
    )
      throw new Error('Editing is no longer available.');
    const content = parseContent(p);
    if (content.photos.length >= 5)
      throw new Error('You can add up to 5 photos.');
    const form = await req.formData();
    const file = form.get('photo');
    if (!(file instanceof File) || file.size > 2000000)
      throw new Error('Please use an image under 2 MB.');
    const data = Buffer.from(await file.arrayBuffer());
    if (
      file.type !== 'image/jpeg' ||
      data[0] !== 255 ||
      data[1] !== 216 ||
      data[2] !== 255
    )
      throw new Error('Please upload a JPEG photo.');
    const key = `${token()}.jpg`;
    await storePhoto(key, data);
    await sql(
      'INSERT INTO photo_records (key,purchase_id,created) VALUES (?,?,?)',
      [key, id, Date.now()],
    );
    // Compare-and-swap prevents parallel uploads from exceeding the five-photo limit.
    const updated = await sql<{ id: string }>(
      'UPDATE purchases SET content=? WHERE id=? AND content=? AND removed=0 RETURNING id',
      [
        JSON.stringify({ ...content, photos: [...content.photos, key] }),
        id,
        p.content,
      ],
    );
    if (!updated.length) {
      const { removePhoto } = await import('@/lib/storage');
      await removePhoto(key);
      await sql('DELETE FROM photo_records WHERE key=?', [key]);
      throw new Error('Please upload one photo at a time.');
    }
    return json({ key }, 201);
  } catch (e) {
    return error(e);
  }
}
