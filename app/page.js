'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { Notice } from '@/components/Notice';
import { bangkokDate, checkTime, thaiDateTime } from '@/lib/timeCheck';
function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('อุปกรณ์นี้ไม่รองรับ GPS'));
    navigator.geolocation.getCurrentPosition(resolve, (e) => reject(new Error(e.code === 1 ? 'กรุณาอนุญาตการเข้าถึงตำแหน่งที่ตั้งใน LINE และเบราว์เซอร์' : 'ไม่สามารถอ่าน GPS ได้ กรุณาตรวจสอบตำแหน่งที่ตั้งและลองอีกครั้ง')), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
}
export default function AttendancePage() {
  const { employee, api, closeLiff } = useApp();
  const [now, setNow] = useState(null);
  const [busy, setBusy] = useState('');
  const [position, setPosition] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  useEffect(() => { setNow(new Date()); const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let alive = true;
    const load = async () => { try { const result = await api('/api/history'); if (alive) setLogs(result.logs.filter((entry) => entry.work_date === bangkokDate())); } catch (e) { if (alive) setError(e.message); } };
    load(); const timer = setInterval(load, 15000);
    // ขอพิกัดอัตโนมัติ และอ่านใหม่เมื่อกดลงเวลาทุกครั้ง ไม่ใช้พิกัดเก่า
    getPosition().then((value) => { if (alive) setPosition(value.coords); }).catch((e) => { if (alive) setError(e.message); });
    return () => { alive = false; clearInterval(timer); };
  }, [api]);
  async function record(check_type) {
    setBusy(check_type); setMessage(''); setError('');
    try {
      const { coords } = await getPosition(); setPosition(coords);
      const result = await api('/api/attendance', { method: 'POST', body: JSON.stringify({ check_type, latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }) });
      setLogs((old) => [...old.filter((entry) => entry.check_type !== check_type), result.attendance]);
      setMessage(`${result.attendance.status_label} · ${thaiDateTime(result.attendance.timestamp)}${result.notificationSent ? ' · ส่งข้อความเข้า LINE แล้ว กำลังกลับไปหน้าแชท' : ' · บันทึกแล้ว แต่ส่งข้อความ LINE ยังไม่สำเร็จ ระบบเก็บไว้ส่งอีกครั้ง'}`);
      if (result.notificationSent) window.setTimeout(() => closeLiff(), 1200);
    } catch (e) { setError(e.message); }
    finally { setBusy(''); }
  }
  const entry = logs.find((log) => log.check_type === 'CHECK_IN');
  const exit = logs.find((log) => log.check_type === 'CHECK_OUT');
  return <div>
    <div className="mb-7"><p className="mb-2 text-xs font-bold tracking-widest text-brand">ระบบลงเวลาพนักงาน</p><h1 className="text-2xl font-bold sm:text-3xl">ลงเวลาทำงาน</h1><p className="mt-2 text-sm text-slate-500">สวัสดี {employee?.first_name} บันทึกเวลาเมื่อถึงบริษัท</p></div>
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <section className="panel"><div className="flex items-center justify-between text-sm text-slate-500"><span>เวลาปัจจุบัน</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-brand">เวลาไทย (GMT+7)</span></div><div className="py-9 text-center"><div className="text-5xl font-bold tabular-nums tracking-tight sm:text-7xl" aria-label="นาฬิกาเวลาไทย">{now ? now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hourCycle: 'h23' }) : '--:--:--'}</div><p className="mt-4 text-sm text-slate-500">{now ? now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'full' }) : 'กำลังอ่านเวลา…'}</p></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><button className="btn min-h-20 !text-lg" disabled={Boolean(busy) || !now || Boolean(entry) || (now && !checkTime('CHECK_IN', now).allowed)} onClick={() => record('CHECK_IN')}>{busy === 'CHECK_IN' ? 'กำลังบันทึก…' : entry ? '✓ บันทึกเข้างานแล้ว' : 'บันทึกเข้างาน'}</button><button className="btn min-h-20 !bg-slate-800 !text-lg hover:!bg-slate-900" disabled={Boolean(busy) || !now || !entry || Boolean(exit) || (now && !checkTime('CHECK_OUT', now).allowed)} onClick={() => record('CHECK_OUT')}>{busy === 'CHECK_OUT' ? 'กำลังบันทึก…' : exit ? '✓ บันทึกเลิกงานแล้ว' : 'บันทึกเลิกงาน'}</button></div>
        <p className="mt-4 text-center text-xs text-slate-500">เวลาในฐานข้อมูลอ้างอิงเซิร์ฟเวอร์ · ต้องเข้างานก่อนเลิกงาน</p><Notice message={error} error /><Notice message={message} />{message && <button className="btn-secondary w-full" onClick={closeLiff}>กลับไปหน้าแชท LINE</button>}
      </section>
      <div className="space-y-5"><section className="panel"><h2 className="font-bold">ตำแหน่งที่ตั้ง</h2><p className="mt-3 text-sm">บริษัท เคียวเออิ พรีซิชั่น จำกัด</p><div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{position ? <><span className="text-brand">● อ่านพิกัดแล้ว</span><p className="mt-2">ความแม่นยำ ±{Math.round(position.accuracy)} เมตร</p><p className="mt-2 text-xs">ระบบจะตรวจว่าคุณอยู่ในรัศมีบริษัทเมื่อกดบันทึก</p></> : 'รอการอนุญาตเข้าถึง GPS'}</div><button className="btn-secondary mt-3" disabled={Boolean(busy)} onClick={async () => { try { const p = await getPosition(); setPosition(p.coords); setError(''); } catch (e) { setError(e.message); } }}>ตรวจพิกัดอีกครั้ง</button></section>
        <section className="panel"><h2 className="font-bold">เวลาทำงาน</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt>เข้างาน</dt><dd>07:00 – 08:30</dd></div><div className="flex justify-between"><dt>เข้าสาย</dt><dd>หลัง 08:30</dd></div><div className="flex justify-between"><dt>เลิกงาน</dt><dd>17:30 – 21:30</dd></div><div className="flex justify-between text-slate-500"><dt>เลิกงาน OT</dt><dd>หลัง 21:30</dd></div></dl><p className="mt-4 text-xs text-slate-500">สถานะเลิกงาน OT คำนวณตามเวลา การอนุมัติ OT แสดงแยกในประวัติคำร้อง</p></section></div>
    </div>
    <section className="panel mt-6"><div className="flex items-center justify-between"><h2 className="font-bold">การลงเวลาวันนี้</h2><Link href="/history" className="text-sm text-brand">ดูประวัติทั้งหมด →</Link></div><div className="mt-4 grid gap-4 sm:grid-cols-2">{[['เข้างาน', entry], ['เลิกงาน', exit]].map(([label, item]) => <div className="rounded-xl bg-slate-50 p-4" key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-2 font-bold">{item ? item.status_label : 'ยังไม่บันทึก'}</p>{item && <p className="mt-1 text-xs text-slate-500">{thaiDateTime(item.timestamp)}</p>}</div>)}</div></section>
  </div>;
}
