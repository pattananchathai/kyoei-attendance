import { authorize } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, dbResult } from '@/lib/api';
import { retryNotifications } from '@/lib/line';
export const dynamic = 'force-dynamic';
export const GET = endpoint(async (request) => {
  await authorize(request, true);
  return json({ notifications: dbResult(await db().from('line_notifications').select('id,status,attempts,last_error,created_at,line_user_id').neq('status', 'sent').order('created_at').limit(50)) });
});
export const POST = endpoint(async (request) => { await authorize(request, true); return json(await retryNotifications()); });
