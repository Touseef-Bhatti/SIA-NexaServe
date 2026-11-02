import { writeFile } from 'node:fs/promises';
import { pages, pageUrl, SITE_ORIGIN } from '../src/i18n/routes.js';

const escapeXml = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
];
for (const page of pages) {
  const en = `${SITE_ORIGIN}${pageUrl(page, 'en')}`;
  const lv = `${SITE_ORIGIN}${pageUrl(page, 'lv')}`;
  for (const location of [en, lv]) {
    lines.push(`  <url><loc>${escapeXml(location)}</loc><xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}"/><xhtml:link rel="alternate" hreflang="lv" href="${escapeXml(lv)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(en)}"/></url>`);
  }
}
lines.push('</urlset>', '');
await writeFile(new URL('../public/sitemap.xml', import.meta.url), lines.join('\n'));
