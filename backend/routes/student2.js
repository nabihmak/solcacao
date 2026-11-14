
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

// Student 2 - Phase 3
// Localization API and static asset routing.

const currentDirectory = path.dirname(
  fileURLToPath(import.meta.url)
);

const projectRoot = path.resolve(
  currentDirectory,
  '../..'
);

const localesDirectory = path.join(
  projectRoot,
  'client',
  'src',
  'i18n',
  'locales'
);

const staticDirectory = path.join(
  projectRoot,
  'client',
  'public'
);

const supportedLanguages = new Set(['en', 'es']);

export function registerStudent2Routes(app) {
  // Serve public images and static assets.
  app.use(
    '/assets',
    express.static(staticDirectory, {
      index: false,
      dotfiles: 'deny',
      maxAge: '1h',
    })
  );

  // Backend health check.
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'SolCacao Backend',
    });
  });

  // English and Spanish localization API.
  app.get('/api/i18n/:lang', async (req, res) => {
    const lang = req.params.lang.toLowerCase();

    if (!supportedLanguages.has(lang)) {
      return res.status(400).json({
        error: 'Unsupported language',
        supportedLanguages: ['en', 'es'],
      });
    }

    try {
      const filePath = path.join(
        localesDirectory,
        `${lang}.json`
      );

      const contents = await readFile(
        filePath,
        'utf8'
      );

      const translations = JSON.parse(contents);

      res.set('Cache-Control', 'no-store');

      return res.json(translations);
    } catch (error) {
      console.error(
        'Localization API error:',
        error.message
      );

      return res.status(500).json({
        error: 'Unable to load translation dictionary',
      });
    }
  });
}
