import { authorize } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { endpoint, json, dbResult } from '@/lib/api';
import { z } from 'zod';
import { dateString, lineId } from '@/lib/validation';
import { bangkokDate } from '@/lib/timeCheck';
export const dynamic = 'force-dynamic';
export const GET = endpoint(async (request) => {
  const employee = await authorize(request);
  const params = new URL(request.url).searchParams;
  const admin = params.get('scope') === 'all' && employee.role === 'admin';
  const page = z.coerce.number().int().min(0).max(10000).parse(params.get('page') || 0);
  const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(params.get('month') || bangkokDate().slice(0, 7));
  const start = dateString.parse(`${month}-01`);
  const next = new Date(`${start}T00:00:00Z`); next.setUTCMonth(next.getUTCMonth() + 1);
  const end = next.toISOString().slice(0, 10);
  // อ่านตารางประวัติแยกกัน แล้วเติมชื่อพนักงานภายหลังเพื่อไม่ให้ PostgREST
  // เดาความสัมพันธ์ employees แบบกำกวม (leave_requests อ้าง employees หลาย FK)
  let logs = db()
    .from('attendance_logs')
    .select('*', { count: 'exact' })
    .gte('work_date', start)
    .lt('work_date', end)
    .order('timestamp', { ascending: false })
    .range(page * 50, page * 50 + 49);
  let leaves = db()
    .from('leave_requests')
    .select('*', { count: 'exact' })
    .gte('request_date', start)
    .lt('request_date', end)
    .order('request_date', { ascending: false })
    .order('id')
    .range(page * 50, page * 50 + 49);
  const user = admin ? (params.get('employee') ? lineId.parse(params.get('employee')) : null) : employee.line_user_id;
  if (user) { logs = logs.eq('line_user_id', user); leaves = leaves.eq('line_user_id', user); }
  const [a, b] = await Promise.all([logs, leaves]);
  const attendance = dbResult(a);
  const requests = dbResult(b);
  const lineUserIds = [...new Set([...attendance, ...requests].map((entry) => entry.line_user_id).filter(Boolean))];
  const employees = lineUserIds.length
    ? dbResult(await db().from('employees').select('line_user_id,first_name,last_name').in('line_user_id', lineUserIds))
    : [];
  const employeesByLineId = new Map(employees.map((entry) => [entry.line_user_id, entry]));
  const logsWithNames = attendance.map((entry) => ({
    ...entry,
    employees: employeesByLineId.get(entry.line_user_id) || null
  }));
  const requestsWithNames = requests.map((entry) => ({
    ...entry,
    employees: employeesByLineId.get(entry.line_user_id) || null
  }));
  return json({ logs: logsWithNames, requests: requestsWithNames, logCount: a.count, requestCount: b.count, page });
});
