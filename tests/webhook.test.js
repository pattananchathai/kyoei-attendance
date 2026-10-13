import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifySignature } from '../lib/webhookSignature.js';
test('เว็บฮุคต้องมีลายเซ็นตรงกับ raw body และ secret', () => {
  const body = '{"events":[]}';
  const signature = createHmac('sha256', 'test-secret').update(body).digest('base64');
  assert.equal(verifySignature(body, signature, 'test-secret'), true);
  assert.equal(verifySignature(body + ' ', signature, 'test-secret'), false);
  assert.equal(verifySignature(body, signature, 'wrong'), false);
  assert.equal(verifySignature(body, 'invalid', 'test-secret'), false);
  assert.equal(verifySignature(body, null, 'test-secret'), false);
  assert.equal(verifySignature(body, signature, ''), false);
});
