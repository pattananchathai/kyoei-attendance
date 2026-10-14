import { authorize } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, body, dbResult, ApiError } from '@/lib/api';
import { attendanceSchema } from '@/lib/validation';
import { geofenceConfig, checkGeofence } from '@/lib/geofence';
import { checkTime } from '@/lib/timeCheck';
import { deliverNotification } from '@/lib/line';
export const dynamic = 'force-dynamic';
export const POST = endpoint(async (request) => {
  const employee = await authorize(request);
  const data = await body(request, attendanceSchema);
  let config;
  try { config = geofenceConfig(); } catch (error) { throw new ApiError(503, error.message); }
  const location = checkGeofence(data.latitude, data.longitude, data.accuracy, config);
  if (!location.allowed) throw new ApiError(403, location.message);
  const time = checkTime(data.check_type);
  if (!time.allowed) throw new ApiError(400, time.message);
  const result = await db().rpc('record_attendance', { p_user: employee.line_user_id, p_type: data.check_type, p_lat: data.latitude, p_lon: data.longitude, p_accuracy: data.accuracy });
  if (result.error) {
    const message = result.error.message;
    if (message.includes('ALREADY_RECORDED') || result.error.code === '23505') throw new ApiError(409, 'บันทึกรายการนี้แล้วในวันนี้ กรุณาตรวจสอบประวัติ');
    if (message.includes('CHECK_IN_REQUIRED')) throw new ApiError(400, 'กรุณาเข้างานก่อนเลิกงาน');
    if (message.includes('TOO_EARLY')) throw new ApiError(400, 'ยังไม่ถึงเวลาที่อนุญาต');
    if (message.includes('EMPLOYEE_INACTIVE')) throw new ApiError(403, 'รายชื่อพนักงานไม่พร้อมใช้งาน');
    throw result.error;
  }
  // ความล้มเหลวของ LINE ต้องไม่ทำให้ผู้ใช้คิดว่าการลงเวลาล้มเหลวและกดซ้ำ
  let notificationSent = false;
  try {
    const job = dbResult(await db().from('line_notifications').select('id').eq('attendance_id', result.data.id).single());
    notificationSent = await deliverNotification(job.id);
  } catch { console.error('ข้อความ LINE รอส่งซ้ำ'); }
  return json({ attendance: result.data, notificationSent }, 201);
});
