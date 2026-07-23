function normalizeWhatsAppJid(rawValue, defaultCountryCode = '91') {
  if (!rawValue) return null;

  const value = String(rawValue).trim();
  if (!value) return null;

  if (value.includes('@')) {
    return value;
  }

  let digits = value.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }

  return `${digits}@s.whatsapp.net`;
}

function isSocketReadyForMessaging(sock) {
  if (!sock || !sock.user) return false;
  if (!sock.ws || sock.ws.readyState !== 1) return false;
  return true;
}

module.exports = {
  normalizeWhatsAppJid,
  isSocketReadyForMessaging
};
