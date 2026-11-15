/**
 * Corporate partner schema (Student 1).
 * Company details for a B2B account. Stored inside the user document
 * (user.corporatePartner), so a partner's profile loads in one query.
 * Retail accounts have corporatePartner: null.
 */
import mongoose from 'mongoose';

export const INDUSTRIES = ['Wholesale', 'Hotel', 'Corporate Events', 'Other'];

export const corporatePartnerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, maxlength: 150 },
    industry: { type: String, required: true, enum: INDUSTRIES },
    taxId: { type: String, trim: true, maxlength: 50, default: '' },
    website: { type: String, trim: true, maxlength: 255, default: '' },
  },
  { _id: false }
);
