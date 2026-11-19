// Phase 2 validation is client-side only. Repeat validation on the Phase 3 server.
export const FLAVORS = ['dark70', 'dark85', 'milk', 'orange', 'coffee', 'seaSalt'];
export function validateSupport(data, type) {
  const errors = {};
  if (!data.name.trim() || data.name.trim().length > 80) errors.name = 'nameError';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || data.email.length > 254) errors.email = 'emailError';
  if (!['support', 'wholesale', 'order', 'other'].includes(data.category)) errors.category = 'categoryError';
  if (data.message.trim().length < 10 || data.message.length > 2000) errors.message = 'messageError';
  if (!data.consent) errors.consent = 'consentError';
  if (type === 'feedback' && !['1', '2', '3', '4', '5'].includes(data.rating)) errors.rating = 'ratingError';
  if (type === 'sampler' && (data.flavors.length !== 3 || new Set(data.flavors).size !== 3 || data.flavors.some(f => !FLAVORS.includes(f)))) errors.flavors = 'flavorsError';
  if (type === 'sampler' && (!Number.isInteger(Number(data.quantity)) || Number(data.quantity) < 1 || Number(data.quantity) > 50)) errors.quantity = 'quantityError';
  return errors;
}
export function whatsappUrl(phone, message) {
  return /^[1-9]\d{7,14}$/.test(phone || '') ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;
}
export function saveDemoSubmission(data, type, storage = window.sessionStorage) {
  // Store only a non-sensitive receipt, never contact details or messages.
  const receipt = { type, createdAt: new Date().toISOString(), status: 'demo-only' };
  storage.setItem('solcacao-support-receipt', JSON.stringify(receipt));
  return receipt;
}
