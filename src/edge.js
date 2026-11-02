import { canonicalLocation, sourcePath } from './i18n/routes.js';
import { renderPage } from './i18n/render.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = canonicalLocation(url.href);
    if (!route || !['GET', 'HEAD'].includes(request.method)) return env.ASSETS.fetch(request);
    if (!route.isCanonical) return Response.redirect(new URL(route.location, url.origin), 301);

    // Cloudflare resolves the English asset through its pretty asset path.
    const sourceUrl = new URL(route.page ? sourcePath(route.page).replace(/\.html$/, '') : '/', url.origin);
    let asset = await env.ASSETS.fetch(new Request(sourceUrl, { method: 'GET' }));
    // Workers static assets may redirect /about to /about/; Pages serves /about.
    if (asset.status >= 300 && asset.status < 400 && asset.headers.has('location')) {
      const redirected = new URL(asset.headers.get('location'), sourceUrl);
      if (redirected.origin === url.origin && redirected.pathname === `${sourceUrl.pathname}/`) {
        asset = await env.ASSETS.fetch(new Request(redirected, { method: 'GET' }));
      }
    }
    if (!asset.ok) return asset;
    const headers = new Headers(asset.headers);
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.delete('content-length');
    headers.delete('etag');
    return new Response(request.method === 'HEAD' ? null : renderPage(await asset.text(), route.page, route.language), {
      status: 200,
      headers
    });
  }
};
