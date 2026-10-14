'use client';
import { useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { Notice } from '@/components/Notice';
import { bangkokDate } from '@/lib/timeCheck';
export default function LeavePage() {
  const { api } = useApp();
  const [type, setType] = useState('ลางาน');
  const [date, setDate] = useState(() => bangkokDate());
  const [leaveType, setLeaveType] = useState('ลาป่วย');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await api('/api/leave', { method: 'POST', body: JSON.stringify({ request_type: type, request_date: date, ...(type === 'ลางาน' ? { leave_type: leaveType, leave_reason: reason } : { ot_reason: reason }) }) });
      setReason(''); setMessage('ส่งคำร้องสำเร็จ รอผู้ดูแลอนุมัติ ตรวจสอบได้ที่หน้าประวัติ');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-2xl"><p className="mb-2 text-xs font-bold tracking-widest text-brand">คำร้องของพนักงาน</p><h1 className="text-3xl font-bold">ยื่นคำร้อง</h1><p className="mb-7 mt-3 text-sm text-slate-500">ส่งรายละเอียดการลา หรือขอทำงานล่วงเวลาให้ผู้ดูแลพิจารณา</p><form className="panel space-y-5" onSubmit={submit}>
    <label className="label">ประเภทคำร้อง<select className="input" value={type} disabled={busy} onChange={(e) => { setType(e.target.value); setReason(''); setMessage(''); }}><option>ลางาน</option><option>ขอ OT</option></select></label>
    <label className="label">{type === 'ลางาน' ? 'วันที่ต้องการลา' : 'วันที่ต้องการทำ OT'}<input type="date" required className="input" value={date} disabled={busy} onChange={(e) => setDate(e.target.value)} /></label>
    {type === 'ลางาน' && <label className="label">ประเภทการลา<select className="input" value={leaveType} disabled={busy} onChange={(e) => setLeaveType(e.target.value)}><option>ลาป่วย</option><option>ลาพักร้อน</option><option>ลากิจ</option></select></label>}
    <label className="label">{type === 'ลางาน' ? 'เหตุผลการลา' : 'เหตุผลการขอ OT'}<textarea className="input resize-y" rows={5} required maxLength={2000} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} placeholder="ระบุรายละเอียดเพื่อประกอบการพิจารณา" /><span className="mt-2 block text-right text-xs text-slate-400">{reason.length}/2,000</span></label>
    <Notice message={error} error /><Notice message={message} /><button className="btn w-full" disabled={busy || !reason.trim()}>{busy ? 'กำลังส่ง…' : 'ส่งคำร้อง'}</button><p className="text-xs text-slate-500">ส่งได้ประเภทละหนึ่งคำร้องต่อวัน หากลาหลายวันให้ส่งแยกตามวันที่</p>
  </form></div>;
}
