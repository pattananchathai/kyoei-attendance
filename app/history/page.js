'use client';
import { HistoryView } from '@/components/HistoryView';
export default function HistoryPage() {
  return <div><p className="mb-2 text-xs font-bold tracking-widest text-brand">ข้อมูลการทำงานของฉัน</p><h1 className="mb-3 text-3xl font-bold">ประวัติของฉัน</h1><p className="mb-7 text-sm text-slate-500">ตรวจสอบการลงเวลา คำร้องลางาน และการอนุมัติ OT</p><HistoryView /></div>;
}
