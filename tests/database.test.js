import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
test('PostgreSQL migration, constraints, RLS, outbox และ cascade deletion', async (t) => {
  const pg = new PGlite();
  try {
    // สร้าง role ชื่อเดียวกับ Supabase แต่ใช้ฐานข้อมูลทดสอบในหน่วยความจำ
    await pg.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await pg.exec(await readFile(new URL('../supabase/migrations/001_initial.sql', import.meta.url), 'utf8'));
    const user = 'U11111111111111111111111111111111';
    await pg.query("insert into employees(line_user_id,first_name,last_name) values ($1,'พนักงาน','ทดสอบ')", [user]);
    await t.test('RLS เปิดและ client roles อ่านข้อมูล/เรียก RPC ไม่ได้', async () => {
      const { rows } = await pg.query("select relname, relrowsecurity from pg_class where relname in ('employees','attendance_logs','leave_requests','line_notifications')");
      assert.equal(rows.length, 4); assert.ok(rows.every((row) => row.relrowsecurity));
      for (const role of ['anon', 'authenticated']) {
        await pg.exec(`set role ${role}`);
        await assert.rejects(pg.query('select * from employees'), (e) => e.code === '42501');
        await assert.rejects(pg.query("select record_attendance($1,'CHECK_IN',13,100,10)", [user]), (e) => e.code === '42501');
        await pg.exec('reset role');
      }
    });
    await t.test('คำร้องผิดประเภท/เหตุผลว่าง/ไม่มีเหตุผลถูกบล็อกใน DB', async () => {
      for (const sql of [
        "insert into leave_requests(line_user_id,request_type,request_date,leave_type) values($1,'ลางงาน','2026-10-13','ลาป่วย')",
        "insert into leave_requests(line_user_id,request_type,request_date,ot_reason) values($1,'ขอ OT','2026-10-13','   ')",
        "insert into leave_requests(line_user_id,request_type,request_date,ot_reason,leave_type) values($1,'ขอ OT','2026-10-13','งานผลิต','ลาป่วย')"
      ]) await assert.rejects(pg.query(sql, [user]), (e) => e.code === '23514');
      await pg.query("insert into leave_requests(line_user_id,request_type,request_date,ot_reason) values($1,'ขอ OT','2026-10-13','งานผลิต')", [user]);
      await assert.rejects(pg.query("insert into leave_requests(line_user_id,request_type,request_date,ot_reason) values($1,'ขอ OT','2026-10-13','ซ้ำ')", [user]), (e) => e.code === '23505');
      await assert.rejects(pg.query("update leave_requests set is_approved = true where line_user_id = $1", [user]), (e) => e.code === '23514');
    });
    await t.test('ลงเวลาสร้าง outbox แบบ atomic และไม่บันทึกซ้ำ', async () => {
      const clock = (await pg.query("select (clock_timestamp() at time zone 'Asia/Bangkok')::time >= time '07:00' as allowed")).rows[0].allowed;
      if (clock) {
        const result = await pg.query("select record_attendance($1,'CHECK_IN',13,100,10) as entry", [user]);
        assert.equal(result.rows[0].entry.check_type, 'CHECK_IN');
        assert.equal((await pg.query('select count(*)::int as total from line_notifications')).rows[0].total, 1);
        await assert.rejects(pg.query("select record_attendance($1,'CHECK_IN',13,100,10)", [user]), /ALREADY_RECORDED/);
      } else {
        await assert.rejects(pg.query("select record_attendance($1,'CHECK_IN',13,100,10)", [user]), /TOO_EARLY/);
        // สร้าง fixture สำหรับตรวจ outbox/cascade เมื่อทดสอบก่อนเวลาเปิด
        await pg.query("insert into attendance_logs(line_user_id,check_type,status_label,location_name,latitude,longitude,gps_accuracy) values($1,'CHECK_IN','เข้างานปกติ','บริษัท เคียวเอิ พรีซิชั่น จำกัด',13,100,10)", [user]);
        await pg.query("insert into line_notifications(attendance_id,line_user_id,details) select id,line_user_id,'{}'::jsonb from attendance_logs where line_user_id=$1", [user]);
      }
      const jobs = (await pg.query('select * from line_notifications')).rows;
      const first = await pg.query('select * from claim_notification($1)', [jobs[0].id]);
      assert.equal(first.rows.length, 1); assert.equal(first.rows[0].attempts, 1);
      assert.equal((await pg.query('select * from claim_notification($1)', [jobs[0].id])).rows.length, 0);
      await pg.query("update line_notifications set status='sent',locked_until=null where id=$1", [jobs[0].id]);
      assert.equal((await pg.query('select * from claim_notification($1)', [jobs[0].id])).rows.length, 0);
    });
    await t.test('ลบพนักงานแล้วลบประวัติ คำร้อง และ outbox ทั้งหมด', async () => {
      await pg.query('delete from employees where line_user_id=$1', [user]);
      for (const table of ['employees', 'attendance_logs', 'leave_requests', 'line_notifications']) assert.equal((await pg.query(`select count(*)::int as total from ${table}`)).rows[0].total, 0);
    });
  } finally { await pg.close(); }
});
