export const COMPANY_NAME = 'บริษัท เคียวเอิ พรีซิชั่น จำกัด';
export const OUTSIDE_MESSAGE = 'ไม่สามารถเข้างานได้เนื่องจากยังไม่ถึงบริษัท';
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const rad = (n) => n * Math.PI / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
export function geofenceConfig(env = process.env) {
  const values = ['COMPANY_LATITUDE', 'COMPANY_LONGITUDE', 'COMPANY_RADIUS_METERS', 'GPS_MAX_ACCURACY_METERS'];
  if (values.some((key) => !env[key]?.trim() || !Number.isFinite(Number(env[key])))) throw new Error('ยังไม่ได้ตั้งค่าพิกัดบริษัท กรุณาติดต่อผู้ดูแลระบบ');
  const [latitude, longitude, radius, maxAccuracy] = values.map((key) => Number(env[key]));
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || radius <= 0 || radius > 5000 || maxAccuracy <= 0 || maxAccuracy > 1000) throw new Error('การตั้งค่าพิกัดบริษัทไม่ถูกต้อง');
  return { latitude, longitude, radius, maxAccuracy };
}
export function checkGeofence(latitude, longitude, accuracy, config) {
  if (![latitude, longitude, accuracy].every(Number.isFinite) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy < 0) return { allowed: false, message: 'พิกัด GPS ไม่ถูกต้อง' };
  if (accuracy > config.maxAccuracy) return { allowed: false, message: 'GPS ยังไม่แม่นยำ กรุณาเปิดตำแหน่งที่ตั้งแบบแม่นยำและลองใหม่' };
  const distance = distanceMeters(latitude, longitude, config.latitude, config.longitude);
  return { allowed: distance <= config.radius, distance, message: distance <= config.radius ? null : OUTSIDE_MESSAGE, locationName: COMPANY_NAME };
}
