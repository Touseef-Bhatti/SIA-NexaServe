export const SITE_ORIGIN = 'https://sianexaserve.com';

export const pages = [
  '', 'about', 'consultancy', 'workforce-solutions', 'industries', 'contact', 'privacy',
  'services/business-management', 'services/supply-chain-management',
  'services/procurement-purchasing', 'services/logistics-operations',
  'services/business-process-improvement', 'services/workforce-planning',
  'services/business-development', 'services/organisational-management',
  'services/sme-management-advisory'
];

const pageSet = new Set(pages);

export function pageFromPath(pathname) {
  let path = pathname.replace(/^\/+|\/+$/g, '');
  const parts = path.split('/');
  let language = null;
  if (parts[0] === 'en' || parts[0] === 'lv') {
    language = parts.shift();
    path = parts.join('/');
  }
  if (path === 'index.html' || path === 'index') path = '';
  else path = path.replace(/\.html$/, '');
  if (!pageSet.has(path)) return null;
  return { page: path, language };
}

export function pageUrl(page, language) {
  return `/${language}/${page ? `${page}/` : ''}`;
}

export function sourcePath(page) {
  return page ? `/${page}.html` : '/index.html';
}

export function canonicalLocation(input) {
  const url = new URL(input, SITE_ORIGIN);
  const match = pageFromPath(url.pathname);
  if (!match) return null;
  const queryLanguage = url.searchParams.get('lang');
  const language = match.language || (queryLanguage === 'lv' ? 'lv' : 'en');
  url.searchParams.delete('lang');
  const pathname = pageUrl(match.page, language);
  return { page: match.page, language, pathname, location: `${pathname}${url.search}${url.hash}`, isCanonical: match.language === language && url.pathname === pathname && !queryLanguage };
}
