'use client';

const topics = [
  {
    number: '01',
    title: 'Vercel คืออะไร? ใช้ทำอะไร?',
    accent: 'bg-sky-50 text-sky-700',
    summary: 'แพลตฟอร์มสำหรับนำเว็บไซต์ขึ้นใช้งานบนอินเทอร์เน็ต',
    details: [
      'เก็บชุดเว็บไซต์ที่พร้อมเผยแพร่และให้บริการผ่านลิงก์ออนไลน์',
      'เมื่อพุชโค้ดชุดใหม่ ระบบสามารถสร้างและเผยแพร่เวอร์ชันใหม่ให้อัตโนมัติ',
    ],
    symbol: '↗',
  },
  {
    number: '02',
    title: 'Supabase คืออะไร? ใช้ทำอะไร?',
    accent: 'bg-emerald-50 text-emerald-700',
    summary: 'ฐานข้อมูลออนไลน์ส่วนกลางของระบบ',
    details: [
      'เก็บข้อมูลการลงเวลา ประวัติการลา และคำร้องต่าง ๆ ของพนักงาน',
      'เชื่อมต่อกับเว็บไซต์เพื่อบันทึกและเรียกข้อมูลมาแสดงผล',
    ],
    symbol: '▤',
  },
  {
    number: '03',
    title: 'ระบบพัฒนาด้วยภาษาและเครื่องมืออะไร?',
    accent: 'bg-violet-50 text-violet-700',
    summary: 'ใช้เครื่องมือหลัก 3 ส่วนทำงานร่วมกัน',
    details: [
      'JavaScript และ Next.js: สร้างโครงสร้างและหน้าจอเว็บไซต์ รวมถึงรองรับการใช้งานผ่าน LINE OA',
      'Tailwind CSS: จัดรูปแบบ สี ระยะห่าง และความกว้างให้หน้าจอใช้งานง่ายบนมือถือ',
    ],
    symbol: '</>',
  },
];

function PrintButton() {
  return (
    <button className="btn print-hidden" onClick={() => window.print()} type="button">
      พิมพ์ / บันทึกเป็น PDF
    </button>
  );
}

export default function GuidePage() {
  return (
    <article className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print-hidden">
        <p className="text-sm text-slate-500">เอกสารสำหรับเพื่อนร่วมทีม</p>
        <PrintButton />
      </div>

      <header className="mb-6 rounded-3xl bg-slate-900 px-6 py-8 text-white sm:px-9 sm:py-10">
        <p className="mb-3 text-xs font-bold tracking-[0.18em] text-emerald-300">บริษัท เคียวเออิ พรีซิชั่น จำกัด</p>
        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">คู่มือภาพรวมระบบ</h1>
        <p className="mt-2 text-sm text-slate-300">ฉบับเข้าใจง่าย · ระบบเช็คชื่อพนักงานผ่าน LINE OA</p>
      </header>

      <div className="space-y-4">
        {topics.map((topic) => (
          <section key={topic.number} className="guide-card panel flex gap-4 sm:gap-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${topic.accent}`} aria-hidden="true">
              {topic.symbol}
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-xs font-bold tracking-wider text-slate-400">หัวข้อ {topic.number}</p>
              <h2 className="text-lg font-bold leading-snug text-slate-900">{topic.title}</h2>
              <p className="mt-2 text-sm font-medium text-slate-700">{topic.summary}</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
                {topic.details.map((detail) => <li key={detail} className="flex gap-2"><span className="mt-0.5 text-emerald-600" aria-hidden="true">✓</span><span>{detail}</span></li>)}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <section className="guide-card mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:p-6">
        <h2 className="font-bold text-emerald-950">สรุปการทำงาน</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          พนักงานใช้งานหน้าเว็บผ่าน LINE OA → Next.js แสดงหน้าจอและจัดการการทำงานของระบบ → Supabase เก็บข้อมูล → Vercel เผยแพร่เว็บไซต์ให้เปิดใช้งานผ่านอินเทอร์เน็ต
        </p>
      </section>

      <p className="mt-6 text-center text-xs text-slate-400">เอกสารสรุปสำหรับทีมงาน · บริษัท เคียวเออิ พรีซิชั่น จำกัด</p>
    </article>
  );
}
