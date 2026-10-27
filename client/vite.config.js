import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration (Phase 2: front end only, no back-end proxy yet)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom', // unit tests run in a simulated browser
  },
});
