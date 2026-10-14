import 'server-only';
export { verifySignature } from './webhookSignature';
import { db } from './supabase';
import { dbResult } from './api';
import { thaiDateTime } from './timeCheck';
export async function lineRequest(path, data, retryKey) {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) throw new Error('ยังไม่ได้ตั้งค่าโทเค็น LINE Messaging API');
  const response = await fetch(`https://api.line.me/v2/bot/message/${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, 'Content-Type': 'application/json', ...(retryKey ? { 'X-Line-Retry-Key': retryKey } : {}) },
    body: JSON.stringify(data), signal: AbortSignal.timeout(10000), cache: 'no-store'
  });
  // 409 พร้อม accepted-request-id แสดงว่าคำขอ retry เดิมได้รับการยอมรับแล้ว
  if (!response.ok && !(response.status === 409 && response.headers.get('x-line-accepted-request-id'))) throw new Error(`LINE_HTTP_${response.status}`);
}
export function attendanceFlex(entry) {
  return { type: 'flex', altText: `${entry.status_label} • ${entry.first_name} ${entry.last_name}`, contents: {
    type: 'bubble', body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [
      { type: 'text', text: 'บันทึกเวลาสำเร็จ', weight: 'bold', size: 'xl', color: '#16714F' },
      { type: 'text', text: `${entry.first_name} ${entry.last_name}`, weight: 'bold', wrap: true },
      { type: 'text', text: entry.status_label, size: 'lg', wrap: true },
      { type: 'separator' },
      { type: 'text', text: thaiDateTime(entry.timestamp), size: 'sm', wrap: true },
      { type: 'text', text: entry.location_name, size: 'sm', wrap: true }
    ] }
  } };
}
export async function deliverNotification(id) {
  const claimed = dbResult(await db().rpc('claim_notification', { p_id: id }));
  const job = claimed?.[0];
  if (!job) return false;
  try {
    await lineRequest('push', { to: job.line_user_id, messages: [attendanceFlex(job.details)] }, job.id);
    dbResult(await db().from('line_notifications').update({ status: 'sent', sent_at: new Date().toISOString(), locked_until: null, last_error: null }).eq('id', id));
    return true;
  } catch (error) {
    dbResult(await db().from('line_notifications').update({ status: 'failed', locked_until: null, last_error: /^LINE_HTTP_\d+$/.test(error.message) ? error.message : 'DELIVERY_FAILED' }).eq('id', id));
    return false;
  }
}
export async function retryNotifications() {
  const jobs = dbResult(await db().from('line_notifications').select('id').neq('status', 'sent').lt('attempts', 10).gt('created_at', new Date(Date.now() - 23 * 3600000).toISOString()).order('created_at').limit(20));
  const results = [];
  // จำกัดจำนวนพร้อมกันเพื่อไม่ชน LINE quota
  for (let i = 0; i < jobs.length; i += 4) results.push(...await Promise.all(jobs.slice(i, i + 4).map((job) => deliverNotification(job.id))));
  return { checked: jobs.length, accepted: results.filter(Boolean).length };
}
