import { authorize } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, dbResult, ApiError } from '@/lib/api';
import { uuid } from '@/lib/validation';
export const dynamic = 'force-dynamic';
export const PATCH = endpoint(async (request, { params }) => {
  const admin = await authorize(request, true);
  const id = uuid.parse(params.id);
  const updated = dbResult(await db().from('leave_requests').update({ is_approved: true, approved_at: new Date().toISOString(), approved_by: admin.id }).eq('id', id).eq('is_approved', false).select().maybeSingle());
  if (!updated) throw new ApiError(409, 'ไม่พบคำร้องหรืออนุมัติไปแล้ว');
  return json({ request: updated });
});
