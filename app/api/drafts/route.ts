import { draftSchema } from '@/lib/validation';
import { token, digest, hashPassword, requireOrigin } from '@/lib/security';
import { sql, rateLimit, track } from '@/lib/db';
import { json, error } from '@/lib/http';
export async function POST(req: Request) {
  try {
    requireOrigin(req);
    await rateLimit('draft:global', 200);
    const v = draftSchema.parse(await req.json());
    if (v.content.photos.length)
      throw new Error('Upload photos after saving the draft.');
    const id = token(),
      editToken = token();
    await sql(
      'INSERT INTO purchases (id,email,content,password,edit_hash,upload_hash,created) VALUES (?,?,?,?,?,?,?)',
      [
        id,
        v.email,
        JSON.stringify(v.content),
        v.password ? hashPassword(v.password) : '',
        digest(editToken),
        digest(editToken),
        Date.now(),
      ],
    );
    await sql('INSERT INTO mail_jobs (purchase_id,edit_token) VALUES (?,?)', [
      id,
      editToken,
    ]);
    await track('drafts');
    return json({ id, editToken }, 201);
  } catch (e) {
    return error(e);
  }
}
