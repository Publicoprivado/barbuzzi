# Lucas Barbuzzi — website

Static site built from the **WEB 01** direction of `LB_Web_09.pdf` (cream background, the four-edge
menu, background shapes that regroup per section). Everything is set in DM Mono; the brand mark
sits bottom-right. No framework and no build step.

## Run locally

```
node serve.mjs          # http://localhost:5173 (+ prints the LAN address, e.g. http://192.168.1.4:5173)
```

`serve.mjs` is a tiny zero-dependency server that sends unknown routes to `index.html`, so URLs like
`/objects/lampara-2d` work on reload. It listens on all interfaces, so anyone on the same Wi-Fi can
open the LAN address (Windows must allow Node through the firewall — it asks the first time).

## Structure

```
index.html              shell: shapes layer, edge menu, brand mark, <main>
assets/css/main.css     all styles; sizes are in PDF units (1920px artboard) via --u
assets/js/app.js        router + views (home, information, objects grid/index, project, scenes, playground)
assets/js/shapes.js     the 19 background shapes and their position in each section (traced from the PDF)
assets/js/data.js       ← edit this: bio, contact, clients, and the project list
assets/js/images.js     generated image index (sizes + average colour) — don't edit by hand
assets/img/<slug>/      generated WebP files
assets/fonts/           DM Mono 300/400/500 (self-hosted, OFL)
assets/brand/           brand mark (from logo.png)
tools/process_images.py resizes ../source-images into assets/img and rewrites images.js
```

URLs: `/` · `/information` · `/objects` (`?view=index` for the list) · `/objects/<slug>` ·
`/scenes` · `/scenes/<slug>` · `/playground`

## Add or change a project

1. Put the originals in `../source-images/<slug>/` named `01.jpg`, `02.jpg`, … (order = display order).
2. `python tools/process_images.py` (needs Pillow: `pip install pillow`).
3. Add an entry to `PROJECTS` in `assets/js/data.js` with the same `slug`, a `title`, and
   `section: 'objects'` or `'scenes'`. Optional: `description`, `specs`, `cover`, `frames`.

## Deploy

Any static host works, at the domain root or in a sub-folder — `index.html` works out its own base
path at runtime.

- **GitHub Pages**: Settings → Pages → Deploy from a branch → `main` / `(root)`. Deep links work
  through `404.html`, which must stay an exact copy of `index.html` (`cp index.html 404.html` after
  editing it). `.nojekyll` stops Jekyll from touching the files.
- **Vercel** (`vercel.json`) and **Netlify / Cloudflare Pages** (`_redirects`) rewrite every page
  URL to `index.html`.
