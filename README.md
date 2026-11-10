# Linked, not ranked

A scrolling interactive on the life of Gloria Steinem (25 March 1934 – 2 September 2026), told as far as possible in her own words.

Ten chapters, a particle scene that changes shape for each one, and a handful of things to explore: the route of her life on a globe, women in Congress since 1917, and what changed while Roe v Wade stood. Every quotation was checked against the full text of the source it cites, and the sources are listed at the foot of the page.

## Run it

There is no build step. Serve the folder and open it:

```bash
python3 -m http.server 4173
```

Then go to `http://localhost:4173`.

## Change the libraries

three.js, GSAP and the fonts are installed with pnpm and copied into `vendor/`. To update them:

```bash
pnpm install
```

```bash
pnpm run vendor
```

## Where things are

- `index.html` – the piece: all the words, quotations and citations
- `about.html` – what it is, how it was made, and a diary
- `css/style.css` – the look
- `js/scene.js` – the 3D particle scene
- `js/main.js` – scrolling and the interactives
- `js/data.js` – places, quiz lines, Equal Rights Amendment and Congress figures
- `img/` – photographs, all public domain or openly licensed (credits are on the page)

## Publishing

`.github/workflows/pages.yml` publishes to GitHub Pages on every push to `main`. In the repository settings, Pages must have its source set to GitHub Actions.
