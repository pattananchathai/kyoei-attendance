import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifySignature(raw, signature, secret) {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(raw).digest();
  const actual = Buffer.from(signature, 'base64');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
