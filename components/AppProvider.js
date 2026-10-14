'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
const AppContext = createContext(null);
export function AppProvider({ children }) {
  const liffRef = useRef(null);
  const [state, setState] = useState({ loading: true, error: '', employee: null, line_user_id: null });
  const api = useCallback(async (path, options = {}) => {
    const token = liffRef.current?.getIDToken();
    if (!token) throw new Error('กรุณาเข้าสู่ระบบผ่าน LINE');
    const response = await fetch(path, { ...options, cache: 'no-store', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'ระบบขัดข้อง');
    return data;
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!process.env.NEXT_PUBLIC_LIFF_ID) throw new Error('ยังไม่ได้ตั้งค่า LIFF ID กรุณาติดต่อผู้ดูแลระบบ');
      const { default: liff } = await import('@line/liff');
      await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID });
      liffRef.current = liff;
      if (!liff.isLoggedIn()) { liff.login({ redirectUri: window.location.href }); return; }
      const profile = await api('/api/me');
      if (alive) setState({ ...profile, loading: false, error: '' });
    })().catch((error) => { if (alive) setState((old) => ({ ...old, loading: false, error: error.message })); });
    return () => { alive = false; };
  }, [api]);
  function relogin() {
    const liff = liffRef.current;
    if (liff) { if (liff.isLoggedIn()) liff.logout(); liff.login({ redirectUri: window.location.href }); }
    else window.location.reload();
  }
  function closeLiff() {
    const liff = liffRef.current;
    if (!liff?.isInClient()) return false;
    liff.closeWindow();
    return true;
  }
  return <AppContext.Provider value={{ ...state, api, relogin, closeLiff }}>{children}</AppContext.Provider>;
}
export function useApp() { return useContext(AppContext); }
