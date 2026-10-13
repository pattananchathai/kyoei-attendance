import { authorize } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, dbResult, ApiError } from '@/lib/api';
import { uuid } from '@/lib/validation';
export const dynamic = 'force-dynamic';
export const DELETE = endpoint(async (request, { params }) => {
  const admin = await authorize(request, true);
  const id = uuid.parse(params.id);
  if (id === admin.id) throw new ApiError(400, 'ไม่สามารถลบบัญชีผู้ดูแลที่กำลังใช้งาน');
  // FK cascade ลบประวัติ คำร้อง และข้อความค้างของพนักงานใน transaction เดียว
  const deleted = dbResult(await db().from('employees').delete().eq('id', id).select('id'));
  if (!deleted.length) throw new ApiError(404, 'ไม่พบพนักงาน');
  return json({ deleted: true });
});
