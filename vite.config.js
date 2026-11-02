import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { build as bundleWorker } from 'esbuild';
import { canonicalLocation, sourcePath } from './src/i18n/routes.js';
import { renderPage } from './src/i18n/render.js';

function localizedRoutes() {
  const middleware = (server, built) => async (request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return next();
    const route = canonicalLocation(request.url);
    if (!route) return next();
    if (!route.isCanonical) {
      response.writeHead(301, { Location: route.location });
      response.end();
      return;
    }
    try {
      const filename = resolve(import.meta.dirname, built ? 'dist' : '.', sourcePath(route.page).slice(1));
      let html = renderPage(await readFile(filename, 'utf8'), route.page, route.language);
      if (!built) html = await server.transformIndexHtml(route.pathname, html, request.originalUrl);
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : html);
    } catch (error) { next(error); }
  };
  return {
    name: 'localized-routes',
    configureServer(server) { server.middlewares.use(middleware(server, false)); },
    configurePreviewServer(server) { server.middlewares.use(middleware(server, true)); },
    async closeBundle() {
      await bundleWorker({ entryPoints: [resolve(import.meta.dirname, 'src/edge.js')], outfile: resolve(import.meta.dirname, 'dist/_worker.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true });
    }
  };
}

const servicePages = Object.fromEntries(
  readdirSync(resolve(import.meta.dirname, 'services'))
    .filter((file) => file.endsWith('.html'))
    .map((file) => [file.replace('.html', ''), resolve(import.meta.dirname, 'services', file)])
);

export default defineConfig({
  base: '/',
  plugins: [localizedRoutes()],
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
