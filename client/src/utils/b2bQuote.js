/**
 * b2bQuote.js - options and validation rules for the B2B custom quote wizard (Student 4).
 *
 * The same rules run in the browser (QuoteWizard) and in the Phase 2 data layer
 * (b2bMockApi.js). In Phase 3 the Express route repeats them on the server.
 * Every error is a translation key, e.g. 'b2b.errors.required'.
 */
import { PRODUCTS } from '../data/products';

// Cacao origins come from the catalog, so the wizard and the shop always match
export const ORIGINS = [...new Set(PRODUCTS.map((product) => product.origin))].sort();

// Chocolate styles a partner can start from (from Student 4's first design)
export const CHOCOLATE_STYLES = ['dark', 'milk', 'white', 'creamy', 'velvet', 'mint', 'custom'];

export const PACKAGING_TYPES = ['giftBox', 'whiteLabel', 'tin', 'eco'];

export const MIN_PCT = 35;
export const MAX_PCT = 100;
export const MIN_QUANTITY = 100; // smallest wholesale run
export const MAX_QUANTITY = 100000;

// Brand vectors or tech packs
export const FILE_EXTENSIONS = ['pdf', 'svg', 'ai', 'eps', 'png'];
export const MAX_FILE_MB = 10;

// Which fields belong to which step (used to jump back to the step that has an error)
export const STEP_FIELDS = [
  ['cacaoOrigin', 'cacaoPercentage', 'chocolateStyle'],
  ['brandFile'],
  ['packagingType', 'quantity', 'deliveryDate', 'packagingNotes'],
  ['notes'],
];

export const EMPTY_QUOTE = {
  cacaoOrigin: '',
  cacaoPercentage: '70',
  chocolateStyle: '',
  packagingType: '',
  quantity: '',
  deliveryDate: '',
  packagingNotes: '',
  notes: '',
};

const isWholeNumber = (value) => /^\d+$/.test(String(value).trim());

// Today's date as "YYYY-MM-DD" in local time (the format of <input type="date">)
export function todayString(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function fileExtension(name = '') {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

/**
 * Checks one step of the wizard.
 * values - the form values (strings, as they come from the inputs)
 * file   - { name, size } of the uploaded file, or null
 * Returns { field: 'b2b.errors.key' } for every problem (empty object = step is fine).
 */
export function validateStep(step, values, file, today = todayString()) {
  const errors = {};

  if (step === 0) {
    if (!ORIGINS.includes(values.cacaoOrigin)) errors.cacaoOrigin = 'b2b.errors.origin';
    const pct = Number(values.cacaoPercentage);
    if (!isWholeNumber(values.cacaoPercentage) || pct < MIN_PCT || pct > MAX_PCT) {
      errors.cacaoPercentage = 'b2b.errors.percentage';
    }
    if (!CHOCOLATE_STYLES.includes(values.chocolateStyle)) errors.chocolateStyle = 'b2b.errors.style';
  }

  if (step === 1) {
    if (!file) errors.brandFile = 'b2b.errors.fileRequired';
    else if (!FILE_EXTENSIONS.includes(fileExtension(file.name))) errors.brandFile = 'b2b.errors.fileType';
    else if (file.size > MAX_FILE_MB * 1024 * 1024) errors.brandFile = 'b2b.errors.fileSize';
  }

  if (step === 2) {
    if (!PACKAGING_TYPES.includes(values.packagingType)) errors.packagingType = 'b2b.errors.packaging';
    const quantity = Number(values.quantity);
    if (!isWholeNumber(values.quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
      errors.quantity = 'b2b.errors.quantity';
    }
    // Optional, but if given it must be after today ("YYYY-MM-DD" strings compare correctly)
    if (values.deliveryDate && !(values.deliveryDate > today)) errors.deliveryDate = 'b2b.errors.date';
    if (values.packagingNotes.length > 500) errors.packagingNotes = 'b2b.errors.tooLong';
  }

  if (step === 3) {
    if (values.notes.length > 2000) errors.notes = 'b2b.errors.tooLong';
  }

  return errors;
}

// Checks every step at once (used before sending the request)
export function validateQuote(values, file, today = todayString()) {
  return STEP_FIELDS.reduce((all, _fields, step) => ({ ...all, ...validateStep(step, values, file, today) }), {});
}

// The first step that contains one of the given error fields (or -1)
export function stepWithError(errors) {
  return STEP_FIELDS.findIndex((fields) => fields.some((field) => field in errors));
}
