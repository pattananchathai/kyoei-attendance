import 'server-only';
import { createClient } from '@supabase/supabase-js';
let client;
export function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase configuration');
  // Service role อยู่ฝั่งเซิร์ฟเวอร์เท่านั้น ทุกคำขอจำเป็นต้องผ่านการตรวจสิทธิ์
  client ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
