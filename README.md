# SIA-NexaServe

The English HTML files are the single source for both languages. Latvian text
comes from `src/i18n/lv.js`; no second set of HTML pages is stored or built.

Clean public URLs use `/en/` and `/lv/`, for example `/en/about/` and
`/lv/about/`. The language selector stays on the current page. Old root,
`.html`, and `?lang=lv` URLs redirect to the corresponding clean URL.

`npm run dev` and `npm run preview` serve these routes locally. `npm run build`
creates the static assets, bilingual sitemap, and `dist/_worker.js`. Deploy
`dist` to Cloudflare Pages to use the advanced mode Worker. The included
`wrangler.jsonc` also serves the same Worker with Cloudflare Workers static
assets. The Worker translates the HTML response, so page text, titles,
descriptions, canonical URLs, and hreflang are present for crawlers.
