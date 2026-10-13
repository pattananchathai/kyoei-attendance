import './globals.css';
import { AppProvider } from '@/components/AppProvider';
import { Shell } from '@/components/Shell';
export const metadata = { title: 'KYOEI • ระบบเช็คชื่อพนักงาน', description: 'ระบบลงเวลาและคำร้องผ่าน LINE OA บริษัท เคียวเอิ พรีซิชั่น จำกัด', robots: { index: false, follow: false } };
export default function RootLayout({ children }) {
  return <html lang="th"><body><AppProvider><Shell>{children}</Shell></AppProvider></body></html>;
}
