import { Router } from 'express';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

export const STUDENT5_TYPES = ['contact', 'feedback', 'sampler'];
const FLAVORS = ['dark70', 'dark85', 'milk', 'orange', 'coffee', 'seaSalt'];
const CATEGORIES = ['support', 'wholesale', 'order', 'other'];

export function validateInquiry(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { body: 'Invalid JSON object' };
  if (!STUDENT5_TYPES.includes(input.type)) errors.type = 'Invalid request type';
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 80) errors.name = 'Name must be 1–80 characters';
  if (typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Invalid email';
  if (!CATEGORIES.includes(input.category)) errors.category = 'Invalid category';
  if (typeof input.message !== 'string' || input.message.trim().length < 10 || input.message.length > 2000) errors.message = 'Message must be 10–2000 characters';
  if (input.consent !== true) errors.consent = 'Consent is required';
  if (input.type === 'feedback' && !['1','2','3','4','5'].includes(String(input.rating))) errors.rating = 'Rating must be 1–5';
  if (input.type === 'sampler') {
    if (!Array.isArray(input.flavors) || input.flavors.length !== 3 || new Set(input.flavors).size !== 3 || input.flavors.some(f => !FLAVORS.includes(f))) errors.flavors = 'Choose three distinct flavors';
    if (!Number.isInteger(Number(input.quantity)) || !String(input.quantity ?? '').trim() || Number(input.quantity) < 1 || Number(input.quantity) > 50) errors.quantity = 'Quantity must be 1–50';
  }
  return errors;
}

export function makeStudent5Router({ getCollection, sendNotification } = {}) {
  const router = Router();
  router.post('/submissions', async (req, res) => {
    const errors = validateInquiry(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ ok: false, errors });
    const { type, name, email, category, message, consent, rating, flavors, quantity } = req.body;
    const record = {
      type, name: name.trim(), email: email.trim().toLowerCase(), category,
      message: message.trim(), consent, createdAt: new Date(),
      ...(type === 'feedback' ? { rating: Number(rating) } : {}),
      ...(type === 'sampler' ? { flavors, quantity: Number(quantity) } : {}),
      emailStatus: 'pending'
    };
    try {
      const collection = await getCollection();
      const result = await collection.insertOne(record);
      const id = String(result.insertedId);
      let emailStatus = 'not-configured';
      if (sendNotification) {
        try { await sendNotification(record); emailStatus = 'sent'; }
        catch (err) { emailStatus = 'failed'; console.error('Student 5 email delivery failed:', err.message); }
      }
      try { await collection.updateOne({ _id: result.insertedId }, { $set: { emailStatus } }); }
      catch (err) { console.error('Student 5 notification status update failed:', err.message); }
      return res.status(201).json({ ok: true, id, emailStatus, message: 'Your request has been received' });
    } catch (err) {
      console.error('Student 5 submission failed:', err.message);
      return res.status(503).json({ ok: false, error: 'Submission service unavailable. Please try again.' });
    }
  });
  return router;
}

let client;
export async function student5Collection() {
  const uri = process.env.MONGO_CONNECTION_STRING || process.env.MONGODB_URI;
  if (!uri) throw new Error('MongoDB connection string is not configured');
  if (!client) client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  return client.db(process.env.STUDENT5_DB_NAME || 'solcacao').collection('student5_submissions');
}


const FLAVOR_LABELS = {
  dark70: '70% Dark Chocolate',
  dark85: '85% Dark Chocolate',
  milk: 'Milk Chocolate',
  orange: 'Orange Chocolate',
  coffee: 'Coffee Chocolate',
  seaSalt: 'Sea Salt Chocolate'
};

function safeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;'
  })[c]);
}

function makeEmailHtml(title, greeting, introduction, details, message, closing) {
  const rows = details.map(([label, value]) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #ddd;font-weight:bold">
        ${safeHtml(label)}
      </td>
      <td style="padding:12px;border-bottom:1px solid #ddd">
        ${safeHtml(value)}
      </td>
    </tr>
  `).join('');

  return `
    <div style="background:#f5f6f3;padding:24px;font-family:Arial,sans-serif;color:#24382d">
      <div style="max-width:600px;margin:auto;background:white">
        <div style="background:#173f32;color:white;text-align:center;padding:28px">
          <h1 style="margin:0">SolCacao</h1>
          <p>${safeHtml(title)}</p>
        </div>
        <div style="padding:26px">
          <p><strong>${safeHtml(greeting)}</strong></p>
          <p style="line-height:1.7">${safeHtml(introduction)}</p>
          <h3>Submission Details</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${rows}
          </table>
          <h3>Message</h3>
          <div style="background:#f3f5f1;padding:15px;white-space:pre-wrap;overflow-wrap:anywhere">${safeHtml(message)}</div>
          <p style="line-height:1.7">${safeHtml(closing)}</p>
          <p>Best regards,<br><strong>SolCacao Team</strong></p>
        </div>
      </div>
    </div>`;
}

export async function student5Mail(record) {
  const {
    SMTP_HOST, SMTP_PORT, SMTP_USER,
    SMTP_PASSWORD, SMTP_FROM, SUPPORT_EMAIL
  } = process.env;

  if (![SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SUPPORT_EMAIL].every(Boolean)) {
    throw new Error('SMTP configuration incomplete');
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  });

  const details = [
    ['Name', record.name],
    ['Email', record.email],
    ['Category', record.category],
    ['Submitted', new Date(record.createdAt).toLocaleString('en-US', {
      timeZone: 'America/Chicago'
    })]
  ];

  let title, adminSubject, userSubject, adminIntro, userIntro, userClosing;

  if (record.type === 'contact') {
    title = 'CONTACT REQUEST';
    adminSubject = 'SolCacao | New Contact Request';
    userSubject = 'SolCacao | Contact Request Received';
    adminIntro = 'A new contact inquiry has been submitted through the SolCacao website.';
    userIntro = 'Thank you for contacting SolCacao. We have received your inquiry.';
    userClosing = 'Our team will review your message and respond as soon as possible.';
  } else if (record.type === 'feedback') {
    title = 'CUSTOMER FEEDBACK';
    adminSubject = 'SolCacao | New Customer Feedback';
    userSubject = 'SolCacao | Thank You for Your Feedback';
    adminIntro = 'New customer feedback has been submitted through the SolCacao website.';
    userIntro = 'Thank you for sharing your feedback. Your suggestions help us improve our products and services.';
    userClosing = 'We appreciate your feedback and will review it carefully.';
    details.push(['Rating', `${record.rating}/5`]);
  } else if (record.type === 'sampler') {
    title = 'SAMPLER REQUEST';
    adminSubject = 'SolCacao | New Sampler Request';
    userSubject = 'SolCacao | Sampler Request Received';
    adminIntro = 'A new chocolate sampler request has been submitted through the SolCacao website.';
    userIntro = 'Thank you for your interest in SolCacao. We have received your sampler request and selected preferences.';
    userClosing = 'Our team will review your request and contact you about the next steps. This is not an order or shipping confirmation.';
    details.push(
      ['Selected Flavors', record.flavors.map(f => FLAVOR_LABELS[f] || f).join(', ')],
      ['Quantity', record.quantity]
    );
  } else {
    throw new Error('Invalid submission type');
  }

  const adminHtml = makeEmailHtml(
    title,
    'Hello SolCacao Team,',
    adminIntro,
    [...details, ['Consent', record.consent ? 'Yes' : 'No']],
    record.message,
    'Please review this submission.'
  );

  const userHtml = makeEmailHtml(
    `${title} CONFIRMATION`,
    `Hello ${record.name},`,
    userIntro,
    details,
    record.message,
    userClosing
  );

  await transport.sendMail({
    from: SMTP_FROM,
    to: SUPPORT_EMAIL,
    replyTo: record.email,
    subject: adminSubject,
    html: adminHtml
  });

  await transport.sendMail({
    from: SMTP_FROM,
    to: record.email,
    subject: userSubject,
    html: userHtml
  });
}

