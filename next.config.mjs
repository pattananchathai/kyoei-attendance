const nextConfig = {
  poweredByHeader: false,
  // ไม่ใช้ Image Optimizer ในระบบนี้ ลดพื้นที่โจมตีของ Next.js 14 รุ่นเดิม
  images: { unoptimized: true },
  experimental: { cpus: 2 },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
      { key: 'X-Frame-Options', value: 'DENY' }
    ] }];
  }
};
export default nextConfig;
