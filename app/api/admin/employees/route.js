import { authorize } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, body, dbResult, ApiError } from '@/lib/api';
import { employeeSchema } from '@/lib/validation';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
export const GET = endpoint(async (request) => {
  await authorize(request, true);
  const page = z.coerce.number().int().min(0).max(10000).parse(new URL(request.url).searchParams.get('page') || 0);
  const result = await db().from('employees').select('*', { count: 'exact' }).order('first_name').order('id').range(page * 50, page * 50 + 49);
  return json({ employees: dbResult(result), count: result.count });
});
export const POST = endpoint(async (request) => {
  await authorize(request, true);
  const data = await body(request, employeeSchema);
  const result = await db().from('employees').insert(data).select().single();
  if (result.error?.code === '23505') throw new ApiError(409, 'รหัสผู้ใช้ LINE นี้มีรายชื่อแล้ว');
  return json({ employee: dbResult(result) }, 201);
});
