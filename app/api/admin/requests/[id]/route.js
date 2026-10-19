import { authorize } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, dbResult, ApiError, body } from '@/lib/api';
import { uuid } from '@/lib/validation';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
export const PATCH = endpoint(async (request, { params }) => {
  const admin = await authorize(request, true);
  const id = uuid.parse(params.id);
  const { decision } = await body(request, z.object({ decision: z.enum(['approved', 'rejected']) }).strict());
  const decidedAt = new Date().toISOString();
  const changes = decision === 'approved'
    ? { approval_status: 'approved', is_approved: true, approved_at: decidedAt, approved_by: admin.id, rejected_at: null, rejected_by: null }
    : { approval_status: 'rejected', is_approved: false, approved_at: null, approved_by: null, rejected_at: decidedAt, rejected_by: admin.id };
  const updated = dbResult(await db().from('leave_requests').update(changes).eq('id', id).eq('approval_status', 'pending').select().maybeSingle());
  if (!updated) throw new ApiError(409, 'ไม่พบคำร้องหรือมีผู้พิจารณาไปแล้ว');
  return json({ request: updated });
});
