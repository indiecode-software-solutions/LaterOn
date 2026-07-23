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

function isSocketReadyForMessaging(sock, connectionStatus) {
  if (!sock || !sock.user || !sock.user.id) return false;
  // Socket must be in 'open' connection state, not just authenticated
  if (connectionStatus !== 'open') return false;
  return true;
}

module.exports = {
  normalizeWhatsAppJid,
  isSocketReadyForMessaging
};
