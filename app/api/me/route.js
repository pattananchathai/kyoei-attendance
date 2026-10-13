import { identity } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, dbResult } from '@/lib/api';
export const dynamic = 'force-dynamic';
export const GET = endpoint(async (request) => {
  const line_user_id = await identity(request);
  const employee = dbResult(await db().from('employees').select('*').eq('line_user_id', line_user_id).maybeSingle());
  return json({ line_user_id, employee });
});
