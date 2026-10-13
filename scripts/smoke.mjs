// รันหลัง npm start ตรวจเฉพาะหน้าเว็บและ API ที่ไม่มี token ไม่ใช้ข้อมูลจริง
const origin = process.env.SMOKE_ORIGIN || 'http://127.0.0.1:3000';
const pages = ['/', '/leave', '/history', '/admin'];
const guarded = [
  ['/api/me', 'GET'], ['/api/history', 'GET'], ['/api/attendance', 'POST'], ['/api/leave', 'POST'],
  ['/api/admin/employees', 'GET'], ['/api/admin/employees', 'POST'],
  ['/api/admin/employees/11111111-1111-4111-8111-111111111111', 'DELETE'],
  ['/api/admin/requests/11111111-1111-4111-8111-111111111111', 'PATCH'],
  ['/api/admin/notifications', 'GET'], ['/api/admin/notifications', 'POST'],
  ['/api/cron/notifications', 'GET'], ['/api/line/webhook', 'POST']
];
for (const path of pages) {
  const response = await fetch(origin + path);
  if (response.status !== 200) throw new Error(`${path}: ${response.status}`);
  const html = await response.text();
  if (!html.includes('KYOEI PRECISION')) throw new Error(`Missing shell: ${path}`);
  console.log('PASS page', path, response.status);
}
for (const [path, method] of guarded) {
  const response = await fetch(origin + path, { method, ...(method !== 'GET' ? { body: '{}' } : {}) });
  if (response.status !== 401) throw new Error(`${path}: ${response.status}`);
  if (response.headers.get('cache-control') !== 'no-store') throw new Error(`Unsafe cache: ${path}`);
  console.log('PASS auth guard', method, path, response.status);
}
