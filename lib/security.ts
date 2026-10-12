import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from 'node:crypto';
export const token = () => randomBytes(24).toString('hex');
export const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export function equals(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function hashPassword(value: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(value, salt, 32).toString('hex')}`;
}
export function checkPassword(value: string, stored: string) {
  const [salt, hash] = stored.split(':');
  return (
    !!salt &&
    !!hash &&
    equals(scryptSync(value, salt, 32).toString('hex'), hash)
  );
}
export function verifySignature(
  body: string,
  signature: string,
  secret: string,
) {
  return (
    /^[a-f0-9]{64}$/.test(signature) &&
    equals(createHmac('sha256', secret).update(body).digest('hex'), signature)
  );
}
export const appUrl = () =>
  (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
export const isDemo = () =>
  process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production';
export function requireOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(appUrl()).origin)
    throw new Error('Request origin is not allowed.');
}
