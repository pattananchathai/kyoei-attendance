import { authorize } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, body, dbResult, ApiError } from '@/lib/api';
import { leaveSchema } from '@/lib/validation';
export const dynamic = 'force-dynamic';
export const POST = endpoint(async (request) => {
  const employee = await authorize(request);
  const data = await body(request, leaveSchema);
  const result = await db().from('leave_requests').insert({ ...data, line_user_id: employee.line_user_id }).select().single();
  if (result.error?.code === '23505') throw new ApiError(409, 'มีคำร้องประเภทนี้สำหรับวันที่เลือกแล้ว');
  return json({ request: dbResult(result) }, 201);
});
