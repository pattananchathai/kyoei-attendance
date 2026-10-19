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
  const tabs = [['history', 'ประวัติและคำร้อง'], ['employees', 'จัดการพนักงาน'], ['notifications', 'ข้อความ LINE']];
  return <div className="w-full min-w-0 max-w-full">
    <p className="mb-2 text-xs font-bold tracking-widest text-brand">ระบบหลังบ้าน</p>
    <h1 className="text-3xl font-bold">ผู้ดูแลระบบ</h1>
    <p className="mb-6 mt-3 text-sm text-slate-500">ดูประวัติการทำงาน พิจารณาคำร้อง และจัดการข้อมูลพนักงาน</p>
    <div className="mb-6 flex w-full min-w-0 flex-wrap gap-2" role="tablist" aria-label="เมนูผู้ดูแลระบบ">
      {tabs.map(([key, label]) => <button key={key} id={`admin-tab-${key}`} role="tab" aria-selected={tab === key} aria-controls="admin-tab-panel" className={tab === key ? 'btn' : 'btn-secondary'} onClick={() => setTab(key)}>{label}</button>)}
    </div>
    <section id="admin-tab-panel" role="tabpanel" aria-labelledby={`admin-tab-${tab}`} className="w-full min-w-0 max-w-full">
      {tab === 'history' ? <HistoryView admin /> : tab === 'employees' ? <EmployeeManager /> : <NotificationManager />}
    </section>
  </div>;
}
