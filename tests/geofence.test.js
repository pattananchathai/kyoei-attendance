import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceMeters, checkGeofence, geofenceConfig, OUTSIDE_MESSAGE, COMPANY_LOCATION } from '../lib/geofence.js';
// พิกัดจำลองสำหรับทดสอบเท่านั้น ไม่ใช่พิกัดของบริษัท
const config = { latitude: 13, longitude: 100, radius: 150, maxAccuracy: 100 };
test('ระยะ Haversine และการอยู่ใน/นอกรัศมี', () => {
  assert.equal(distanceMeters(13, 100, 13, 100), 0);
  assert.ok(Math.abs(distanceMeters(0, 0, 1, 0) - 111194.927) < 1);
  assert.equal(checkGeofence(13.0005, 100, 10, config).allowed, true);
  const outside = checkGeofence(14, 100, 10, config);
  assert.equal(outside.allowed, false); assert.equal(outside.message, OUTSIDE_MESSAGE);
  const boundary = distanceMeters(13.001, 100, 13, 100);
  assert.equal(checkGeofence(13.001, 100, 10, { ...config, radius: boundary }).allowed, true);
  assert.equal(checkGeofence(13.001, 100, 10, { ...config, radius: boundary - 0.01 }).allowed, false);
});
test('บล็อก GPS ไม่แม่นยำ พิกัดปลอม NaN และ accuracy ติดลบ', () => {
  assert.equal(checkGeofence(13, 100, 101, config).allowed, false);
  assert.equal(checkGeofence(13, 100, 100, config).allowed, true);
  assert.equal(checkGeofence(NaN, 100, 10, config).allowed, false);
  assert.equal(checkGeofence(91, 100, 10, config).allowed, false);
  assert.equal(checkGeofence(13, 100, -1, config).allowed, false);
  assert.equal(checkGeofence('13', 100, 10, config).allowed, false);
});
test('ใช้พิกัดสำนักงานจาก Google Maps เป็นค่าเริ่มต้นและตรวจค่าที่กำหนดเอง', () => {
  assert.deepEqual(geofenceConfig({}), COMPANY_LOCATION);
  assert.deepEqual(COMPANY_LOCATION, { latitude: 14.0373324, longitude: 100.6088936, radius: 300, maxAccuracy: 100 });
  const env = { COMPANY_LATITUDE: '13', COMPANY_LONGITUDE: '100', COMPANY_RADIUS_METERS: '150', GPS_MAX_ACCURACY_METERS: '100' };
  assert.deepEqual(geofenceConfig(env), config);
  assert.equal(geofenceConfig({ ...env, COMPANY_LATITUDE: '' }).latitude, COMPANY_LOCATION.latitude);
  assert.throws(() => geofenceConfig({ ...env, COMPANY_RADIUS_METERS: '0' }));
  assert.throws(() => geofenceConfig({ ...env, COMPANY_LONGITUDE: 'Infinity' }));
});
test('หมุดสำนักงานผ่าน geofence และจุดห่างเกินรัศมีถูกบล็อก', () => {
  assert.equal(checkGeofence(COMPANY_LOCATION.latitude, COMPANY_LOCATION.longitude, 25, COMPANY_LOCATION).allowed, true);
  assert.equal(checkGeofence(COMPANY_LOCATION.latitude + 0.003, COMPANY_LOCATION.longitude, 25, COMPANY_LOCATION).allowed, false);
});
