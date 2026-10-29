# Student 5 through Phase 2

This delivery implements Student 5's frontend work on the supplied development snapshot. It follows the course syllabus Phase 2 (frontend), rather than the blueprint's different phase numbering. Existing teammates' pages are preserved; catalog, B2B and home placeholders remain outside Student 5's scope. This is not a claim that the entire team's Phase 2 is complete.

## Run on macOS

Install Node.js 22 LTS or newer. Open the extracted solcacao-development folder in VS Code. In Terminal 1:

```bash
cd client
npm ci
npm run dev
```

Open http://localhost:5173/en/contact. Leave Terminal 1 running. In a second terminal, open the same project folder and run:

```bash
cd client
npm test
npm run build
```

Stop the dev server with Control+C. No MongoDB, SMTP, API server, or second service is needed for this phase.

## Features and routes

All routes support /en and /es. Footer links and the contact sidebar expose the new pages.

- /contact: category, contact information, message, demo acknowledgement and field validation.
- /feedback: the contact fields plus a required rating from 1 to 5.
- /sampler: exactly three distinct flavors, 1–50 whole sampler boxes, live selection summary and validated inquiry fields.
- /about: project and brand introduction without invented business contact details.
- /faq: keyboard-operable native details/summary sections.

Forms use React state. Submitting a valid form stores only a type/time/status receipt in sessionStorage, never the name, email, or message. There is no email delivery, order processing or server persistence. Clear form resets the current form. Fields are not persisted after navigating away. English and Spanish text is in the existing locale dictionaries.

WhatsApp is an optional external messaging link. Copy client/.env.example to client/.env.local, set VITE_WHATSAPP_NUMBER to a real verified business number with country code and digits only, and restart Vite. Until configured, a truthful unavailable notice is shown. The link opens WhatsApp with generic localized text; it never automatically sends a message or includes form data.

## Phase 3 handoff

Add Express routes, server-side validation, database persistence and Nodemailer on the server. Never put SMTP passwords in VITE variables. Replace demo receipt behavior only after the real API is tested. Confirm with the instructor whether the syllabus SQL requirement supersedes the blueprint's MongoDB choice. No backend is included in this Phase 2 delivery.

## GitHub contribution

Do not commit directly to main or development. If you already have the team's cloned repository, begin there with a clean working tree:

```bash
git status
git switch development
git pull --ff-only origin development
git switch -c student5-phase2
```

Copy only the files listed below from this ZIP into matching locations in your clone. If teammates changed one of these files since this ZIP's starting snapshot, merge your Student 5 additions into that file rather than replacing their newer edits.

New files: client/.env.example; client/src/utils/support.js; client/src/utils/support.test.js; client/src/components/support/SupportForm.test.jsx; client/src/components/support/SupportForm.jsx; client/src/pages/SupportPage.jsx; client/src/pages/InfoPage.jsx; docs/STUDENT5_PHASE2.md; docs/ACCESSIBILITY_PHASE2.md; docs/AI_USAGE_LOG_PHASE2.docx.

Modified files: README.md; client/src/App.jsx; client/src/pages/ContactPage.jsx; client/src/components/layout/Footer.jsx; client/src/i18n/locales/en.json; client/src/i18n/locales/es.json.

Then run:

```bash
cd client
npm ci
npm test
npm run build
cd ..
git diff --check
git diff --stat
git add README.md client/src/components/support/SupportForm.test.jsx client/.env.example client/src/utils/support.js client/src/utils/support.test.js client/src/components/support/SupportForm.jsx client/src/pages/SupportPage.jsx client/src/pages/InfoPage.jsx client/src/pages/ContactPage.jsx client/src/App.jsx client/src/components/layout/Footer.jsx client/src/i18n/locales/en.json client/src/i18n/locales/es.json docs/
git diff --cached
git commit -m "Implement Student 5 Phase 2 contact feedback and sampler UI"
git push -u origin student5-phase2
```

Open GitHub and create a pull request with base development and compare student5-phase2. Request a teammate review. Do not commit .env.local, node_modules, or dist. If you do not yet have a clone, first run `git clone YOUR_TEAM_REPOSITORY_URL` and enter the created directory; replace the placeholder with the actual GitHub URL. This archive intentionally contains no .git history and no configured origin.

## AI disclosure

Read docs/AI_USAGE_LOG_PHASE2.docx, fill in your name and any prompts or manual changes you make, and understand the validation, state and routing before your demo. The log describes this assistance, not work you have personally verified.

## Verification performed

Dependency installation, all 61 tests across five files, and the production build passed. React/jsdom tests exercised rendered form validation, valid demo submissions and reset. The development server started on port 5173. Visual browser testing could not run because the Chromium download failed; manual visual, screen-reader and cross-browser checks remain open.
