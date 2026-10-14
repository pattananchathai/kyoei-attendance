'use client';
import { useEffect, useState } from 'react';
import { useApp } from './AppProvider';
import { Notice } from './Notice';
const initial = { line_user_id: '', first_name: '', last_name: '', role: 'employee', status: 'active' };
export function EmployeeManager() {
  const { api } = useApp();
  const [form, setForm] = useState(initial);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { let alive = true; setData(null); api(`/api/admin/employees?page=${page}`).then((result) => { if (alive) setData(result); }).catch((e) => { if (alive) setError(e.message); }); return () => { alive = false; }; }, [api, page, version]);
  async function add(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { await api('/api/admin/employees', { method: 'POST', body: JSON.stringify(form) }); setForm(initial); setVersion((n) => n + 1); setMessage('เพิ่มพนักงานแล้ว'); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function remove(employee) {
    if (!window.confirm(`ลบ ${employee.first_name} ${employee.last_name} พร้อมประวัติลงเวลา คำร้อง และข้อความค้างทั้งหมด? ข้อมูลที่ลบไม่สามารถกู้คืนจากระบบได้`)) return;
    setBusy(true); setError(''); setMessage('');
    try { await api(`/api/admin/employees/${employee.id}`, { method: 'DELETE' }); setVersion((n) => n + 1); setMessage('ลบพนักงานและข้อมูลที่เกี่ยวข้องแล้ว'); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  const change = (key) => (e) => setForm((old) => ({ ...old, [key]: e.target.value }));
  return <div className="space-y-5"><form className="panel" onSubmit={add}><h2 className="mb-5 font-bold">เพิ่มรายชื่อพนักงาน</h2><div className="grid gap-4 sm:grid-cols-2"><label className="label sm:col-span-2">รหัสผู้ใช้ LINE<input className="input" required pattern="U[0-9a-f]{32}" maxLength={33} value={form.line_user_id} onChange={change('line_user_id')} placeholder="ให้พนักงานส่งรหัสจากหน้า LIFF หรือพิมพ์ รหัสพนักงาน ในแชท OA" /></label><label className="label">ชื่อจริง<input className="input" required maxLength={100} value={form.first_name} onChange={change('first_name')} /></label><label className="label">นามสกุลจริง<input className="input" required maxLength={100} value={form.last_name} onChange={change('last_name')} /></label><label className="label">สิทธิ์<select className="input" value={form.role} onChange={change('role')}><option value="employee">พนักงาน</option><option value="admin">ผู้ดูแลระบบ</option></select></label><label className="label">สถานะ<select className="input" value={form.status} onChange={change('status')}><option value="active">ใช้งาน</option><option value="inactive">ไม่ใช้งาน</option></select></label></div><button className="btn mt-5" disabled={busy}>{busy ? 'กำลังดำเนินการ…' : 'เพิ่มพนักงาน'}</button></form>
    <Notice message={error} error /><Notice message={message} />
    <section className="panel !p-0 overflow-hidden"><h2 className="p-5 font-bold">รายชื่อพนักงาน {data ? `(${data.count})` : ''}</h2><div className="overflow-x-auto"><table className="w-full"><thead><tr><th>ชื่อจริง นามสกุลจริง</th><th>รหัสผู้ใช้ LINE</th><th>สิทธิ์ / สถานะ</th><th>จัดการ</th></tr></thead><tbody>{data?.employees.map((employee) => <tr key={employee.id}><td className="min-w-40">{employee.first_name} {employee.last_name}</td><td className="font-mono text-xs">{employee.line_user_id}</td><td>{employee.role === 'admin' ? 'ผู้ดูแล' : 'พนักงาน'} / {employee.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</td><td><button className="btn-secondary !border-red-200 !text-red-700" disabled={busy} onClick={() => remove(employee)}>ลบ</button></td></tr>)}</tbody></table></div>{!data && <p className="p-5" role="status">กำลังโหลด…</p>}</section>
    {data && <div className="flex items-center justify-between"><button className="btn-secondary" disabled={!page} onClick={() => setPage((n) => n - 1)}>ก่อนหน้า</button><span className="text-sm">หน้า {page + 1}</span><button className="btn-secondary" disabled={(page + 1) * 50 >= data.count} onClick={() => setPage((n) => n + 1)}>ถัดไป</button></div>}
  </div>;
}
