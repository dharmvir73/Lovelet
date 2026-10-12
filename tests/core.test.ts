import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  token,
  digest,
  hashPassword,
  checkPassword,
  verifySignature,
  isDemo,
} from '../lib/security';
import { contentSchema, draftSchema } from '../lib/validation';
import { demoContent, PRICE } from '../lib/content';
import { sql, purchase, rateLimit, type Purchase } from '../lib/db';
import {
  validatePayment,
  publish,
  reconcile,
  checkoutValid,
} from '../lib/payments';
import { cleanup } from '../lib/cleanup';
import { storePhoto, readPhoto } from '../lib/storage';
process.env.DATABASE_URL = '';
process.env.S3_BUCKET = '';
process.env.RESEND_API_KEY = '';
process.env.MAIL_FROM = '';
process.env.DATA_DIR = '.data/core-tests';
const good = { ...demoContent, occasion: 'Just because' };
async function make(overrides: Partial<Purchase> = {}) {
  const id = token();
  const p = {
    id,
    email: 'test@example.com',
    content: JSON.stringify(good),
    password: '',
    edit_hash: digest(token()),
    upload_hash: digest(token()),
    slug: null,
    status: 'ordered',
    order_id: `order_${id}`,
    payment_id: null,
    created: Date.now(),
    paid: null,
    removed: 0,
    refund_id: null,
    ...overrides,
  };
  await sql(
    'INSERT INTO purchases (id,email,content,password,edit_hash,upload_hash,slug,status,order_id,payment_id,created,paid,removed,refund_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    Object.values(p),
  );
  return p as Purchase;
}
test('random links have 192 bits of entropy; management hashes and password verification', () => {
  const a = token();
  assert.match(a, /^[a-f0-9]{48}$/);
  assert.notEqual(a, token());
  assert.notEqual(digest(a), a);
  const hash = hashPassword('something private');
  assert.equal(checkPassword('something private', hash), true);
  assert.equal(checkPassword('wrong', hash), false);
  assert.notEqual(hash, hashPassword('something private'));
});
test('rejects empty messages, invalid photo paths, excessive photos and missing consent', () => {
  assert.equal(contentSchema.safeParse(good).success, true);
  for (const v of [
    { ...good, message: 'x' },
    { ...good, photos: ['../private'] },
    { ...good, photos: Array(6).fill(`${token()}.jpg`) },
  ])
    assert.equal(contentSchema.safeParse(v).success, false);
  assert.equal(
    draftSchema.safeParse({
      content: good,
      email: 'user@example.com',
      consent: false,
    }).success,
    false,
  );
});
test('verifies checkout and raw webhook signatures; rejects tampering', () => {
  const secret = 'test-secret',
    body = 'order_1|pay_1';
  const sig = createHmac('sha256', secret).update(body).digest('hex');
  assert.equal(verifySignature(body, sig, secret), true);
  assert.equal(verifySignature('order_2|pay_1', sig, secret), false);
  assert.equal(verifySignature(body, 'bad', secret), false);
  process.env.RAZORPAY_KEY_SECRET = secret;
  assert.equal(checkoutValid('order_1', 'pay_1', sig), true);
});
test('publication requires captured payment, exact order, amount and currency', async () => {
  const p = await make();
  const correct = {
    id: token(),
    order_id: p.order_id!,
    amount: PRICE,
    currency: 'INR',
    status: 'captured',
  };
  assert.doesNotThrow(() => validatePayment(p, correct));
  for (const bad of [
    { ...correct, status: 'authorized' },
    { ...correct, amount: 199 },
    { ...correct, currency: 'USD' },
    { ...correct, order_id: 'someone-else' },
  ])
    assert.throws(() => validatePayment(p, bad));
  await sql('DELETE FROM purchases WHERE id=?', [p.id]);
});
test('duplicate and concurrent callbacks return exactly the same published page', async () => {
  process.env.DEMO_MODE = 'true';
  const p = await make();
  const payment = {
    id: token(),
    order_id: p.order_id!,
    amount: PRICE,
    currency: 'INR',
    status: 'captured',
  };
  const results = await Promise.all(
    Array.from({ length: 5 }, () => publish(p.id, payment)),
  );
  assert.equal(new Set(results.map((r) => r.slug)).size, 1);
  assert.equal(new Set(results.map((r) => r.paid)).size, 1);
  await assert.rejects(publish(p.id, { ...payment, id: token() }));
  await sql('DELETE FROM purchases WHERE id=?', [p.id]);
});
test('browser-return recovery finds captured payment through Razorpay', async () => {
  process.env.DEMO_MODE = 'false';
  process.env.RAZORPAY_KEY_ID = 'test_key';
  process.env.RAZORPAY_KEY_SECRET = 'test_secret';
  const p = await make();
  const fetchOriginal = global.fetch;
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        items: [
          {
            id: 'pay_recovery_' + p.id,
            order_id: p.order_id,
            amount: PRICE,
            currency: 'INR',
            status: 'captured',
          },
        ],
      }),
      { status: 200 },
    );
  try {
    const r = await reconcile(p);
    assert.equal(r.status, 'published');
    assert.ok(r.slug);
  } finally {
    global.fetch = fetchOriginal;
    await sql('DELETE FROM purchases WHERE id=?', [p.id]);
  }
});
test('uncertain order creation recovers order by receipt without creating a duplicate', async () => {
  process.env.DEMO_MODE = 'false';
  const p = await make({ status: 'ordering', order_id: null });
  const original = global.fetch;
  let calls = 0;
  global.fetch = async (input, init) => {
    assert.equal(init?.method, 'GET');
    calls++;
    return new Response(
      JSON.stringify(
        calls === 1
          ? {
              items: [
                {
                  id: 'order_recovered_' + p.id,
                  receipt: p.id.slice(0, 40),
                  amount: PRICE,
                  currency: 'INR',
                },
              ],
            }
          : { items: [] },
      ),
    );
  };
  try {
    const r = await reconcile(p);
    assert.equal(r.order_id, 'order_recovered_' + p.id);
    assert.equal(r.status, 'ordered');
  } finally {
    global.fetch = original;
    await sql('DELETE FROM purchases WHERE id=?', [p.id]);
  }
});
test('expired pages and abandoned drafts lose personal content and photos', async () => {
  const key = `${token()}.jpg`;
  await storePhoto(key, Buffer.from([255, 216, 255, 217]));
  const p = await make({
    content: JSON.stringify({ ...good, photos: [key] }),
    paid: Date.now() - 91 * 86400000,
    status: 'published',
    slug: token(),
  });
  const draft = await make({
    status: 'draft',
    order_id: null,
    created: Date.now() - 8 * 86400000,
  });
  await cleanup();
  const r = await purchase(p.id);
  assert.equal(r?.removed, 1);
  assert.equal(JSON.parse(r!.content).message, '');
  assert.equal((await purchase(draft.id))?.removed, 1);
  await assert.rejects(readPhoto(key));
  await sql('DELETE FROM purchases WHERE id IN (?,?)', [p.id, draft.id]);
});
test('rate limits are atomic under concurrent requests', async () => {
  const key = 'test:' + token();
  const results = await Promise.allSettled(
    Array.from({ length: 6 }, () => rateLimit(key, 3)),
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
  await sql('DELETE FROM rate_limits WHERE key=?', [key]);
});
test('demo payments are never enabled in production', () => {
  const previous = process.env.NODE_ENV;
  process.env.DEMO_MODE = 'true';
  (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
  assert.equal(isDemo(), false);
  (process.env as Record<string, string | undefined>).NODE_ENV = previous;
});
test('verified captured webhooks publish once; tampered and underpaid events do not publish', async () => {
  process.env.DEMO_MODE = 'false';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook-test-secret';
  const { POST } = await import('../app/api/webhooks/razorpay/route');
  const p = await make();
  const original = global.fetch;
  let amount = PRICE;
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        id: 'pay_webhook_' + p.id,
        order_id: p.order_id,
        amount,
        currency: 'INR',
        status: 'captured',
      }),
    );
  const body = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: { entity: { id: 'pay_webhook_' + p.id, order_id: p.order_id } },
    },
  });
  const signature = createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  const req = (sig = signature) =>
    new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': sig },
      body,
    });
  try {
    assert.equal((await POST(req('invalid'))).status, 401);
    amount = 199;
    assert.equal((await POST(req())).status, 503);
    assert.equal((await purchase(p.id))?.slug, null);
    amount = PRICE;
    assert.equal((await POST(req())).status, 200);
    const first = (await purchase(p.id))?.slug;
    assert.ok(first);
    assert.equal((await POST(req())).status, 200);
    assert.equal((await purchase(p.id))?.slug, first);
  } finally {
    global.fetch = original;
    await sql('DELETE FROM purchases WHERE id=?', [p.id]);
  }
});
test('parallel checkout requests reserve one external order', async () => {
  process.env.DEMO_MODE = 'false';
  process.env.RESEND_API_KEY = 'test-mail-key';
  process.env.MAIL_FROM = 'test@example.com';
  process.env.BUSINESS_NAME = 'Test';
  process.env.BUSINESS_ADDRESS = 'Test address';
  process.env.SUPPORT_EMAIL = 'test@example.com';
  const edit = token();
  const p = await make({
    status: 'draft',
    order_id: null,
    edit_hash: digest(edit),
  });
  const { POST } = await import('../app/api/orders/route');
  const original = global.fetch;
  let posts = 0;
  let created = false;
  global.fetch = async (_url, options) => {
    if (options?.method === 'POST') {
      posts++;
      await new Promise((r) => setTimeout(r, 20));
      created = true;
      return new Response(
        JSON.stringify({
          id: 'order_parallel_' + p.id,
          amount: PRICE,
          currency: 'INR',
        }),
      );
    }
    return new Response(
      JSON.stringify({
        items: created
          ? [
              {
                id: 'order_parallel_' + p.id,
                amount: PRICE,
                currency: 'INR',
                receipt: p.id.slice(0, 40),
              },
            ]
          : [],
      }),
    );
  };
  const req = () =>
    new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:3000',
        Authorization: `Bearer ${edit}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: p.id }),
    });
  try {
    const results = await Promise.all([POST(req()), POST(req()), POST(req())]);
    assert.equal(posts, 1);
    assert.ok(results.some((r) => r.status === 200));
    const retry = await POST(req());
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).orderId, 'order_parallel_' + p.id);
    assert.equal(posts, 1);
  } finally {
    global.fetch = original;
    process.env.RESEND_API_KEY = '';
    process.env.MAIL_FROM = '';
    await sql('DELETE FROM purchases WHERE id=?', [p.id]);
  }
});
test('24-hour editing deadline is enforced on the server, while hosting lasts 90 days', async () => {
  const { PATCH } = await import('../app/api/purchases/[id]/route');
  const { active } = await import('../lib/http');
  const edit = token();
  const p = await make({
    status: 'published',
    paid: Date.now() - 25 * 3600000,
    slug: token(),
    edit_hash: digest(edit),
  });
  assert.equal(active(p), true);
  assert.equal(active({ ...p, paid: Date.now() - 91 * 86400000 }), false);
  const req = new Request(`http://localhost:3000/api/purchases/${p.id}`, {
    method: 'PATCH',
    headers: {
      Origin: 'http://localhost:3000',
      Authorization: `Bearer ${edit}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: good, email: p.email, consent: true }),
  });
  const r = await PATCH(req, { params: Promise.resolve({ id: p.id }) });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /editing window/);
  await sql('DELETE FROM purchases WHERE id=?', [p.id]);
});
test('failed purchase emails remain queued; retry sends real line breaks and erases the management token', async () => {
  const { deliverPurchase } = await import('../lib/mail');
  process.env.DEMO_MODE = 'false';
  process.env.RESEND_API_KEY = 'test-mail-key';
  process.env.MAIL_FROM = 'test@example.com';
  const p = await make({
    status: 'published',
    slug: token(),
    paid: Date.now(),
  });
  const edit = token();
  await sql('INSERT INTO mail_jobs (purchase_id,edit_token) VALUES (?,?)', [
    p.id,
    edit,
  ]);
  const original = global.fetch;
  let succeeds = false;
  global.fetch = async (_url, init) => {
    const data = JSON.parse(String(init?.body));
    assert.ok(data.text.includes('\n'));
    assert.equal(data.text.includes('\\n'), false);
    assert.ok(data.text.includes(`/manage/${p.id}#${edit}`));
    assert.equal(
      (init?.headers as Record<string, string>)['Idempotency-Key'],
      `purchase-${p.id}`,
    );
    return new Response('{}', { status: succeeds ? 200 : 503 });
  };
  try {
    await assert.rejects(deliverPurchase(p.id));
    assert.equal(
      (
        await sql<{ sent: number }>(
          'SELECT sent FROM mail_jobs WHERE purchase_id=?',
          [p.id],
        )
      )[0].sent,
      0,
    );
    succeeds = true;
    await deliverPurchase(p.id);
    const job = (
      await sql<{ sent: number; edit_token: string }>(
        'SELECT sent,edit_token FROM mail_jobs WHERE purchase_id=?',
        [p.id],
      )
    )[0];
    assert.equal(job.sent, 1);
    assert.equal(job.edit_token, '');
  } finally {
    global.fetch = original;
    process.env.RESEND_API_KEY = '';
    process.env.MAIL_FROM = '';
    await sql('DELETE FROM mail_jobs WHERE purchase_id=?', [p.id]);
    await sql('DELETE FROM purchases WHERE id=?', [p.id]);
  }
});
