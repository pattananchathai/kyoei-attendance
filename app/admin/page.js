'use client';
import { useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { HistoryView } from '@/components/HistoryView';
import { EmployeeManager } from '@/components/EmployeeManager';
import { NotificationManager } from '@/components/NotificationManager';
export default function AdminPage() {
  const { employee } = useApp();
  const [tab, setTab] = useState('history');
  if (employee?.role !== 'admin') return <p role="alert" className="panel text-red-700">เฉพาะผู้ดูแลระบบเท่านั้น</p>;
  return <div><p className="mb-2 text-xs font-bold tracking-widest text-brand">ระบบหลังบ้าน</p><h1 className="text-3xl font-bold">ผู้ดูแลระบบ</h1><p className="mb-6 mt-3 text-sm text-slate-500">ตรวจประวัติ อนุมัติคำร้อง และจัดการรายชื่อพนักงาน</p><div className="mb-6 flex flex-wrap gap-2" aria-label="เมนูผู้ดูแล">{[['history', 'ประวัติและอนุมัติ'], ['employees', 'จัดการพนักงาน'], ['notifications', 'ข้อความ LINE']].map(([key, label]) => <button key={key} className={tab === key ? 'btn' : 'btn-secondary'} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>{tab === 'history' ? <HistoryView admin /> : tab === 'employees' ? <EmployeeManager /> : <NotificationManager />}</div>;
}
