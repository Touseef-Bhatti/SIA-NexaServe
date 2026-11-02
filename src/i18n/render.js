import lv from './lv.js';
import { latvianMetadata } from './metadata.js';
import { SITE_ORIGIN, canonicalLocation, pageUrl } from './routes.js';

const decode = (value) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&nbsp;/g, '\u00a0');
const escapeText = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (value) => escapeText(value).replace(/"/g, '&quot;');
const translations = Object.fromEntries(Object.entries(lv).map(([key, value]) => [decode(key), decode(value)]));

function translated(value) {
  const source = decode(value.trim());
  const result = translations[source];
  if (!result) return value;
  return `${value.match(/^\s*/)[0]}${escapeText(result)}${value.match(/\s*$/)[0]}`;
}

function setTagAttribute(html, selector, attribute, value) {
  return html.replace(selector, (tag) => {
    const pattern = new RegExp(`\\b${attribute}="[^"]*"`);
    return pattern.test(tag)
      ? tag.replace(pattern, `${attribute}="${escapeAttribute(value)}"`)
      : tag.replace(/\s*\/?>(?=$)/, (end) => ` ${attribute}="${escapeAttribute(value)}"${end}`);
  });
}

function localizeHref(href, language) {
  if (!href.startsWith('/')) return href;
  const url = new URL(href, SITE_ORIGIN);
  const route = canonicalLocation(url.href);
  return route ? `${pageUrl(route.page, language)}${url.search}${url.hash}` : href;
}

// This runs on the HTML response, using the same English pages and dictionary as the browser.
export function renderPage(source, page, language) {
  const file = page ? `${page}.html` : 'index.html';
  const title = source.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
  const description = source.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] || '';
  const localMeta = language === 'lv' ? latvianMetadata[file] : null;
  const pageTitle = localMeta?.[0] || decode(title);
  const pageDescription = localMeta?.[1] || decode(description);
  const canonical = `${SITE_ORIGIN}${pageUrl(page, language)}`;

  // Keep script and style content untouched; only actual HTML text is translated.
  const protectedBlocks = [];
  let html = source.replace(/<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, (block) => {
    const token = `\u0000BLOCK${protectedBlocks.length}\u0000`;
    protectedBlocks.push(block);
    return token;
  });

  // Give contact form options stable English values while showing translated labels.
  html = html.replace(/<option(?![^>]*\bvalue=)([^>]*)>([^<]+)<\/option>/gi, (_, attrs, value) =>
    `<option${attrs} value="${escapeAttribute(decode(value))}">${value}</option>`);

  html = html.replace(/(<(?:[^>"']|"[^"]*"|'[^']*')*>)/g, (tag) => {
    if (tag.startsWith('</') || tag.startsWith('<!')) return tag;
    if (/^<a\b/i.test(tag)) tag = tag.replace(/\bhref="([^"]*)"/i, (_, href) => `href="${escapeAttribute(localizeHref(decode(href), language))}"`);
    if (language === 'lv') tag = tag.replace(/\b(alt|aria-label|placeholder|title)="([^"]*)"/gi,
      (_, name, value) => `${name}="${escapeAttribute(translations[decode(value)] || decode(value))}"`);
    return tag;
  });
  if (language === 'lv') html = html.split(/(<[^>]*>)/g).map((part) => part.startsWith('<') ? part : translated(part)).join('');

  html = setTagAttribute(html, /<html\b[^>]*>/i, 'lang', language);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeText(pageTitle)}</title>`);
  html = setTagAttribute(html, /<meta\b(?=[^>]*\bname="description")[^>]*>/i, 'content', pageDescription);
  html = setTagAttribute(html, /<link\b(?=[^>]*\brel="canonical")[^>]*>/i, 'href', canonical);
  for (const [property, value] of [
    ['og:title', pageTitle], ['og:description', pageDescription],
    ['og:url', canonical], ['og:locale', language === 'lv' ? 'lv_LV' : 'en_US']
  ]) {
    const pattern = new RegExp(`<meta\\b(?=[^>]*\\bproperty="${property}")[^>]*>`, 'i');
    if (pattern.test(html)) html = setTagAttribute(html, pattern, 'content', value);
    else html = html.replace('</head>', `<meta property="${property}" content="${escapeAttribute(value)}"/></head>`);
  }
  html = html.replace(/<link\b(?=[^>]*\brel="alternate")(?=[^>]*\bhreflang=)[^>]*>/gi, '');
  const alternates = ['en', 'lv', 'x-default'].map((code) =>
    `<link rel="alternate" hreflang="${code}" href="${SITE_ORIGIN}${pageUrl(page, code === 'x-default' ? 'en' : code)}"/>`).join('');
  html = html.replace('</head>', `${alternates}</head>`);
  html = html.replace(/\u0000BLOCK(\d+)\u0000/g, (_, index) => {
    const block = protectedBlocks[Number(index)];
    if (!/^<script\b[^>]*\btype="application\/ld\+json"/i.test(block)) return block;
    return block.replace(/("url"\s*:\s*")[^"]*(")/, `$1${canonical}$2`)
      .replace(/("description"\s*:\s*")[^"]*(")/, (_, start, end) => `${start}${pageDescription}${end}`);
  });
  return html;
}
