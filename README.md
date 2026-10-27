# SolCacao Artisanal Chocolate Platform

A bilingual (English / Spanish) web application for SolCacao: direct-to-consumer chocolate
shopping and B2B wholesale services.

> CSE 5335: Web Data Management · Fall Semester Group Project

## Phase 2: Front-end development

This is the shared starting point for the team's React front end: Vite, React 18, Tailwind CSS
(SolCacao chocolate theme), page routing with `/en/...` and `/es/...` paths, and the
English/Spanish translation files. Each student adds their screens on their own feature branch.

## Requirements

- **Node.js 20.19 or newer** (Node 22 LTS recommended), which includes npm

## Run the app

```bash
cd client
npm install
npm run dev        # opens on http://localhost:5173
```

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm test`        | Runs the unit tests (Vitest)                  |
| `npm run build`   | Builds the production version into `dist/`   |
| `npm run preview` | Serves the production build on port 4173      |

## Pages (placeholders until each student adds theirs)

| Path          | Page      | Owner     |
| ------------- | --------- | --------- |
| `/en`         | Home      | Student 4 |
| `/en/catalog` | Catalog   | Student 3 |
| `/en/b2b`     | Wholesale | Student 4 |
| `/en/contact` | Contact   | Student 5 |

The navbar, footer and language toggle are a basic shell; Student 2 builds the final versions.

## Translations

Key-value JSON files in `client/src/i18n/locales/`. Inside a component:

```jsx
const { t, localePath } = useLanguage();
t('nav.home');           // "Home" / "Inicio"
localePath('/catalog');  // "/en/catalog" / "/es/catalog"
```

## Git workflow

- `main`: always stable (protected) · `development`: integration branch (protected)
- Feature branches come from `development` and are named after the student, e.g. `student1-auth`
- Merging into `development` needs a Pull Request with passing tests and one peer approval
