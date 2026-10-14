import { z } from 'zod';
export const lineId = z.string().regex(/^U[0-9a-f]{32}$/);
export const uuid = z.string().uuid();
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'วันที่ไม่ถูกต้อง');
export const attendanceSchema = z.object({ check_type: z.enum(['CHECK_IN', 'CHECK_OUT']), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracy: z.number().min(0).max(10000) }).strict();
const reason = z.string().trim().min(1).max(2000);
export const leaveSchema = z.discriminatedUnion('request_type', [
  z.object({ request_type: z.literal('ลางาน'), request_date: dateString, leave_type: z.enum(['ลาป่วย', 'ลาพักร้อน', 'ลากิจ']), leave_reason: reason }).strict(),
  z.object({ request_type: z.literal('ขอ OT'), request_date: dateString, ot_reason: reason }).strict()
]);
export const employeeSchema = z.object({ line_user_id: lineId, first_name: z.string().trim().min(1).max(100), last_name: z.string().trim().min(1).max(100), role: z.enum(['employee', 'admin']), status: z.enum(['active', 'inactive']) }).strict();
