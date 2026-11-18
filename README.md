# SolCacao Artisanal Chocolate Platform

A bilingual (English / Spanish) full-stack web application for SolCacao: direct-to-consumer
chocolate shopping and B2B wholesale services.

> CSE 5335: Web Data Management · Fall Semester Group Project

## Team

| Student | Name             | GitHub              | Area                                                |
| ------- | ---------------- | ------------------- | --------------------------------------------------- |
| 1       | Nabih Maknojia   | `nabihmak`          | Authentication, security and databases              |
| 2       | Sushanth Muriki  | `suchim06-ops`      | Core layout, navigation and localization            |
| 3       | Rutuja Dudhagundi| `rutuja-dudhagundi` | Catalog, search and cart                            |
| 4       | Aadhitya Kumar   | `AadhityaKumar`     | Homepage, B2B services and quote wizard             |
| 5       | Krishan Lnu      | `Krishan07503`      | Contact, feedback, sampler and email notifications  |

## Tech stack

| Layer          | Technology                                                    |
| -------------- | ------------------------------------------------------------- |
| Front end      | React 18, React Router 7, Tailwind CSS 3, Lucide React, Vite 7 |
| Back end       | Node.js, Express 5                                            |
| Database       | MongoDB Atlas with Mongoose (users, addresses, catalog, carts) and the MongoDB driver (B2B quotes, support submissions) |
| Security       | JSON Web Tokens (JWT), bcrypt password hashing, role-based route guards |
| File storage   | AWS S3 (B2B brand files, uploaded with multer)                |
| Email          | Nodemailer over SMTP (support and sampler requests)           |
| Tests          | Node test runner (back end), Vitest + jsdom (front end)       |

## Requirements

- **Node.js 22.12 or newer** (includes npm)
- A MongoDB Atlas connection string (ask the team; never commit it)

## Setup

### 1. Server (`backend/`)

Copy `backend/.env.example` to `backend/.env` and fill in the values:

| Variable                  | Needed for                         |
| ------------------------- | ---------------------------------- |
| `MONGO_CONNECTION_STRING` | Everything that uses the database  |
| `JWT_SECRET`              | Sign-in tokens (long random text)  |
| `BUCKET_NAME`, `BUCKET_REGION`, `ACCESS_KEY`, `SECRET_ACCESS_KEY` | B2B file uploads to S3 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SUPPORT_EMAIL` | Support emails (optional; submissions are still saved without them) |

Create a `JWT_SECRET` with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

```bash
cd backend
npm install
npm run seed                    # demo accounts (skips them if they exist)
node scripts/seedStudent3.js    # the 18 products and their stock
npm start                       # http://localhost:3001
```

### 2. App (`client/`)

```bash
cd client
npm install
npm run dev                     # http://localhost:5173
```

The app forwards `/api` calls to port 3001, so keep the server running. Optional settings go
in `client/.env.local`: `VITE_API_BASE_URL` (server address for a deployed site) and
`VITE_WHATSAPP_NUMBER` (business number for the WhatsApp link).

### Demo accounts

| Account type      | Email                   | Password    |
| ----------------- | ----------------------- | ----------- |
| Personal (Retail) | `ana@example.com`       | `Cacao2026` |
| Corporate (B2B)   | `carlos@grandhotel.com` | `Hotel2026` |

### Commands

| Where      | Command           | What it does                                  |
| ---------- | ----------------- | --------------------------------------------- |
| `backend/` | `npm test`        | Runs every back-end test (no database needed) |
| `client/`  | `npm test`        | Runs the front-end tests (Vitest)             |
| `client/`  | `npm run build`   | Builds the production site into `dist/`       |
| `client/`  | `npm run preview` | Serves the production build on port 4173      |

## Pages

Every page has a language prefix: `/en/...` or `/es/...`.

| Path                 | Page                                                              | Owner     |
| -------------------- | ----------------------------------------------------------------- | --------- |
| `/en`                | Home: hero slides, seasonal picks, sampler promotion              | Students 4, 3 |
| `/en/catalog`        | Catalog: search, filters (origin, cacao %, price, category), sort, pages | Student 3 |
| `/en/catalog/:slug`  | Product details                                                   | Student 3 |
| (any page)           | Slide-out cart, opened from the cart icon                         | Student 3 |
| `/en/checkout`       | Checkout: contact, shipping address, delivery, pay on delivery (signed in) | Student 3 |
| `/en/orders/:reference` | Order confirmation and order details (signed in)               | Student 3 |
| `/en/b2b`            | Wholesale and corporate services                                  | Student 4 |
| `/en/b2b/quote`      | 4-step custom quote wizard (B2B accounts only)                    | Student 4 |
| `/en/contact`        | Contact form and WhatsApp link                                    | Student 5 |
| `/en/feedback`       | Feedback form                                                     | Student 5 |
| `/en/sampler`        | Chocolate sampler builder (3 flavors)                             | Student 5 |
| `/en/about`, `/en/faq` | About and FAQ                                                   | Student 5 |
| `/en/register`       | Registration: Personal or Corporate (`?type=b2b` opens the corporate form) | Student 1 |
| `/en/account`        | My account: Profile, Company (B2B only), Addresses, Orders, Security (`?tab=orders` opens Orders) | Students 1, 3 |
| (any page)           | Sign-in dialog, navbar, mobile menu, footer, language switch      | Students 1, 2 |

## API map

Access: **Public** = anyone · **User** = any signed-in user (`Authorization: Bearer <token>`) ·
**Partner** = signed-in B2B account. Errors answer `{ message, errors? }` with the status code.

| Method | Path                          | Access  | Body / query                                     | Success | Owner |
| ------ | ----------------------------- | ------- | ------------------------------------------------ | ------- | ----- |
| POST   | `/api/auth/register`          | Public  | name, email, password, accountType, company (B2B) | 201 `{ token, user }` | 1 |
| POST   | `/api/auth/login`             | Public  | email, password                                  | 200 `{ token, user }` | 1 |
| GET    | `/api/auth/me`                | User    | –                                                | 200 `{ user }` | 1 |
| POST   | `/api/auth/logout`            | Public  | –                                                | 204 | 1 |
| PUT    | `/api/users/profile`          | User    | name, phone, preferredLanguage, company (B2B)    | 200 `{ user }` | 1 |
| PUT    | `/api/users/password`         | User    | currentPassword, newPassword                     | 200 | 1 |
| GET    | `/api/users/addresses`        | User    | –                                                | 200 `{ addresses }` | 1 |
| POST   | `/api/users/addresses`        | User    | label, street, city, state, postalCode, country, isDefault | 201 `{ address }` | 1 |
| PUT    | `/api/users/addresses/:id`    | User    | any address field                                | 200 `{ address }` | 1 |
| DELETE | `/api/users/addresses/:id`    | User    | –                                                | 200 | 1 |
| GET    | `/api/health`                 | Public  | –                                                | 200 | 2 |
| GET    | `/api/i18n/:lang`             | Public  | `lang` = `en` or `es`                            | 200 dictionary | 2 |
| GET    | `/assets/*`                   | Public  | static files from `client/public`                | 200 | 2 |
| GET    | `/api/products`               | Public  | `search`, `origin`, `category`, `minPct`, `maxPct`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit` | 200 `{ products, pagination, facets }` | 3 |
| GET    | `/api/products/:slug`         | Public  | –                                                | 200 `{ product }` | 3 |
| GET    | `/api/cart`                   | User    | –                                                | 200 `{ cart, adjustments }` | 3 |
| POST   | `/api/cart/persist`           | User    | `{ items: [{ productId, quantity }] }`           | 200 `{ cart, adjustments }` | 3 |
| POST   | `/api/cart/merge`             | User    | `{ items: [{ productId, quantity }] }`           | 200 `{ cart, adjustments }` | 3 |
| POST   | `/api/orders`                 | User    | `{ items, shipping: { fullName, phone?, street, city, state?, postalCode, country }, shippingMethod: standard\|express, paymentMethod: payOnDelivery, expectedTotal? }` | 201 `{ order }` · 409 cart or price changed | 3 |
| GET    | `/api/orders`                 | User    | –                                                | 200 `{ orders }` (newest first) | 3 |
| GET    | `/api/orders/:reference`      | User    | –                                                | 200 `{ order }` (own orders only) | 3 |
| GET    | `/api/b2b/quote`              | Partner | –                                                | 200 list of the partner's quotes | 4 |
| POST   | `/api/b2b/quote`              | Partner | multipart: `caption` (JSON quote details) + `image` (brand file) | 201 `{ request }` | 4 |
| POST   | `/api/student5/submissions`   | Public  | type (`contact`/`feedback`/`sampler`), name, email, category, message, consent, rating, flavors, quantity | 201 `{ id, emailStatus }` | 5 |

Common errors: 400 invalid input (with field errors), 401 not signed in or token expired,
403 not a B2B account, 404 not found, 409 email already registered or (checkout) the cart or a price
changed since the page was opened.

**Checkout rules (Student 3):** prices come from `products`, never from the browser. Shipping:
standard $5.95 (free from $50), express $14.95; tax 8.25% of the subtotal; money is added up in cents.
Stock is taken with one conditional update per product (`stock >= quantity`) and given back if the
order cannot be saved, so two shoppers cannot buy the same last bar. After the order, the saved cart
is emptied.

## Database schemas (MongoDB, database `solcacao`)

**users** (`backend/models/User.js`, Student 1)

| Field              | Type                 | Rules                                    |
| ------------------ | -------------------- | ---------------------------------------- |
| `_id`              | ObjectId             |                                          |
| `name`             | String               | required, max 100                        |
| `email`            | String               | required, unique, lower case             |
| `passwordHash`     | String               | required, bcrypt hash, hidden from queries |
| `accountType`      | String               | `Retail` or `B2B`                        |
| `phone`            | String               | max 30                                   |
| `preferredLanguage`| String               | `en` or `es`                             |
| `corporatePartner` | CorporatePartner / null | required for B2B, null for Retail     |
| `createdAt`, `updatedAt` | Date           |                                          |

**CorporatePartner** (embedded in a user, `backend/models/CorporatePartner.js`, Student 1):
`companyName` (required), `industry` (`Wholesale`, `Hotel`, `Corporate Events`, `Other`),
`taxId`, `website`.

**addresses** (`backend/models/Address.js`, Student 1)

| Field                    | Type     | Rules                           |
| ------------------------ | -------- | ------------------------------- |
| `_id`                    | ObjectId |                                 |
| `userId`                 | ObjectId | → users, indexed                |
| `label`                  | String   | e.g. Home, Office               |
| `street`, `city`, `postalCode`, `country` | String | required           |
| `state`                  | String   |                                 |
| `isDefault`              | Boolean  | one default per user            |
| `createdAt`, `updatedAt` | Date     |                                 |

**products** (`backend/models/Product.js`, Student 3)

| Field          | Type                    | Rules                              |
| -------------- | ----------------------- | ---------------------------------- |
| `_id`          | String                  | e.g. `p-001`                       |
| `sku`, `slug`  | String                  | required, unique                   |
| `name`, `description` | `{ en, es }`     | localized text                     |
| `tastingNotes` | `{ en: [String], es: [String] }` |                           |
| `category`     | String                  | `bar`, `truffles`, `seasonal`      |
| `origin`, `region` | String              |                                    |
| `cacaoPct`     | Number                  | 0–100                              |
| `price`        | Number                  | USD                                |
| `weightGrams`, `featuredRank` | Number   |                                    |
| `isOrganic`    | Boolean                 |                                    |

**inventories** (`backend/models/Inventory.js`, Student 3): `product` (→ products, unique),
`stock`, `lowStockThreshold`.

**carts** (`backend/models/Cart.js`, Student 3): `user` (user id, unique),
`items: [{ productId → products, quantity 1–99 }]` (up to 50 lines), `updatedAt`.

**orders** (`backend/models/Order.js`, Student 3): `reference` (unique, e.g. `SC-ORD-2026-7K3F9Q`),
`user` (user id), `items: [{ productId, sku, slug, name { en, es }, origin, cacaoPct, category, unitPrice,
quantity, lineTotal }]` (a copy of the product at purchase time), `shippingAddress { fullName, phone,
street, city, state, postalCode, country }`, `shippingMethod`, `paymentMethod`, `subtotal`,
`shippingCost`, `tax`, `total`, `currency`, `status` (`placed`, `shipped`, `delivered`, `cancelled`),
`createdAt`, `updatedAt`.

**quotes** (`backend/server.js`, Student 4): `_id`, `reference` (e.g. `SC-2026-0021`),
`userId` (→ users), `user`, `companyName`, `cacaoOrigin`, `cacaoPercentage`, `chocolateStyle`,
`packagingType`, `quantity`, `deliveryDate`, `packagingNotes`, `notes`,
`file: { key, bucket, originalName, mimeType, size }` (S3), `status`, `createdAt`.

**student5_submissions** (`backend/routes/student5.js`, Student 5): `type` (`contact`,
`feedback`, `sampler`), `name`, `email`, `category`, `message`, `consent`, `rating` (feedback),
`flavors` and `quantity` (sampler), `emailStatus`, `createdAt`.

## Project structure

```
backend/
├── server.js           Express app: middleware, routes, B2B quote API, error handler
├── config/mongoose.js  Shared Mongoose connection
├── models/             User, CorporatePartner, Address, Product, Inventory, Cart
├── middleware/auth.js  protect (JWT check) and requireB2B
├── db/                 userStore (user/address queries), seed (demo accounts)
├── routes/             auth, users, student2 (i18n), student3 (catalog/cart), student5 (forms) + tests
├── scripts/            seedStudent3 (products and stock)
└── utils/validation.js Server-side input checks
client/src/
├── components/         auth, b2b, cart, catalog, home, layout, profile, support, ui
├── context/            AuthContext, CartContext + cartReducer
├── i18n/               LanguageContext + locales/en.json, locales/es.json
├── pages/              One file per page
├── services/           apiClient (shared fetch + token) and one service file per area
└── utils/              Validation and helpers
```

## Security

- Passwords are hashed with bcrypt; the hash is never returned by the API.
- Sign-in uses JWT (7 days). Protected routes use `protect`; partner routes add `requireB2B`.
  The signed-in user always comes from the token, never from the request body.
- Every route validates its input on the server; the front end checks too, for quick feedback.
- Wrong email and wrong password give the same message, so accounts cannot be guessed.
- Secrets live only in `backend/.env`, which git ignores.

## Accessibility

Pages were checked against **WCAG 2.2 level AA** with axe-core, Lighthouse and keyboard-only use
(labels on every field, visible focus, skip link, focus kept inside dialogs, no sideways scrolling
at 320 px).

## Deployment

Build the front end with `npm run build` in `client/` and serve `client/dist/`. Run the server
with `npm start` in `backend/` and set `VITE_API_BASE_URL` to the server's address before
building. Live URL: _to be added once deployed._

## Git workflow

- `main`: always stable (protected) · `development`: integration branch (protected)
- Feature branches come from `development` and are named after the student, e.g. `student1-auth`
- Merging into `development` needs a Pull Request with passing tests and one peer approval
