import en from './en.js';
import lv from './lv.js';
import { canonicalLocation, pageUrl } from './routes.js';

const dictionaries = { en, lv };
const normalized = Object.fromEntries(Object.entries(lv).map(([key, value]) => [key.replaceAll('&amp;', '&'), value.replaceAll('&amp;', '&')]));
let language = 'en';

export function getLanguage() { return language; }
export function t(key, lang = language) { return lang === 'lv' ? normalized[key] || key : en[key] || key; }

export function languageUrl(lang, href = window.location.href) {
  const url = new URL(href, window.location.origin);
  const route = canonicalLocation(url.href);
  if (!route) return `${url.pathname}${url.search}${url.hash}`;
  url.searchParams.delete('lang');
  return `${pageUrl(route.page, lang)}${url.search}${url.hash}`;
}

function updateSwitcher() {
  document.documentElement.lang = language;
  document.querySelector('[data-language-code]')?.replaceChildren(language.toUpperCase());
  document.querySelector('[data-language-toggle]')?.setAttribute('aria-label', language === 'lv' ? 'Mainīt valodu' : 'Change language');
  document.querySelectorAll('[data-language-option]').forEach((option) => {
    const code = option.dataset.languageOption;
    const active = code === language;
    option.setAttribute('aria-current', active ? 'true' : 'false');
    option.textContent = `${active ? '✓ ' : ''}${code === 'lv' ? 'Latviešu' : 'English'}`;
    option.href = languageUrl(code);
  });
}

export function setLanguage(next) {
  if (!dictionaries[next]) return;
  try { localStorage.setItem('nexaserve-language', next); } catch {}
  if (next !== language) window.location.assign(languageUrl(next));
}

export function initI18n() {
  const route = canonicalLocation(window.location.href);
  language = route?.language || 'en';
  if (route && !route.isCanonical) {
    window.location.replace(route.location);
    return;
  }
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    link.href = languageUrl(language, link.getAttribute('href'));
  });
  updateSwitcher();
}
