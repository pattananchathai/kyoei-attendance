import { endpoint, json, ApiError } from '@/lib/api';
import { verifySignature, lineRequest } from '@/lib/line';
export const dynamic = 'force-dynamic';
export const POST = endpoint(async (request) => {
  const raw = await request.text();
  if (raw.length > 1048576) throw new ApiError(413, 'ข้อมูลมีขนาดใหญ่เกินไป');
  // ตรวจลายเซ็นจาก raw body ก่อน parse JSON เพื่อป้องกันเว็บฮุคปลอม
  if (!verifySignature(raw, request.headers.get('x-line-signature'), process.env.LINE_CHANNEL_SECRET)) throw new ApiError(401, 'ลายเซ็นไม่ถูกต้อง');
  let payload;
  try { payload = JSON.parse(raw); } catch { throw new ApiError(400, 'รูปแบบข้อมูลไม่ถูกต้อง'); }
  if (!Array.isArray(payload.events)) throw new ApiError(400, 'รายการเหตุการณ์ไม่ถูกต้อง');
  let failed = false;
  for (const event of payload.events) {
    if (!event.replyToken || event.deliveryContext?.isRedelivery) continue;
    if (event.type === 'follow' || (event.type === 'message' && event.message?.type === 'text' && ['เช็คชื่อ', 'ลงเวลา', 'รหัสพนักงาน'].includes(event.message.text.trim()))) {
      const userId = event.source?.type === 'user' ? event.source.userId : null;
      if (!userId) continue;
      try { await lineRequest('reply', { replyToken: event.replyToken, messages: [{ type: 'text', text: `ระบบเช็คชื่อ บริษัท เคียวเออิ พรีซิชั่น จำกัด\nเปิดระบบ: https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}\nรหัสผู้ใช้ LINE ของคุณ: ${userId}\nส่งรหัสนี้ให้ฝ่ายบุคคลเพื่อเพิ่มรายชื่อพนักงาน` }] }); }
      catch { failed = true; }
    }
  }
  // reply token ใช้ได้ครั้งเดียว ไม่ส่งซ้ำเมื่อ LINE redeliver
  return json({ received: true, ...(failed ? { replyFailed: true } : {}) });
});
