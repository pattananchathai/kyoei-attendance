'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './AppProvider';
export function Shell({ children }) {
  const path = usePathname();
  const { loading, error, employee, line_user_id, relogin } = useApp();
  const links = [['/', 'ลงเวลา'], ['/leave', 'ยื่นคำร้อง'], ['/history', 'ประวัติของฉัน']];
  if (employee?.role === 'admin') links.push(['/admin', 'ผู้ดูแลระบบ']);
  return <div className="min-h-screen">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand font-bold text-white">ค</span><span><span className="block text-lg font-bold">ระบบเช็คชื่อพนักงาน</span><span className="text-xs text-slate-500">บริษัท เคียวเออิ พรีซิชั่น จำกัด</span></span></Link>
        {employee && <div className="text-sm"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />{employee.first_name} {employee.last_name}</div>}
      </div>
      <nav aria-label="เมนูหลัก" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5">{links.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm ${path === href ? 'border-brand font-bold text-brand' : 'border-transparent text-slate-500 hover:text-brand'}`}>{label}</Link>)}</nav>
    </header>
    <main className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden px-5 py-8 sm:py-10">
      {loading ? <div className="panel text-center" role="status">กำลังเชื่อมต่อ LINE…</div> : error ? <div className="panel"><p role="alert" className="mb-4 text-red-700">{error}</p><button className="btn-secondary" onClick={relogin}>เข้าสู่ระบบใหม่ / ลองอีกครั้ง</button></div> : !employee || employee.status !== 'active' ? <div className="panel mx-auto max-w-xl"><h1 className="mb-3 text-xl font-bold">ติดต่อฝ่ายบุคคลเพื่อเปิดใช้งาน</h1><p className="text-sm text-slate-600">กรุณาส่งรหัสผู้ใช้ LINE ด้านล่างให้ผู้ดูแลเพิ่มชื่อจริงและนามสกุลในระบบ</p><code className="my-5 block break-all rounded-xl bg-slate-50 p-4">{line_user_id}</code><button className="btn-secondary" onClick={() => window.location.reload()}>ตรวจสอบรายชื่ออีกครั้ง</button></div> : children}
    </main>
    <footer className="mx-auto max-w-6xl px-5 pb-8 text-xs text-slate-400">ระบบเช็คชื่อพนักงานผ่าน LINE OA · เวลาไทย (GMT+7)</footer>
  </div>;
}
