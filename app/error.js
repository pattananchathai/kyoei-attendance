'use client';
export default function ErrorPage({ reset }) { return <div className="panel"><p role="alert">ไม่สามารถแสดงหน้านี้ได้ กรุณาลองอีกครั้ง</p><button onClick={reset} className="btn mt-4">ลองอีกครั้ง</button></div>; }
