import { test, expect } from '@playwright/test';
import { demoContent } from '../../lib/content';
const origin = { Origin: 'http://localhost:3000' };
test('mobile customer creates a password-protected Lovelet, shares, edits and removes it', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /For the words/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('link', { name: 'Create your Lovelet' }).click();
  await page.getByRole('button', { name: /Memory Lane/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Avery');
  await page.getByLabel('Their name', { exact: true }).fill('Sam');
  await page
    .getByLabel('Your heartfelt message')
    .fill(
      'I’m sorry for not listening. You deserve care and respect. I’ll take the time to show that through my actions.',
    );
  await page
    .getByLabel('One final note')
    .fill('Thank you for every little moment.');
  // PNG compressed to JPEG and uploaded; the original photo stays private until publication.
  const png = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const c = canvas.getContext('2d')!;
      c.fillStyle = '#cbb99a';
      c.fillRect(0, 0, 400, 300);
      c.fillStyle = '#718675';
      c.fillRect(0, 160, 400, 140);
      return canvas.toDataURL('image/png').split(',')[1];
    }),
    'base64',
  );
  await page
    .getByLabel('Add photos', { exact: true })
    .setInputFiles({ name: 'memory.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByAltText('Photo 1')).toBeVisible();
  await page.getByRole('button', { name: 'Open full preview' }).click();
  await expect(
    page.getByRole('button', { name: 'Open your surprise' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open your surprise' }).click();
  await expect(page.getByAltText(/A memory from Avery/)).toBeVisible();
  await page.getByRole('button', { name: 'Next scene' }).click();
  await expect(
    page.getByRole('dialog').getByText(/I’m sorry for not listening/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close preview' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .getByLabel('Your email', { exact: true })
    .fill('avery@example.com');
  await page.getByLabel('Page password').fill('our-little-world');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create demo Lovelet' }).click();
  await expect(
    page.getByRole('heading', { name: /Your Lovelet is ready/ }),
  ).toBeVisible();
  await expect(
    page.getByText('Demo purchase · No money was charged.'),
  ).toBeVisible();
  const share = await page.getByLabel('Shareable link').inputValue();
  const manage = await page
    .getByRole('link', { name: 'Manage this Lovelet' })
    .getAttribute('href');
  expect(manage).toBeTruthy();
  const recipient = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const recipientPage = await recipient.newPage();
  await recipientPage.goto(share);
  await expect(
    recipientPage.getByRole('heading', { name: /Sam, a surprise is waiting/ }),
  ).toBeVisible();
  await recipientPage.getByLabel('Page password').fill('wrong');
  await recipientPage.getByRole('button', { name: 'Open my surprise' }).click();
  await expect(
    recipientPage.getByRole('alert').filter({ hasText: 'did not match' }),
  ).toContainText('did not match');
  await recipientPage.getByLabel('Page password').fill('our-little-world');
  await recipientPage.getByRole('button', { name: 'Open my surprise' }).click();
  await recipientPage
    .getByRole('button', { name: 'Open your surprise' })
    .click();
  const photo = recipientPage.getByAltText(/A memory from Avery/);
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await recipientPage.getByRole('button', { name: 'Next scene' }).click();
  await expect(
    recipientPage.getByText(/I’m sorry for not listening/),
  ).toBeVisible();
  await page.goto(manage!);
  await expect(
    page.getByRole('heading', { name: /Make it feel personal/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: '2 Your story' }).click();
  await page
    .getByLabel('Your heartfelt message')
    .fill(
      'Thank you for listening. I’m learning to show up with more care, one day at a time.',
    );
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toContainText('changes are saved');
  await recipientPage.reload();
  await recipientPage
    .getByRole('button', { name: 'Open your surprise' })
    .click();
  await recipientPage.getByRole('button', { name: 'Next scene' }).click();
  await expect(
    recipientPage.getByText(/Thank you for listening/),
  ).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Permanently remove this Lovelet' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Your page has been removed.' }),
  ).toBeVisible();
  await recipientPage.reload();
  await expect(
    recipientPage.getByRole('heading', { name: /is unavailable/ }),
  ).toBeVisible();
  await recipient.close();
});
test('API refuses unowned edits, invalid signatures and duplicate publication creates one link', async ({
  request,
}) => {
  const draft = await request.post('/api/drafts', {
    headers: origin,
    data: { content: demoContent, email: 'api@example.com', consent: true },
  });
  expect(draft.status()).toBe(201);
  const { id, editToken } = await draft.json();
  const auth = { ...origin, Authorization: `Bearer ${editToken}` };
  expect((await request.get(`/api/purchases/${id}`)).status()).toBe(401);
  expect(
    (
      await request.patch(`/api/purchases/${id}`, {
        headers: origin,
        data: { content: demoContent, email: 'api@example.com', consent: true },
      })
    ).status(),
  ).toBe(401);
  const order = await request.post('/api/orders', {
    headers: auth,
    data: { id },
  });
  expect(order.ok()).toBeTruthy();
  expect(
    (
      await request.post('/api/verify', {
        headers: auth,
        data: {
          id,
          razorpay_order_id: (await order.json()).orderId,
          razorpay_payment_id: 'fake',
          razorpay_signature: 'fake',
        },
      })
    ).ok(),
  ).toBeFalsy();
  const first = await request.post('/api/demo', {
    headers: auth,
    data: { id },
  });
  expect(first.ok()).toBeTruthy();
  const second = await request.post('/api/demo', {
    headers: auth,
    data: { id },
  });
  expect((await first.json()).slug).toBe((await second.json()).slug);
  expect(
    (
      await request.post('/api/webhooks/razorpay', {
        data: { event: 'payment.captured' },
        headers: { 'x-razorpay-signature': 'bad' },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post('/api/drafts', {
        headers: { Origin: 'https://attacker.example' },
        data: { content: demoContent, email: 'api@example.com', consent: true },
      })
    ).ok(),
  ).toBeFalsy();
  expect((await request.get('/api/admin')).status()).toBe(401);
  await request.delete(`/api/purchases/${id}`, { headers: auth });
});
test('demo plays original melody only after envelope is opened, supports mute and reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  await expect(page.getByRole('button', { name: 'Mute music' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open your surprise' }).click();
  await expect(page.getByRole('button', { name: 'Mute music' })).toBeVisible();
  await page.getByRole('button', { name: 'Mute music' }).click();
  await expect(page.getByRole('button', { name: 'Play music' })).toBeVisible();
});
test('admin can review orders and retry cleanup', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('Administrator token').fill('e2e-admin-token');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page
    .getByRole('button', { name: 'Retry deliveries & clean expired content' })
    .click();
  await expect(page.getByRole('status')).toContainText('Cleanup completed');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByLabel('Administrator token')).toBeVisible();
});
