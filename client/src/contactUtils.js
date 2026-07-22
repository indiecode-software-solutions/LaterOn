export const isPlaceholderContactName = (name, waId = '') => {
  const text = String(name ?? '')
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .trim();
  const idDigits = String(waId ?? '').replace(/\D/g, '');

  if (!text) return true;
  if (idDigits && text.replace(/\D/g, '') === idDigits) return true;

  const compact = text.replace(/\s+/g, '');
  const maskCount = (compact.match(/[.*\u2022\u2219]/g) || []).length;

  if (/^[.*\u2022\u2219]+$/.test(compact)) return true;
  if (/^\+?\d{1,3}[.*\u2022\u2219-]+\d{1,4}$/.test(compact)) return true;
  if (compact.startsWith('+') && maskCount >= 3 && compact.replace(/\D/g, '').length <= 6) return true;

  return false;
};

export const formatPhone = (waId) => {
  const digits = String(waId ?? '').replace(/\D/g, '');
  if (!digits) return String(waId ?? '');

  if (digits.startsWith('91') && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length >= 10) {
    const countryCode = digits.slice(0, digits.length - 10);
    const rest = digits.slice(digits.length - 10);
    return `+${countryCode || '91'} ${rest.slice(0, 5)} ${rest.slice(5)}`;
  }
  return `+${digits}`;
};

export const getContactDisplayName = (contacts, waId) => {
  const id = String(waId ?? '').split('@')[0];
  const contact = contacts?.[id] ?? contacts?.[waId];
  const name = typeof contact === 'object' ? contact.name : contact;

  if (isPlaceholderContactName(name, id)) {
    return formatPhone(id || waId);
  }

  return name || formatPhone(id || waId);
};
