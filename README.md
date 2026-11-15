# SolCacao Artisanal Chocolate Platform

A bilingual (English / Spanish) web application for SolCacao: direct-to-consumer chocolate
shopping and B2B wholesale services.

> CSE 5335: Web Data Management · Fall Semester Group Project

## Phase 2: Front-end development

Following the course syllabus, Phase 2 is the **React front end only**. The Node.js/Express
API and the MySQL database are built in Phase 3.

In Phase 2 the app stored its data in the browser. In Phase 3 sign-in, registration and the
account page use the Express API (`backend/`); the service files call `fetch()` and no
component needed to change.

## Requirements

- **Node.js 20.19 or newer** (Node 22 LTS recommended), which includes npm
## Run the server

1. Copy `backend/.env.example` to `backend/.env` and fill in the values. Sign-in needs
   `MONGO_CONNECTION_STRING` (the team's MongoDB Atlas database) and `JWT_SECRET`.
   Create a secret with:
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   Never commit `.env`.
2. Install, add the demo accounts once, and start:

```bash
cd backend
npm install
npm run seed          # adds the two demo accounts (skips them if they exist)
npm start             # opens on http://localhost:3001
npm test              # runs every backend test (no database needed)
```

The React app (`npm run dev` in `client/`) forwards `/api` calls to port 3001, so start
the server first.

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

`npm run seed` (in `backend/`) adds these to the database:

| Account type      | Email                   | Password    |
| ----------------- | ----------------------- | ----------- |
| Personal (Retail) | `ana@example.com`       | `Cacao2026` |
| Corporate (B2B)   | `carlos@grandhotel.com` | `Hotel2026` |

New accounts you register are saved in the `users` collection; passwords are stored as
bcrypt hashes only.

## Pages

Every page has a language prefix: `/en/...` or `/es/...`.

| Path           | Page                                                                       | Owner     |
| -------------- | -------------------------------------------------------------------------- | --------- |
| `/en`          | Home (placeholder)                                                         | Student 4 |
| `/en/catalog`  | Catalog: search, filters (origin, cacao %, price, type), sort, pages       | Student 3 |
| `/en/catalog/:slug` | Product details                                                       | Student 3 |
| (any page)     | Slide-out cart, opened from the cart icon                                  | Student 3 |
| `/en/b2b`      | Wholesale (placeholder)                                                    | Student 4 |
| `/en/contact`  | Contact (inquiry categories, form validation, confirmation screen, feedback and chocolate sampler)                                                      | Student 5 |
| `/en/register` | Registration: Personal or Corporate (`?type=b2b` opens the corporate form) | Student 1 |
| `/en/account`  | My account: Profile, Company (B2B only), Addresses, Security               | Student 1 |
| (any page)     | Sign-in dialog, opened from the "Sign in" button                           | Student 1 |

The navbar, footer, routing shell and language toggle are a basic shell; Student 2 builds the
final versions.

## Project structure

```
client/src/
├── components/
│   ├── catalog/    ProductCard, ProductArt, FilterSidebar, RangeSlider, Pagination, StockStatus
│   ├── cart/       CartButton, CartDrawer, CartLineItem, QuantityStepper, CartIndicator
│   ├── auth/       AuthModal, LoginForm, RegisterForm, AccountTypeSelector, AccountButton, ProtectedRoute
│   ├── layout/     LangLayout, Navbar, Footer, PagePlaceholder (shared shell)
│   ├── profile/    ProfileDetailsForm, CompanyDetailsForm, AddressBook, AddressForm, ChangePasswordForm
│   └── ui/         FormField, PasswordField, Button, Alert
├── context/        AuthContext (signed-in user, sign in / out, sign-in dialog), CartContext + cartReducer
├── data/           products.js (Phase 2 catalog + inventory seed)
├── hooks/          usePageTitle
├── i18n/           LanguageContext + locales/en.json, locales/es.json
├── pages/          One file per page
├── services/       apiClient (calls to the server), authService, userService, catalogMockApi + mockApi (Phase 2 cart data), productService, cartService, tokenStorage
└── utils/          validation, apiErrors, focus, constants
```

## Using auth in other components

```jsx
import { useAuth } from '../context/AuthContext';

const { user, isAuthenticated, isPartner, openAuthModal, logout } = useAuth();
```

Wrap a page that needs a signed-in user in `<ProtectedRoute>`, or use
`<ProtectedRoute accountType="B2B">` for partner-only pages (for example the B2B wizard).

On the server, protect a route with the same check. `req.user` is the signed-in user, taken
from the token, so never trust a user object sent by the browser:

```js
import { protect, requireB2B } from './middleware/auth.js';

app.get('/api/cart', protect, handler);                     // signed-in users only
app.post('/api/b2b/quote', protect, requireB2B, handler);  // corporate partners only
```

From the React app, send the token with `apiRequest()` from `services/apiClient.js`
(it adds `Authorization: Bearer <token>`), or `authHeader()` for file uploads.

### Auth API (Student 1)

| Method and path                  | Result                                        |
| -------------------------------- | --------------------------------------------- |
| `POST /api/auth/register`        | 201 `{ token, user }` · 400 · 409 email taken |
| `POST /api/auth/login`           | 200 `{ token, user }` · 400 · 401             |
| `GET /api/auth/me`               | 200 `{ user }` · 401                          |
| `POST /api/auth/logout`          | 204                                           |
| `PUT /api/users/profile`         | 200 `{ user }` · 400 · 401                    |
| `PUT /api/users/password`        | 200 · 400 wrong current password · 401        |
| `GET /api/users/addresses`       | 200 `{ addresses }` · 401                     |
| `POST /api/users/addresses`      | 201 `{ address }` · 400 · 401                 |
| `PUT /api/users/addresses/:id`   | 200 `{ address }` · 400 · 401 · 404           |
| `DELETE /api/users/addresses/:id`| 200 · 401 · 404                               |

## Accessibility

Student 1's screens were tested against **WCAG 2.2 level AA** with axe-core, Google Lighthouse
and scripted keyboard checks. See the Phase 2 accessibility check report for the results.

## Git workflow

- `main`: always stable (protected) · `development`: integration branch (protected)
- Feature branches come from `development` and are named after the student, e.g. `student1-auth`
- Merging into `development` needs a Pull Request with passing tests and one peer approval
