import test from 'node:test';
import assert from 'node:assert/strict';
import { checkTime, bangkokDate } from '../lib/timeCheck.js';
const date = (time) => new Date(`2026-10-13T${time}+07:00`);
test('เข้างาน: ก่อนเปิด / เวลาเปิด / ขอบ 08:30 / หลังขอบ', () => {
  assert.equal(checkTime('CHECK_IN', date('06:59:59')).allowed, false);
  assert.equal(checkTime('CHECK_IN', date('07:00:00')).statusLabel, 'เข้างานปกติ');
  assert.equal(checkTime('CHECK_IN', date('08:30:00')).statusLabel, 'เข้างานปกติ');
  assert.equal(checkTime('CHECK_IN', date('08:30:00.001')).statusLabel, 'เข้าสาย');
  assert.equal(checkTime('CHECK_IN', date('23:59:59')).statusLabel, 'เข้าสาย');
});
test('เลิกงาน: ก่อนเปิด / เวลาเปิด / ขอบ 21:30 / หลังขอบ', () => {
  assert.equal(checkTime('CHECK_OUT', date('17:29:59')).allowed, false);
  assert.equal(checkTime('CHECK_OUT', date('17:30:00')).statusLabel, 'เลิกงานปกติ');
  assert.equal(checkTime('CHECK_OUT', date('21:30:00')).statusLabel, 'เลิกงานปกติ');
  assert.equal(checkTime('CHECK_OUT', date('21:30:00.001')).statusLabel, 'เลิกงาน OT');
});
test('ใช้วันไทยข้ามขอบวัน UTC และไม่รับ check type ปลอม', () => {
  assert.equal(bangkokDate(new Date('2026-10-12T17:00:00Z')), '2026-10-13');
  assert.equal(checkTime('FAKE', date('08:00:00')).allowed, false);
});
