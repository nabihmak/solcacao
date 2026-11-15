/**
 * User model (Student 1).
 * One document per account, Retail (personal) or B2B (corporate partner).
 * The password is only ever stored as a bcrypt hash and is left out of
 * queries unless asked for with .select('+passwordHash').
 */
import mongoose from 'mongoose';
import { corporatePartnerSchema } from './CorporatePartner.js';

export const ACCOUNT_TYPES = ['Retail', 'B2B'];
export const LANGUAGES = ['en', 'es'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    accountType: { type: String, required: true, enum: ACCOUNT_TYPES, default: 'Retail' },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    preferredLanguage: { type: String, enum: LANGUAGES, default: 'en' },
    corporatePartner: { type: corporatePartnerSchema, default: null },
  },
  { timestamps: true, versionKey: false }
);

// A B2B account must have company details; a Retail account must not
userSchema.pre('validate', function checkCompany() {
  if (this.accountType === 'B2B' && !this.corporatePartner) {
    this.invalidate('corporatePartner', 'B2B accounts need company details');
  }
  if (this.accountType === 'Retail') this.corporatePartner = null;
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
