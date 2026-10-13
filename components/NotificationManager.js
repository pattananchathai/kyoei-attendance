'use client';
import { useEffect, useState } from 'react';
import { useApp } from './AppProvider';
import { Notice } from './Notice';
export function NotificationManager() {
  const { api } = useApp();
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => { let alive = true; api('/api/admin/notifications').then((r) => { if (alive) setJobs(r.notifications); }).catch((e) => { if (alive) setError(e.message); }); return () => { alive = false; }; }, [api, version]);
  async function retry() {
    setBusy(true); setError('');
    try { const result = await api('/api/admin/notifications', { method: 'POST' }); setMessage(`ตรวจ ${result.checked} รายการ LINE รับคำขอแล้ว ${result.accepted} รายการ`); setVersion((n) => n + 1); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <section className="panel"><h2 className="font-bold">ข้อความ LINE ที่ส่งยังไม่สำเร็จ</h2><p className="my-3 text-sm text-slate-500">แสดงสูงสุด 50 รายการ ส่งซ้ำครั้งละ 20 รายการ ภายใน 23 ชั่วโมงและไม่เกิน 10 ครั้ง หากหมดระยะเวลาหรือเกินจำนวนครั้ง ให้ตรวจสอบกับฝ่ายบุคคล</p><button className="btn" disabled={busy} onClick={retry}>{busy ? 'กำลังส่ง…' : 'ส่งข้อความค้างอีกครั้ง'}</button><Notice message={error} error /><Notice message={message} /><div className="mt-4 space-y-2">{jobs.map((job) => <div className="break-all rounded-lg bg-slate-50 p-3 text-xs" key={job.id}>{job.line_user_id} · {job.status} · {job.attempts} ครั้ง · {job.last_error || 'รอดำเนินการ'}</div>)}{!jobs.length && <p className="text-sm text-slate-500">ไม่มีข้อความค้าง</p>}</div></section>;
}
