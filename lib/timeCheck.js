export const TIME_ZONE = 'Asia/Bangkok';
export function bangkokDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function thaiDateTime(date) {
  return new Intl.DateTimeFormat('th-TH', { timeZone: TIME_ZONE, dateStyle: 'long', timeStyle: 'medium' }).format(new Date(date));
}
// ใช้เวลาจากเซิร์ฟเวอร์ ไม่รับเวลาที่ผู้ใช้ส่งมา และเทียบละเอียดถึงวินาที
export function checkTime(checkType, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const value = (type) => Number(parts.find((p) => p.type === type).value);
  const seconds = value('hour') * 3600 + value('minute') * 60 + value('second') + date.getUTCMilliseconds() / 1000;
  if (checkType === 'CHECK_IN') {
    if (seconds < 7 * 3600) return { allowed: false, message: 'เข้างานได้ตั้งแต่ 07.00 น.' };
    return { allowed: true, statusLabel: seconds <= 8 * 3600 + 30 * 60 ? 'เข้างานปกติ' : 'เข้าสาย' };
  }
  if (checkType === 'CHECK_OUT') {
    if (seconds < 17 * 3600 + 30 * 60) return { allowed: false, message: 'เลิกงานได้ตั้งแต่ 17.30 น.' };
    return { allowed: true, statusLabel: seconds <= 21 * 3600 + 30 * 60 ? 'เลิกงานปกติ' : 'เลิกงาน OT' };
  }
  return { allowed: false, message: 'ประเภทการลงเวลาไม่ถูกต้อง' };
}
