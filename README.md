# Student 5 Phase 2 update

Start with [Student 5 setup and GitHub guide](docs/STUDENT5_PHASE2.md). This update adds the Student 5 frontend demo and preserves the original project setup below.

# SolCacao Artisanal Chocolate Platform

A bilingual (English / Spanish) web application for SolCacao: direct-to-consumer chocolate
shopping and B2B wholesale services.

> CSE 5335: Web Data Management · Fall Semester Group Project

## Phase 2: Front-end development

Following the course syllabus, Phase 2 is the **React front end only**. The Node.js/Express
API and the MySQL database are built in Phase 3.

Until then, the app stores its data **in the browser** (`client/src/services/mockApi.js`).
That file answers like the planned REST API (same data and the same error codes), so in
Phase 3 only the service files change to `fetch()` calls. No component needs to change.

## Requirements

- **Node.js 20.19 or newer** (Node 22 LTS recommended), which includes npm

## Run the app

```bash
cd client
npm install
npm run dev        # opens on http://localhost:5173
```

Other commands (inside `client/`):

| Command           | What it does                               |
| ----------------- | ------------------------------------------ |
| `npm test`        | Runs the unit tests (Vitest)               |
| `npm run build`   | Builds the production version into `dist/` |
| `npm run preview` | Serves the production build on port 4173   |

### Demo accounts

These are created automatically the first time the app opens:

| Account type      | Email                   | Password    |
| ----------------- | ----------------------- | ----------- |
| Personal (Retail) | `ana@example.com`       | `Cacao2026` |
| Corporate (B2B)   | `carlos@grandhotel.com` | `Hotel2026` |

New accounts you register are saved in your browser only. To start from scratch, clear the
site data for `localhost:5173` in your browser.

## Pages

Every page has a language prefix: `/en/...` or `/es/...`.

| Path           | Page                                                                       | Owner     |
| -------------- | -------------------------------------------------------------------------- | --------- |
| `/en`          | Home (placeholder)                                                         | Student 4 |
| `/en/catalog`  | Catalog (placeholder)                                                      | Student 3 |
| `/en/b2b`      | Wholesale (placeholder)                                                    | Student 4 |
| `/en/contact`  | Contact (placeholder)                                                      | Student 5 |
| `/en/register` | Registration: Personal or Corporate (`?type=b2b` opens the corporate form) | Student 1 |
| `/en/account`  | My account: Profile, Company (B2B only), Addresses, Security               | Student 1 |
| (any page)     | Sign-in dialog, opened from the "Sign in" button                           | Student 1 |

The navbar, footer, routing shell and language toggle are a basic shell; Student 2 builds the
final versions.

## Project structure

```
client/src/
├── components/
│   ├── auth/       AuthModal, LoginForm, RegisterForm, AccountTypeSelector, AccountButton, ProtectedRoute
│   ├── layout/     LangLayout, Navbar, Footer, PagePlaceholder (shared shell)
│   ├── profile/    ProfileDetailsForm, CompanyDetailsForm, AddressBook, AddressForm, ChangePasswordForm
│   └── ui/         FormField, PasswordField, Button, Alert
├── context/        AuthContext (signed-in user, sign in / out, sign-in dialog)
├── hooks/          usePageTitle
├── i18n/           LanguageContext + locales/en.json, locales/es.json
├── pages/          One file per page
├── services/       mockApi (Phase 2 data), authService, userService, tokenStorage
└── utils/          validation, apiErrors, focus, constants
```

## Using auth in other components

```jsx
import { useAuth } from '../context/AuthContext';

const { user, isAuthenticated, isPartner, openAuthModal, logout } = useAuth();
```

Wrap a page that needs a signed-in user in `<ProtectedRoute>`, or use
`<ProtectedRoute accountType="B2B">` for partner-only pages (for example the B2B wizard).

## Accessibility

Student 1's screens were tested against **WCAG 2.2 level AA** with axe-core, Google Lighthouse
and scripted keyboard checks. See the Phase 2 accessibility check report for the results.

## Git workflow

- `main`: always stable (protected) · `development`: integration branch (protected)
- Feature branches come from `development` and are named after the student, e.g. `student1-auth`
- Merging into `development` needs a Pull Request with passing tests and one peer approval
