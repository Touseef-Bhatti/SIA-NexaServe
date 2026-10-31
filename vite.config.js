import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';

const servicePages = Object.fromEntries(
  readdirSync(resolve(import.meta.dirname, 'services'))
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace('.html', ''), resolve(import.meta.dirname, 'services', file)])
);

export default defineConfig({
  base: '/',
  server: { allowedHosts: ['terminal.local'] },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
        consultancy: resolve(import.meta.dirname, 'consultancy.html'),
        workforce: resolve(import.meta.dirname, 'workforce-solutions.html'),
        industries: resolve(import.meta.dirname, 'industries.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        ...servicePages
      }
    }
  }
});
