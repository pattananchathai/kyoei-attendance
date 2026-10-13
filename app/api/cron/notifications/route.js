import { timingSafeEqual } from 'node:crypto';
import { endpoint, json, ApiError } from '@/lib/api';
import { retryNotifications } from '@/lib/line';
export const dynamic = 'force-dynamic';
export const GET = endpoint(async (request) => {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || secret.length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new ApiError(401, 'Unauthorized');
  return json(await retryNotifications());
});
