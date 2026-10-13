import 'server-only';
import { ZodError } from 'zod';
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export function endpoint(handler) {
  return async (...args) => {
    try { return await handler(...args); } catch (error) {
      if (error instanceof ZodError) return json({ error: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบช่องที่กรอก', fields: error.flatten().fieldErrors }, 400);
      if (error instanceof ApiError) return json({ error: error.message }, error.status);
      // ไม่ส่งรายละเอียดฐานข้อมูลหรือ secret ไปยังผู้ใช้
      console.error('API failure', error.code || error.name || 'unknown');
      return json({ error: 'ระบบขัดข้อง กรุณาลองใหม่หรือติดต่อผู้ดูแล' }, 500);
    }
  };
}
export async function body(request, schema) {
  const raw = await request.text();
  if (raw.length > 16384) throw new ApiError(413, 'ข้อมูลมีขนาดใหญ่เกินไป');
  let data;
  try { data = JSON.parse(raw); } catch { throw new ApiError(400, 'รูปแบบข้อมูลไม่ถูกต้อง'); }
  return schema.parse(data);
}
export function dbResult(result) { if (result.error) throw result.error; return result.data; }
