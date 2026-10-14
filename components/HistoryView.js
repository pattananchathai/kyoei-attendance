'use client';
import { useCallback, useEffect, useState } from 'react';
import { useApp } from './AppProvider';
import { Notice } from './Notice';
import { bangkokDate, thaiDateTime } from '@/lib/timeCheck';
export function HistoryView({ admin = false }) {
  const { api } = useApp();
  const [month, setMonth] = useState(() => bangkokDate().slice(0, 7));
  const [page, setPage] = useState(0);
  const [employeeId, setEmployeeId] = useState('');
  const [filter, setFilter] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    let running = false;
    async function load() {
      if (running) return;
      running = true;
      try {
        const params = new URLSearchParams({ month, page: String(page), ...(admin ? { scope: 'all' } : {}), ...(employeeId ? { employee: employeeId } : {}) });
        const result = await api(`/api/history?${params}`);
        if (alive) { setData(result); setError(''); }
      } catch (e) { if (alive) setError(e.message); }
      finally { running = false; }
    }
    setData(null); load();
    const timer = setInterval(load, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, [api, month, page, employeeId, admin, version]);
  async function approve(id) {
    setBusy(id);
    try { await api(`/api/admin/requests/${id}`, { method: 'PATCH' }); refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(''); }
  }
  const name = (entry) => `${entry.employees?.first_name || ''} ${entry.employees?.last_name || ''}`;
  return <div className="space-y-5">
    <div className="space-y-2">
      <div className="flex min-w-0 items-end gap-2">
        <label className="label min-w-0 flex-1">เดือนที่ต้องการดู<input aria-label="เดือนที่ต้องการดู" type="month" className="input box-border w-full min-w-0 px-3 sm:px-4" value={month} onChange={(e) => { if (e.target.value) { setMonth(e.target.value); setPage(0); } }} /></label>
        <button className="btn-secondary shrink-0" onClick={refresh}>รีเฟรช</button>
      </div>
      <span className="block text-xs text-slate-500">อัปเดตทุก 15 วินาที</span>
    </div>
    {admin && <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setEmployeeId(filter.trim()); setPage(0); }}><label className="label flex-1">กรองด้วยรหัสผู้ใช้ LINE (เว้นว่างเพื่อดูทุกคน)<input className="input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="U…" maxLength={33} /></label><button className="btn-secondary">ค้นหา</button></form>}
    <Notice message={error} error />
    {!data ? <p role="status">กำลังโหลดประวัติ…</p> : <>
      <section className="panel !p-0 overflow-hidden"><h2 className="px-5 py-5 font-bold">ประวัติการลงเวลา <span className="ml-2 text-sm font-normal text-slate-500">{data.logCount} รายการ</span></h2><div className="overflow-x-auto"><table className="w-full"><thead><tr><th>วัน เดือน ปี / เวลา</th><th>ชื่อจริง นามสกุลจริง</th><th>รายการ</th><th>สถานะ</th><th>สถานที่</th></tr></thead><tbody>{data.logs.map((entry) => <tr key={entry.id}><td className="min-w-48">{thaiDateTime(entry.timestamp)}</td><td className="min-w-36">{name(entry)}</td><td>{entry.check_type === 'CHECK_IN' ? 'เข้างาน' : 'เลิกงาน'}</td><td><span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${entry.status_label === 'เข้าสาย' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>{entry.status_label}</span></td><td className="min-w-48 text-slate-500">{entry.location_name}</td></tr>)}</tbody></table></div>{!data.logs.length && <p className="px-5 pb-6 text-sm text-slate-500">ยังไม่มีการลงเวลาในเดือนนี้</p>}</section>
      <section className="panel !p-0 overflow-hidden"><h2 className="px-5 py-5 font-bold">ประวัติคำร้อง <span className="ml-2 text-sm font-normal text-slate-500">{data.requestCount} รายการ</span></h2><div className="overflow-x-auto"><table className="w-full"><thead><tr><th>วันที่ลา / OT</th><th>ชื่อจริง นามสกุลจริง</th><th>ลางาน</th><th>ขอ OT</th><th>การอนุมัติ</th>{admin && <th>จัดการ</th>}</tr></thead><tbody>{data.requests.map((entry) => <tr key={entry.id}><td className="whitespace-nowrap">{new Date(`${entry.request_date}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'long' })}</td><td className="min-w-36">{name(entry)}</td><td className="min-w-48 break-words">{entry.request_type === 'ลางาน' ? <><strong>{entry.leave_type}</strong><p className="mt-1 whitespace-pre-wrap text-slate-500">{entry.leave_reason}</p></> : '—'}</td><td className="min-w-48 whitespace-pre-wrap break-words">{entry.ot_reason || '—'}</td><td className="min-w-40">{entry.is_approved ? <><span className="text-brand">✓ อนุมัติแล้ว</span><p className="mt-1 text-xs text-slate-500">{thaiDateTime(entry.approved_at)}</p></> : <span className="text-amber-700">รออนุมัติ</span>}</td>{admin && <td>{!entry.is_approved && <button className="btn !px-3 !py-2" disabled={Boolean(busy)} onClick={() => approve(entry.id)}>{busy === entry.id ? 'กำลังอนุมัติ…' : 'อนุมัติ ✓'}</button>}</td>}</tr>)}</tbody></table></div>{!data.requests.length && <p className="px-5 pb-6 text-sm text-slate-500">ยังไม่มีคำร้องในเดือนนี้</p>}</section>
      <div className="flex items-center justify-between gap-3"><button className="btn-secondary" disabled={page === 0} onClick={() => setPage((n) => n - 1)}>ก่อนหน้า</button><span className="text-sm text-slate-500">หน้า {page + 1} · ตารางละ 50 รายการ</span><button className="btn-secondary" disabled={(page + 1) * 50 >= Math.max(data.logCount, data.requestCount)} onClick={() => setPage((n) => n + 1)}>ถัดไป</button></div>
    </>}
  </div>;
}
