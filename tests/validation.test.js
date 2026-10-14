import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceSchema, employeeSchema, leaveSchema, dateString } from '../lib/validation.js';
test('คำร้องต้องมีเหตุผลถูกประเภทและไม่ยอมรับการอนุมัติจากผู้ใช้', () => {
  const leave = { request_type: 'ลางาน', request_date: '2026-10-13', leave_type: 'ลาป่วย', leave_reason: 'พบแพทย์' };
  assert.equal(leaveSchema.safeParse(leave).success, true);
  assert.equal(leaveSchema.safeParse({ ...leave, is_approved: true }).success, false);
  assert.equal(leaveSchema.safeParse({ ...leave, leave_reason: '   ' }).success, false);
  assert.equal(leaveSchema.safeParse({ ...leave, ot_reason: 'ทำ OT' }).success, false);
  assert.equal(leaveSchema.safeParse({ request_type: 'ขอ OT', request_date: '2026-10-13', ot_reason: 'ปิดงานผลิต' }).success, true);
  assert.equal(leaveSchema.safeParse({ request_type: 'ขอ OT', request_date: '2026-10-13' }).success, false);
});
test('ปฏิเสธวันที่ไม่มีจริง และตรวจ leap year', () => {
  assert.equal(dateString.safeParse('2026-02-30').success, false);
  assert.equal(dateString.safeParse('2026-02-29').success, false);
  assert.equal(dateString.safeParse('2028-02-29').success, true);
});
test('ไม่รับชื่อ สถานะ เวลา หรือ line_user_id จากคำขอลงเวลา', () => {
  const data = { check_type: 'CHECK_IN', latitude: 13, longitude: 100, accuracy: 10 };
  assert.equal(attendanceSchema.safeParse(data).success, true);
  for (const key of ['line_user_id', 'timestamp', 'status_label', 'first_name']) assert.equal(attendanceSchema.safeParse({ ...data, [key]: 'fake' }).success, false);
  assert.equal(employeeSchema.safeParse({ line_user_id: 'fake', first_name: 'สมชาย', last_name: 'ทดสอบ', role: 'admin', status: 'active' }).success, false);
});
