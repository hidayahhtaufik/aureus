# Aureus Docs Site

Static-export Next.js docs site for Aureus Protocol. Mirrors the `forum.auranode.xyz/docs` look-and-feel: left sidebar nav + main content + resources card list.

## Develop

```bash
cd docs-site
npm install
npm run dev   # → http://localhost:3300
```

## Build (static export)

```bash
npm run build
# Output: docs-site/out/   (drop on any static host)
```

## Deploy

### Cloudflare Pages

1. New Pages project → connect this repo
2. Build command: `cd docs-site && npm install && npm run build`
3. Output dir: `docs-site/out`
4. Custom domain: `docs.aureus.auranode.xyz` (or `aureus.auranode.xyz/docs` via a worker rewrite)

### Manual upload to the same VPS

```bash
# Local
cd docs-site && npm run build
rsync -avz out/ root@your-vps:/var/www/aureus-docs/

# On VPS, Nginx config (location block):
location /docs {
  alias /var/www/aureus-docs;
  try_files $uri $uri/ $uri.html =404;
}
```

Then `sudo systemctl reload nginx` and the docs are live at `aureus.auranode.xyz/docs`.

## Content

Edit `src/app/page.tsx` — every section is a function component with an HTML `id` matching the nav config in the same file. Add a new section by:

1. Add an entry to `NAV` with the matching `id`
2. Write a new function component with `<section id="..." style={{scrollMarginTop:96}}>`
3. Render it inside the `DocsShell` children

Scroll-spy in `DocsShell.tsx` watches each section's intersection ratio and highlights the active sidebar item.
