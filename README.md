# ระบบเช็คชื่อพนักงานผ่าน LINE OA

บริษัท เคียวเออิ พรีซิชั่น จำกัด — Next.js 14 App Router, React 18, Tailwind CSS 3 และ Supabase PostgreSQL โค้ด JavaScript พร้อมคอมเมนต์ภาษาไทย

## ข้อจำกัดความปลอดภัยของ Next.js 14

คง Next.js 14 ตามคำยืนยันของผู้ใช้ รุ่นที่ติดตั้งคือ 14.2.35 `npm audit` ยังรายงานช่องโหว่ของ framework ซึ่งไม่มีแพตช์ในสาย 14 รวมถึง [RCE บน Windows](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) ที่เอกสารระบุว่าไม่มี workaround และต้องอัปเกรดเป็นรุ่นที่แก้ไขแล้ว จึงยังไม่ควรเปิด production บน Windows ด้วยเวอร์ชันนี้ ปิด Image Optimizer และ override PostCSS ให้รุ่นที่แก้ไขแล้ว แต่ไม่ได้แก้ช่องโหว่ Next.js ทั้งหมด ก่อนเปิดสู่ภายนอกควรย้ายไป Next.js สายที่มีแพตช์และตรวจ `npm audit` อีกครั้ง Dependency ฝั่งพัฒนา Tailwind 3 มี advisory ที่ต้องอัปเกรด major เพื่อแก้ทั้งหมดด้วย

## เริ่มต้นใช้งาน

1. ใช้ Node.js 20 ขึ้นไป รัน `npm install`
2. คัดลอก `.env.example` เป็น `.env.local` และกรอกค่าจริงทั้งหมด ห้าม commit secrets
3. สร้าง Supabase project แล้วรัน `supabase/migrations/001_initial.sql` ใน SQL Editor **ครั้งเดียว** บนฐานข้อมูลใหม่ หากมีตารางเดิมอยู่แล้วให้รัน `supabase/migrations/002_update_company_requirements.sql` เพื่อปรับข้อมูลและสิทธิ์โดยไม่ล้างประวัติ
4. เพิ่มผู้ดูแลคนแรกด้วย SQL ด้านล่าง โดยใช้รหัสผู้ใช้ LINE จริง
5. รัน `npm run dev` เปิด `http://localhost:3000` การใช้ LIFF/GPS บนโทรศัพท์ต้องใช้ HTTPS และ LIFF Endpoint URL ที่ตรงกับโดเมน
6. ก่อนขึ้นระบบรัน `npm test` และ `npm run build` จากนั้น `npm start`

```sql
-- แทนที่ค่าตัวอย่าง ไม่ใช่ user ID ที่ใช้งานได้จริง
insert into public.employees(line_user_id, first_name, last_name, role, status)
values ('U00000000000000000000000000000000', 'ชื่อจริงผู้ดูแล', 'นามสกุลผู้ดูแล', 'admin', 'active');
```

ผู้ใช้ที่ยังไม่มีรายชื่อสามารถเปิด LIFF เพื่อดูรหัสผู้ใช้ LINE ของตนเอง แล้วแจ้งฝ่ายบุคคล ผู้ดูแลเพิ่มพนักงานด้วยชื่อจริงและนามสกุล ไม่มีการเปิดให้พนักงานสมัครสิทธิ์ผู้ดูแลเอง

## ตั้งค่า LINE Developers

- สร้าง LINE Login channel และ Messaging API channel ของ OA **ภายใต้ Provider เดียวกัน** เพื่อให้ User ID ตรงกัน
- ใน LINE Login เพิ่ม LIFF app ขนาด Full ตั้ง Endpoint URL เป็น `https://โดเมนของคุณ/` เปิด scopes `openid` และ `profile` แล้วกรอก `NEXT_PUBLIC_LIFF_ID`
- กรอก **LINE Login Channel ID** ใน `LINE_LOGIN_CHANNEL_ID` ใช้สำหรับตรวจ ID token ห้ามใช้ Messaging API Channel ID แทน
- เชื่อม LINE Login กับ OA และให้พนักงานเพิ่ม OA เป็นเพื่อนเพื่อรับ push message
- กรอก Channel access token ของ Messaging API ใน `LINE_CHANNEL_ACCESS_TOKEN` และ Channel secret ใน `LINE_CHANNEL_SECRET` ทั้งสองตัวอยู่ฝั่งเซิร์ฟเวอร์เท่านั้น
- ตั้ง Webhook URL เป็น `https://โดเมนของคุณ/api/line/webhook` กด Verify และเปิด Use webhook; ปิด auto-reply/greeting เดิมหากไม่ต้องการข้อความซ้อน
- Rich menu สามารถลิงก์ `https://liff.line.me/<LIFF_ID>` พนักงานพิมพ์ `เช็คชื่อ`, `ลงเวลา` หรือ `รหัสพนักงาน` ในแชทเพื่อรับลิงก์และ User ID ได้
- หลังลงเวลาสำเร็จ เซิร์ฟเวอร์ส่ง Flex Message จาก OA ไปหารหัสผู้ใช้ LINE ที่ตรวจแล้ว พร้อมวันเวลา ชื่อจริง นามสกุล สถานะ และบริษัท ไม่ใช้ `liff.sendMessages()` เพราะข้อความนั้นส่งในนามผู้ใช้
- LINE รับ push request สำเร็จไม่ได้รับประกันว่าผู้ใช้ได้รับข้อความ เช่น ผู้ใช้บล็อก OA หรือมีข้อจำกัดบัญชี/โควตา ต้องทดสอบด้วย OA จริง

## พิกัดและเวลาทำงาน

ระบบกำหนดพิกัดบริษัทไว้ที่ละติจูด `14.032` ลองจิจูด `100.618` และรัศมี `200` เมตรตามข้อกำหนด ค่า `COMPANY_LATITUDE`, `COMPANY_LONGITUDE` และ `COMPANY_RADIUS_METERS` ในไฟล์สภาพแวดล้อมใช้ยืนยันหรือปรับค่าหลังตรวจจุดจริงหน้างาน ส่วน `GPS_MAX_ACCURACY_METERS` คือค่าความคลาดเคลื่อน GPS สูงสุด

ใช้ Haversine ฝั่งเซิร์ฟเวอร์ตรวจรัศมี รวมถึงปฏิเสธพิกัดผิดช่วงและ GPS ที่คลาดเคลื่อนเกินกำหนด หากอยู่นอกรัศมีแสดง `ไม่สามารถเข้างานได้เนื่องจากยังไม่ถึงบริษัท` ทั้งการเข้าและออก GPS ในเว็บมาจากอุปกรณ์และสามารถถูก spoof ได้ ระบบนี้จึงไม่ใช่หลักฐานป้องกันปลอมตำแหน่งแบบสมบูรณ์

เวลาจริงจากฐานข้อมูลและเซิร์ฟเวอร์ ใช้ `Asia/Bangkok`:

| รายการ | ช่วงเวลา | สถานะ |
| --- | --- | --- |
| เข้างาน | 07:00:00 ถึง 08:30:00 | เข้างาน |
| เข้างาน | หลัง 08:30:00 | เข้าสาย |
| เลิกงาน | 17:30:00 ถึง 21:30:00 | เลิกงาน |
| เลิกงาน | หลัง 21:30:00 | เลิกงาน OT |

ก่อน 07:00 บล็อกเข้างาน ก่อน 17:30 บล็อกเลิกงาน หลังเวลาขอบแม้เพียงเสี้ยววินาทีถือเป็นสถานะถัดไป UI นาฬิกาแสดงถึงวินาที การลงเวลาไม่อ้างอิงนาฬิกามือถือ

บันทึกเข้าและออกได้ประเภทละหนึ่งครั้งต่อวันไทย ต้องเข้างานก่อนออกงาน ล็อกพนักงานและบันทึก outbox ภายใน transaction พร้อม unique constraint เพื่อป้องกันกดซ้ำ/คำขอพร้อมกัน **หลังเที่ยงคืนเป็นวันใหม่** ระบบนี้ยังไม่จับคู่กะข้ามคืน หากบริษัทมีกะข้ามคืนต้องกำหนดกติกาเพิ่มเติมก่อนใช้งาน

สถานะ “เลิกงาน OT” ใช้เวลาเป็นเกณฑ์ตามโจทย์ การอนุมัติคำร้อง OT เป็นข้อมูลแยก ไม่เปลี่ยนสถานะลงเวลา และยังไม่ได้คำนวณเงินเดือนหรือจำนวนชั่วโมง OT

## ฐานข้อมูลและสิทธิ์

ตารางหลักมีคอลัมน์ตามโจทย์ทั้งหมด เพิ่ม `work_date`, `gps_accuracy`, `request_date`, `created_at`, `approved_by` สำหรับวันทำงาน ความแม่นยำ GPS และติดตามการอนุมัติ ตาราง `line_notifications` เก็บข้อความที่ยังส่งไม่สำเร็จ

- ทุกตารางเปิด RLS และ revoke สิทธิ์ `anon` / `authenticated` ไม่มี permissive policy ผู้ใช้เข้าถึงผ่าน API เท่านั้น ไม่ส่ง service role ให้ browser
- API ตรวจโทเค็นยืนยันตัวตนกับ LINE และตรวจพนักงานที่เปิดใช้งานทุกครั้ง ชื่อ/รหัสผู้ใช้ LINE/สถานะเวลาใช้ค่าที่เซิร์ฟเวอร์ตรวจแล้ว
- History พนักงานเห็นเฉพาะของตนเอง แม้แก้ query string ผู้ดูแลเห็นทุกคนพร้อมเดือนและตัวกรอง User ID มี pagination ตารางละ 50 รายการ
- ปุ่มอนุมัติปรับเฉพาะรายการที่ยังไม่อนุมัติ เพื่อไม่เขียนทับข้อมูลอนุมัติจากผู้ดูแลอีกคน
- เมื่อผู้ดูแลลบพนักงาน foreign key `ON DELETE CASCADE` ลบประวัติ คำร้อง และข้อความค้างทั้งหมด มี dialog ยืนยันใน UI ไม่อนุญาตลบบัญชีผู้ดูแลที่กำลังใช้
- ไม่มีการเชื่อม Supabase Realtime channel ไปยัง browser เพราะใช้ LINE identity แทน Supabase Auth หน้าแรกและหน้าประวัติอัปเดตผ่าน API ทุก 15 วินาที หลังลงเวลาจะแสดงผลทันทีโดยไม่ต้อง reload

คำร้องต้องมีวันที่และเหตุผล ลาป่วย/ลาพักร้อน/ลากิจเป็นรายการลา ขอ OT มีเฉพาะเหตุผล OT ใช้ unique constraint ป้องกันคำร้องประเภทเดียวกันซ้ำในวันเดียว หากลาหลายวันให้ส่งทีละวัน ผู้ใช้ไม่สามารถส่ง `is_approved` มาจากฟอร์มได้

## กู้คืนข้อความ LINE

Attendance + notification ถูกบันทึกใน transaction เดียวกัน แล้วส่ง push ทันที หาก LINE ล่ม ผู้ใช้ยังเห็นว่าลงเวลาสำเร็จและข้อความรอส่ง ผู้ดูแลตรวจรายการค้างและกดส่งอีกครั้งในแท็บข้อความ LINE ได้

ตั้ง scheduler ของโฮสต์ให้เรียก `GET /api/cron/notifications` ทุก 5 นาที พร้อม header `Authorization: Bearer <CRON_SECRET>` ค่า secret สุ่มอย่างน้อย 32 ตัวอักษร **โค้ดไม่ได้สร้าง scheduler ให้โดยอัตโนมัติ** Endpoint ตรวจเฉพาะ secret ไม่ต้องใช้ LIFF token ส่งครั้งละสูงสุด 20 รายการ ล็อกงานเพื่อป้องกันหลาย worker พร้อมกันและใช้ UUID เดิมเป็น `X-Line-Retry-Key`

ส่งซ้ำไม่เกิน 10 ครั้ง และภายใน 23 ชั่วโมง เพื่ออยู่ในช่วง retry key ของ LINE หลังจากนั้นเก็บรายการไว้ให้ฝ่ายบุคคลตรวจสอบ ไม่ส่งซ้ำอัตโนมัติเพราะอาจทำให้ข้อความซ้ำ หลัง LINE รับคำขอสำเร็จจะบันทึก `sent_at` ข้อความที่ส่งไปแล้วใน LINE จะไม่ถูกลบตามการลบในฐานข้อมูล

## API

API พนักงาน/ผู้ดูแลรับ `Authorization: Bearer <LIFF ID token>` เก็บ token ใน LIFF SDK ไม่บันทึกลง localStorage ไม่ส่ง token ใน URL

| Method | Path | หน้าที่ |
| --- | --- | --- |
| GET | `/api/me` | LINE identity / รายชื่อพนักงาน |
| POST | `/api/attendance` | ตรวจ GPS/เวลา บันทึกและส่ง LINE |
| POST | `/api/leave` | ส่งคำร้อง |
| GET | `/api/history?month=2026-10&page=0` | ประวัติของตนเอง |
| GET | `/api/history?scope=all&month=2026-10` | ประวัติทุกคน เฉพาะ admin |
| GET, POST | `/api/admin/employees` | อ่าน/เพิ่มพนักงาน |
| DELETE | `/api/admin/employees/:id` | ลบพนักงานและข้อมูลทั้งหมด |
| PATCH | `/api/admin/requests/:id` | อนุมัติคำร้อง |
| GET, POST | `/api/admin/notifications` | ดู/ส่งข้อความค้าง |
| GET | `/api/cron/notifications` | scheduler ใช้ CRON_SECRET |
| POST | `/api/line/webhook` | webhook ที่ตรวจ HMAC SHA256 |

## ตรวจสอบก่อนใช้งานจริง

`npm test` ตรวจขอบเขตเวลา วันไทย พิกัด ความแม่นยำ config ที่ขาด การปลอม field คำร้อง วันไม่มีจริง และ webhook HMAC รวมถึงรัน SQL migration จริงบน PostgreSQL ในหน่วยความจำผ่าน PGlite เพื่อตรวจ constraints, RLS, สิทธิ์ RPC, outbox lock และ cascade deletion ไม่ใช้ข้อมูลจริง `npm run build` ตรวจ production bundle การทดสอบ PGlite ไม่ทดแทนการทดสอบ Supabase PostgREST หรือ LINE จริง

หลัง `npm start` รัน `npm run smoke` ใน terminal อีกอัน เพื่อตรวจหน้าเว็บทั้ง 4 หน้าและยืนยันว่า API ทั้ง 12 กรณีปฏิเสธคำขอที่ไม่มี token/ลายเซ็นด้วย HTTP 401 ใช้ localhost:3000 เป็นค่าเริ่มต้น

หลังตั้งค่าจริงให้ทดสอบบนมือถือ: อนุญาต/ปฏิเสธ GPS, อยู่ใน/นอกรัศมี, เข้า/ออกก่อนเวลาที่อนุญาต, กดซ้ำพร้อมกัน, อ่านประวัติคนอื่น, พนักงานเปิด admin API, อนุมัติลาและ OT, ลบพนักงานทดสอบ, webhook ลายเซ็นผิด, OA push และ retry หลังปิด LINE token ชั่วคราว ใช้ข้อมูลพนักงานทดสอบก่อนเปิดใช้จริง

ก่อนเปิดใช้งานจริงต้องกรอกค่าจาก LINE Developers, รัน migration บน Supabase, ตั้งโดเมน HTTPS และตั้งตัวเรียกงานส่งข้อความซ้ำตามขั้นตอนข้างต้น

เอกสารอ้างอิง: [LINE LIFF server identity](https://developers.line.biz/en/docs/liff/using-user-profile/), [LINE Messaging API](https://developers.line.biz/en/reference/messaging-api/), [Webhook signature](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Next.js 14 security patches](https://nextjs.org/blog/security-update-2025-12-11)
