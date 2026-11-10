// Copies the browser files we need out of node_modules into vendor/,
// and builds data/land.json (dots on land, for the globe) from Natural Earth.
// Run with: pnpm run vendor
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { buildSync } from 'esbuild';

mkdirSync('vendor/fonts', { recursive: true });
mkdirSync('data', { recursive: true });
const copies = [
  ['node_modules/gsap/dist/gsap.min.js', 'vendor/gsap.min.js'],
  ['node_modules/gsap/dist/ScrollTrigger.min.js', 'vendor/ScrollTrigger.min.js'],
  ['node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2', 'vendor/fonts/fraunces-normal.woff2'],
  ['node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2', 'vendor/fonts/fraunces-italic.woff2'],
  ['node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2', 'vendor/fonts/instrument-sans.woff2'],
  ['node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2', 'vendor/fonts/plex-mono-400.woff2'],
  ['node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', 'vendor/fonts/plex-mono-500.woff2'],
];
for (const [from, to] of copies) copyFileSync(from, to);

// three.js ships as two large unminified modules; bundle and minify them into one file.
buildSync({
  entryPoints: ['node_modules/three/build/three.module.js'],
  bundle: true, minify: true, format: 'esm', outfile: 'vendor/three.min.js', legalComments: 'inline',
});

// Land dots: spread points evenly over a sphere, keep the ones on land.
const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const polys = [];
for (const f of land.features ?? [land]) {
  const g = f.geometry ?? f;
  if (g.type === 'Polygon') polys.push(g.coordinates);
  else for (const p of g.coordinates) polys.push(p);
}
const boxes = polys.map((p) => {
  let a = 180, b = -180, c = 90, d = -90;
  for (const [x, y] of p[0]) { if (x < a) a = x; if (x > b) b = x; if (y < c) c = y; if (y > d) d = y; }
  return [a, b, c, d];
});
const inRing = (ring, x, y) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const onLand = (x, y) => polys.some((p, i) => {
  const [a, b, c, d] = boxes[i];
  if (x < a || x > b || y < c || y > d) return false;
  if (!inRing(p[0], x, y)) return false;
  for (let h = 1; h < p.length; h++) if (inRing(p[h], x, y)) return false;
  return true;
});
const N = 42000, out = [];
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const yy = 1 - (i / (N - 1)) * 2;
  const lat = (Math.asin(yy) * 180) / Math.PI;
  let lon = (((i * golden) * 180) / Math.PI) % 360;
  if (lon > 180) lon -= 360;
  if (lat > -60 && onLand(lon, lat)) out.push(Math.round(lon * 10), Math.round(lat * 10));
}
writeFileSync('data/land.json', JSON.stringify(out));
console.log(`vendor: ${copies.length} files copied, ${out.length / 2} land dots`);
