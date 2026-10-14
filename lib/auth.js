import 'server-only';
import { db } from './supabase';
import { ApiError, dbResult } from './api';
export async function identity(request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token || token.length > 8192) throw new ApiError(401, 'กรุณาเข้าสู่ระบบผ่าน LINE');
  if (!process.env.LINE_LOGIN_CHANNEL_ID) throw new Error('ยังไม่ได้ตั้งค่าหมายเลขช่อง LINE Login');
  // ตรวจ ID token กับ LINE โดยตรง ห้ามเชื่อ line_user_id หรือชื่อจากเบราว์เซอร์
  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ id_token: token, client_id: process.env.LINE_LOGIN_CHANNEL_ID }),
    cache: 'no-store', signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new ApiError(response.status >= 500 || response.status === 429 ? 503 : 401, 'ยืนยันตัวตน LINE ไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่');
  const profile = await response.json();
  if (!/^U[0-9a-f]{32}$/.test(profile.sub || '') || String(profile.aud) !== process.env.LINE_LOGIN_CHANNEL_ID || profile.iss !== 'https://access.line.me' || profile.exp * 1000 <= Date.now()) throw new ApiError(401, 'ข้อมูลยืนยันตัวตนไม่ถูกต้อง');
  return profile.sub;
}
export async function authorize(request, admin = false) {
  const userId = await identity(request);
  const employee = dbResult(await db().from('employees').select('*').eq('line_user_id', userId).maybeSingle());
  if (!employee || employee.status !== 'active') throw new ApiError(403, 'ยังไม่มีรายชื่อพนักงานที่ใช้งานได้ กรุณาติดต่อผู้ดูแล');
  if (admin && employee.role !== 'admin') throw new ApiError(403, 'เฉพาะผู้ดูแลระบบเท่านั้น');
  return employee;
}
