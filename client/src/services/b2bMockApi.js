/**
 * b2bMockApi.js - PHASE 2 ONLY: stand-in for the B2B quote endpoint (Student 4).
 *
 * Works like services/mockApi.js (Student 1) and catalogMockApi.js (Student 3):
 * it answers like the planned REST endpoint, with the same data and error codes,
 * so in Phase 3 only b2bService.js changes to a fetch() call.
 *
 *   submitQuote(token, formData) -> POST /api/b2b/quote   (multipart form: fields + brandFile)
 *     201 { request }   created
 *     400 { errors }    a field is missing or wrong
 *     401               not signed in
 *     403               signed in, but not a corporate (B2B) partner
 *   getMyQuotes(token)  -> GET /api/b2b/quotes            (200 { requests })
 *
 * Only the file's name, type and size are kept. The file itself is not stored in the
 * browser; in Phase 3 the server saves it with multer (local disk or S3).
 */
import { getMe } from './mockApi';
import { validateQuote } from '../utils/b2bQuote';

const QUOTES_KEY = 'solcacao_mock_quotes';
const DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 400;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function apiError(status, message, errors = []) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

let memoryQuotes = [];

function readQuotes() {
  try {
    return JSON.parse(localStorage.getItem(QUOTES_KEY)) || [];
  } catch {
    return memoryQuotes;
  }
}

function writeQuotes(quotes) {
  memoryQuotes = quotes;
  try {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  } catch {
    /* keep the in-memory copy */
  }
}

// Signed-in corporate partner, like the real "protect" + "partnerOnly" middleware
async function requirePartner(token) {
  const { user } = await getMe(token); // throws 401 for a missing or expired token
  if (user.accountType !== 'B2B') throw apiError(403, 'Corporate partners only');
  return user;
}

export async function submitQuote(token, formData) {
  await wait(DELAY_MS);
  const user = await requirePartner(token);

  // Read the multipart form the same way the server will (all fields arrive as text)
  const text = (name) => String(formData.get(name) ?? '').trim();
  const values = {
    cacaoOrigin: text('cacaoOrigin'),
    cacaoPercentage: text('cacaoPercentage'),
    chocolateStyle: text('chocolateStyle'),
    packagingType: text('packagingType'),
    quantity: text('quantity'),
    deliveryDate: text('deliveryDate'),
    packagingNotes: text('packagingNotes'),
    notes: text('notes'),
  };
  const upload = formData.get('brandFile');
  const file = upload && typeof upload === 'object' && upload.name ? upload : null;

  const failed = validateQuote(values, file);
  const errors = Object.entries(failed).map(([field, message]) => ({ field, message }));
  if (errors.length) throw apiError(400, 'Validation failed', errors);

  const quotes = readQuotes();
  const now = new Date();
  const request = {
    _id: `q-${now.getTime().toString(36)}`,
    reference: `SC-${now.getFullYear()}-${String(quotes.length + 1).padStart(4, '0')}`,
    userId: user._id,
    companyName: user.corporatePartner?.companyName || '',
    cacaoOrigin: values.cacaoOrigin,
    cacaoPercentage: Number(values.cacaoPercentage),
    chocolateStyle: values.chocolateStyle,
    packagingType: values.packagingType,
    quantity: Number(values.quantity),
    deliveryDate: values.deliveryDate || null,
    packagingNotes: values.packagingNotes,
    notes: values.notes,
    file: { originalName: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size },
    status: 'submitted',
    createdAt: now.toISOString(),
  };
  writeQuotes([...quotes, request]);
  return { request }; // 201 Created in the real API
}

export async function getMyQuotes(token) {
  await wait(DELAY_MS);
  const user = await requirePartner(token);
  const requests = readQuotes()
    .filter((quote) => quote.userId === user._id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { requests };
}

// Test helper: empties the stored quote requests
export function resetQuotes() {
  writeQuotes([]);
}
