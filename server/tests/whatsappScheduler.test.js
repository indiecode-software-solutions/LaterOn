const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeWhatsAppJid, isSocketReadyForMessaging } = require('../services/whatsappScheduler');

test('normalizeWhatsAppJid keeps existing JIDs intact', () => {
  assert.equal(normalizeWhatsAppJid('919999999999@s.whatsapp.net'), '919999999999@s.whatsapp.net');
  assert.equal(normalizeWhatsAppJid('123456789@g.us'), '123456789@g.us');
});

test('normalizeWhatsAppJid converts local numbers into WhatsApp JIDs with country code', () => {
  assert.equal(normalizeWhatsAppJid('+91 99999 99999'), '919999999999@s.whatsapp.net');
  assert.equal(normalizeWhatsAppJid('9999999999'), '919999999999@s.whatsapp.net');
  assert.equal(normalizeWhatsAppJid('09999999999'), '919999999999@s.whatsapp.net');
});

test('isSocketReadyForMessaging requires an authenticated socket with an open WebSocket', () => {
  assert.equal(isSocketReadyForMessaging(null), false);
  assert.equal(isSocketReadyForMessaging({ user: null, ws: { readyState: 1 } }), false);
  assert.equal(isSocketReadyForMessaging({ user: { id: '123' }, ws: { readyState: 1 } }), true);
  assert.equal(isSocketReadyForMessaging({ user: { id: '123' }, ws: { readyState: 0 } }), false);
});
