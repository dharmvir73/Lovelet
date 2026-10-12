import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHmac } from 'node:crypto';
import { digest, equals, appUrl } from './security';
import { purchase, type Purchase } from './db';
export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export function error(e: unknown) {
  const message =
    e instanceof Error ? e.message : 'Unable to complete this request.';
  if (message.includes('Too many')) return json({ error: message }, 429);
  if (message.includes('Unauthorized'))
    return json({ error: 'This management link is invalid.' }, 401);
  if (message.includes('configured') || message.includes('unavailable'))
    return json({ error: message }, 503);
  return json(
    {
      error:
        message.length < 200
          ? message
          : 'Please check your details and try again.',
    },
    400,
  );
}
export async function owned(req: Request, id: string) {
  const p = await purchase(id);
  const value =
    req.headers.get('authorization')?.replace(/^Bearer /, '') ||
    (await cookies()).get(`owner_${id}`)?.value;
  if (!p || !value || !equals(digest(value), p.edit_hash))
    throw new Error('Unauthorized');
  return p;
}
export const active = (p: Purchase) =>
  p.status === 'published' &&
  !p.removed &&
  p.paid !== null &&
  Date.now() < Number(p.paid) + 90 * 86400000;
export function accessValue(p: Purchase) {
  const secret = process.env.APP_SECRET;
  if (!secret && process.env.NODE_ENV === 'production')
    throw new Error('APP_SECRET is not configured.');
  return createHmac('sha256', secret || 'development-only-lovelet')
    .update(p.id + p.password)
    .digest('hex');
}
export async function allowed(p: Purchase) {
  return (
    !p.password ||
    equals(
      (await cookies()).get(`access_${p.slug}`)?.value || '',
      accessValue(p),
    )
  );
}
export async function admin(req?: Request) {
  const raw =
    req?.headers.get('authorization')?.replace(/^Bearer /, '') ||
    (await cookies()).get('lovelet_admin')?.value ||
    '';
  if (!process.env.ADMIN_TOKEN || !equals(raw, process.env.ADMIN_TOKEN))
    throw new Error('Unauthorized');
}
export const secureCookie = {
  httpOnly: true,
  secure: new URL(appUrl()).protocol === 'https:',
  sameSite: 'strict' as const,
  path: '/',
};
