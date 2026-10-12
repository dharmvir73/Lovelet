import { sql, parseContent, type Purchase } from './db';
import { removePhoto } from './storage';
import { deliverPurchase } from './mail';
import { reconcile } from './payments';
export async function cleanup() {
  const now = Date.now();
  let removed = 0,
    recovered = 0,
    failed = 0;
  const pending = await sql<Purchase>(
    "SELECT * FROM purchases WHERE status IN ('ordering','ordered') AND removed=0 AND created>? LIMIT 100",
    [now - 7 * 86400000],
  );
  for (const p of pending) {
    try {
      const r = await reconcile(p);
      if (r.status === 'published') recovered++;
    } catch {
      failed++;
    }
  }
  // Track replaced and failed-upload assets separately so storage failures can be retried.
  const assets = await sql<{
    key: string;
    content: string;
    removed: number;
    paid: number | null;
    created: number;
    asset_created: number;
  }>(
    `SELECT f.key,p.content,p.removed,p.paid,p.created,f.created AS asset_created FROM photo_records f JOIN purchases p ON p.id=f.purchase_id LIMIT 1000`,
  );
  for (const a of assets) {
    if (
      a.removed ||
      (a.paid && now - Number(a.paid) > 90 * 86400000) ||
      (!a.paid && now - Number(a.created) > 7 * 86400000) ||
      (!JSON.parse(a.content).photos.includes(a.key) &&
        now - Number(a.asset_created) > 3600000)
    ) {
      try {
        await removePhoto(a.key);
        await sql('DELETE FROM photo_records WHERE key=?', [a.key]);
      } catch {
        failed++;
      }
    }
  }
  const rows = await sql<Purchase>(
    'SELECT * FROM purchases WHERE (removed=1 OR (paid IS NOT NULL AND paid<?) OR (paid IS NULL AND created<?)) AND content NOT LIKE ?',
    [now - 90 * 86400000, now - 7 * 86400000, '%"purged":true%'],
  );
  for (const p of rows) {
    try {
      for (const key of parseContent(p).photos) await removePhoto(key);
      await sql(
        'UPDATE purchases SET content=?,password=?,removed=1 WHERE id=?',
        [
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
          p.id,
        ],
      );
      await sql('DELETE FROM mail_jobs WHERE purchase_id=?', [p.id]);
      removed++;
    } catch {
      failed++;
    }
  }
  const mail = await sql<{ purchase_id: string }>(
    'SELECT m.purchase_id FROM mail_jobs m JOIN purchases p ON p.id=m.purchase_id WHERE m.sent=0 AND p.status=? AND p.removed=0 LIMIT 100',
    ['published'],
  );
  for (const r of mail) {
    try {
      await deliverPurchase(r.purchase_id);
    } catch {
      failed++;
    }
  }
  await sql('DELETE FROM rate_limits WHERE reset < ?', [now]);
  return { removed, recovered, failed };
}
