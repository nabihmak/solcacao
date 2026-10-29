/**
 * b2bService - custom quote requests for corporate partners (Student 4).
 *
 * Phase 2: answered by the in-browser mock (b2bMockApi.js).
 * Phase 3: becomes a fetch() call with "Authorization: Bearer <token>":
 *   submitQuoteRequest(values, file) -> POST /api/b2b/quote  (multipart/form-data)
 *     fetch('/api/b2b/quote', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
 *   (do not set Content-Type yourself: the browser adds the multipart boundary)
 */
import * as b2bApi from './b2bMockApi';
import { tokenStorage } from './tokenStorage';

// Builds the same multipart form the real endpoint will receive
export function buildQuoteForm(values, file) {
  const formData = new FormData();
  Object.entries(values).forEach(([name, value]) => formData.append(name, value));
  if (file) formData.append('brandFile', file);
  return formData;
}

export function submitQuoteRequest(values, file) {
  return b2bApi.submitQuote(tokenStorage.get(), buildQuoteForm(values, file));
}

export function fetchMyQuotes() {
  return b2bApi.getMyQuotes(tokenStorage.get());
}
