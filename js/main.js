// Linked, not ranked: scroll logic and the small interactives.
import { PLACES, FLIPS, QUIZ, ERA, TILE, CONGRESS } from './data.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
const root = document.documentElement;
const cite = (ns) => ns.map((n) => `<a class="cite" href="#s${n}">${n}</a>`).join('');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------- reveal on scroll ----------
function splitWords(el) { // wrap each word so quotations can arrive word by word
  let i = 0;
  const walk = (node) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part; frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    }
  };
  walk(el);
}
if (!reduced) $$('.say p').forEach(splitWords);
const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); e.target.dispatchEvent(new CustomEvent('seen')); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
$$('.rv, .say, .fig, .wide').forEach((el) => seen.observe(el));

// ---------- scene ----------
let scene = null;
const stage = $('#stage');
async function boot() {
  try {
    const [{ createScene }, land] = await Promise.all([
      import('./scene.js'),
      fetch('data/land.json').then((r) => r.json()).catch(() => []),
      document.fonts?.load('600 200px Fraunces').catch(() => {}),
    ]);
    scene = createScene(stage, { reduced, mobile, land, places: PLACES });
    scene.onLight = showLit;
    stage.classList.add('on');
    if (active) apply(active, true);
  } catch (err) {
    console.warn('The 3D background could not start; the page works without it.', err);
    stage.remove();
  }
}

// ---------- which section is in the middle of the screen ----------
const sections = $$('[data-scene]');
let active = null;
const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
function apply(sec, force) {
  if (sec === active && !force) return;
  active = sec;
  root.dataset.theme = sec.dataset.theme || 'hero';
  $('meta[name="theme-color"]').content = css('--bg') || '#150b1d';
  $('.odo').classList.toggle('on', sec.id !== 'top' && sec.dataset.scene !== 'off');
  stage.classList.toggle('globe-live', sec.dataset.globe === 'live');
  if (!scene) return;
  const name = sec.dataset.scene;
  scene.setVisible(name !== 'off');
  if (name === 'off') return;
  requestAnimationFrame(() => scene.setColors(css('--accent'), css('--accent2')));
  const [x = 0, y = 0, o = 1] = (sec.dataset.pos || '').split(',').map(Number);
  const narrow = innerWidth < 900, reading = o < 1;
  scene.place(narrow ? 0 : x, narrow && sec.dataset.globe ? 0.42 : y, narrow && reading ? Math.min(o, 0.3) : o);
  if (sec.dataset.rank === 'live' && +rank.value > 0) scene.setRank(+rank.value / 100);
  else scene.setShape(name);
  if (sec.dataset.look) { const [la, lo] = sec.dataset.look.split(',').map(Number); scene.lookAt(la, lo, true); }
  if (sec.dataset.globe === 'live') choosePlace(placeIdx, false);
  scene.torchLive(sec.dataset.theme === 'end');
}
const chapters = $$('[data-chapter]');
const railLinks = $$('.rail a');
const bar = $('#bar'), odoY = $('#odoYear'), odoA = $('#odoAge');
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const mid = innerHeight / 2, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    let cur = sections[0];
    for (const s of sections) { if (s.getBoundingClientRect().top <= mid) cur = s; else break; }
    apply(cur);
    const r = cur.getBoundingClientRect(), p = Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height)));
    const y0 = +cur.dataset.year || 1934, y1 = +cur.dataset.yearEnd || y0, yr = Math.round(y0 + (y1 - y0) * p);
    if (odoY.textContent !== String(yr)) { odoY.textContent = yr; odoA.textContent = yr <= 1934 ? 'born' : `age ${yr - 1934}`; }
    let ch = null; for (const c of chapters) if (c.getBoundingClientRect().top <= mid + 1) ch = c;
    const inSources = $('#sources').getBoundingClientRect().top <= mid;
    railLinks.forEach((a) => { const on = inSources ? a.hash === '#sources' : ch && a.hash === '#' + ch.id; a.classList.toggle('on', !!on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);

// ---------- globe: places ----------
let placeIdx = 0;
const placeList = $('#places'), placeCard = $('#placeCard');
PLACES.forEach((p, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" aria-pressed="${i === 0}"><small>${p.when}</small>${esc(p.short)}</button>`;
  li.firstChild.addEventListener('click', () => choosePlace(i, true));
  placeList.append(li);
});
function choosePlace(i, user) {
  placeIdx = i; const p = PLACES[i];
  $$('button', placeList).forEach((b, j) => b.setAttribute('aria-pressed', j === i));
  placeCard.innerHTML = `<p class="kicker" style="margin-bottom:.5rem">${p.when}</p><h4>${esc(p.name)}</h4><p>${p.text}${cite(p.cite)}</p>`;
  if (scene && (user || scene.shape === 'globe')) scene.selectPlace(i);
}
choosePlace(0, false);

// ---------- the Bunny slip ----------
const slipLines = $$('#slip li'), slipBtn = $('#slipBtn'), slipCount = $('#slipCount');
let slipN = 0, slipTimer = 0;
function slipStep() {
  if (slipN < slipLines.length) { slipLines[slipN++].classList.add('in'); slipCount.textContent = `${slipN} of ${slipLines.length} lines`; }
  if (slipN >= slipLines.length) clearInterval(slipTimer);
}
function slipRun() { clearInterval(slipTimer); slipLines.forEach((l) => l.classList.remove('in')); slipN = 0; slipCount.textContent = `0 of ${slipLines.length} lines`; if (reduced) { while (slipN < slipLines.length) slipStep(); } else slipTimer = setInterval(slipStep, 620); }
$('#slip').addEventListener('seen', slipRun);
slipBtn.addEventListener('click', slipRun);

// ---------- ranked to linked ----------
const rank = $('#rankRange'), rankOut = $('#rankOut'), endA = $('#endA'), endB = $('#endB');
const rankText = [
  'A pyramid. A few at the top, most at the bottom, and orders that travel one way.',
  'The rows loosen. People at the bottom can see past the people above them.',
  'Halfway. Nobody is quite sure who is in charge, which is the point.',
  'Almost a circle. Everyone can see everyone else’s face.',
  'A talking circle. Anyone may speak in turn, everyone must listen.',
];
function onRank() {
  const v = +rank.value; rank.style.setProperty('--v', v + '%');
  rankOut.textContent = rankText[Math.min(4, Math.floor(v / 22))];
  endA.style.opacity = 1 - v / 140; endB.style.opacity = .3 + v / 140; endB.style.color = v > 60 ? 'var(--accent)' : '';
  if (scene) scene.setRank(v / 100);
}
rank.addEventListener('input', onRank); rank.style.setProperty('--v', '0%');

// ---------- Ms.: the masthead ----------
const WHY = {
  'Ms.': `The winner. It came from a 1930s secretarial handbook, which advised it when a woman's marital status was unknown.${cite([12])}`,
  Sojourner: `Rejected. It sounded “too much like a travel magazine”.${cite([12])}`,
  Lilith: `Considered, and not chosen.${cite([12])}`,
  Bimbo: `Also considered, and not chosen.${cite([12])}`,
};
const mastName = $('#mastName'), mastWhy = $('#mastWhy');
$$('#mastRow button').forEach((b) => b.addEventListener('click', () => {
  $$('#mastRow button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  mastName.textContent = b.dataset.n; mastName.classList.toggle('no', !!b.dataset.no); mastWhy.innerHTML = WHY[b.dataset.n];
  if (!reduced && window.gsap) gsap.fromTo(mastName, { scale: .86, opacity: 0, rotate: -3 }, { scale: 1, opacity: 1, rotate: 0, duration: .7, ease: 'back.out(1.6)' });
}));

// ---------- Ms.: 300,000 in eight days ----------
const dots = $('#msDots'), msNum = $('#msNum'), msDay = $('#msDay');
for (let i = 0; i < 300; i++) { const d = document.createElement('i'); if (i < 20) d.className = 'pred'; dots.append(d); }
const dotEls = $$('i', dots);
let msRun = 0;
function runMs() {
  const id = ++msRun; dotEls.forEach((d) => d.classList.remove('on'));
  const total = reduced ? 1 : 5200, t0 = performance.now();
  const tick = (now) => {
    if (id !== msRun) return;
    const p = Math.min(1, (now - t0) / total), n = Math.round(p * 300);
    for (let i = 0; i < n; i++) dotEls[i].classList.add('on');
    msNum.textContent = (n * 1000).toLocaleString('en-GB'); msDay.textContent = p >= 1 ? 'Day 8: sold out' : `Day ${Math.min(8, Math.floor(p * 8) + 1)}`;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
$('#counter').classList.add('rv'); seen.observe($('#counter')); $('#counter').addEventListener('seen', runMs);
$('#msReplay').addEventListener('click', runMs);

// ---------- flip cards ----------
$('#flips').innerHTML = FLIPS.map(([topic, line]) => `<button class="flip rv" type="button" aria-pressed="false"><span class="in3"><span class="f"><small>If men could menstruate</small><b>${topic}</b><small>Turn over ↻</small></span><span class="b"><span>“${line}”</span><small>${topic}</small></span></span></button>`).join('');
$$('.flip').forEach((b) => { seen.observe(b); b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true')); });

// ---------- who said it ----------
$('#quiz').innerHTML = QUIZ.map((q, i) => `<div class="q rv" data-i="${i}"><blockquote>“${q.line}”</blockquote><div class="row"><button class="btn" type="button" data-a="1">Hers</button><button class="btn" type="button" data-a="0">Not hers</button></div><p class="ans" aria-live="polite"><span class="verdict"></span>${q.why}${cite(q.cite)}</p></div>`).join('');
$$('.q').forEach((el) => { seen.observe(el); const q = QUIZ[+el.dataset.i]; $$('button', el).forEach((b) => b.addEventListener('click', () => {
  const right = (b.dataset.a === '1') === q.hers; el.classList.add('done');
  $$('button', el).forEach((x) => { x.classList.toggle('right', (x.dataset.a === '1') === q.hers); x.disabled = true; });
  $('.verdict', el).textContent = `${right ? 'Right' : 'Not quite'} · ${q.hers ? 'hers' : 'not hers'}`;
})); });

// ---------- ERA ----------
const tiles = $('#tiles');
tiles.innerHTML = Object.entries(TILE).map(([st, [c, r]]) => `<span data-st="${st}" style="grid-column:${c + 1};grid-row:${r + 1}">${st}</span>`).join('');
let eraI = 0, eraTimer = 0;
function drawEra(pop) {
  const step = ERA.steps[eraI]; let n = 0;
  $$('span', tiles).forEach((t) => {
    const st = t.dataset.st, y = ERA.ratified[st], back = ERA.rescinded[st];
    const yes = y && y <= step.year, was = t.classList.contains('yes') || t.classList.contains('late');
    t.className = ''; if (yes) { n++; t.classList.add(y > 1982 ? 'late' : 'yes'); if (back && back <= step.year) t.classList.add('back'); if (pop && !was) t.classList.add('new'); }
  });
  $('#eraYr').textContent = step.label || step.year; $('#eraN').textContent = n; $('#eraBar').style.width = (n / 38) * 100 + '%';
  $('#eraWhat').innerHTML = step.text; $('#eraPrev').disabled = eraI === 0; $('#eraNext').disabled = eraI === ERA.steps.length - 1;
}
const eraGo = (d) => { eraI = Math.max(0, Math.min(ERA.steps.length - 1, eraI + d)); drawEra(true); };
$('#eraPrev').addEventListener('click', () => { clearInterval(eraTimer); eraGo(-1); });
$('#eraNext').addEventListener('click', () => { clearInterval(eraTimer); eraGo(1); });
$('#eraPlay').addEventListener('click', () => { clearInterval(eraTimer); eraI = 0; drawEra(true); eraTimer = setInterval(() => { if (eraI >= ERA.steps.length - 1) clearInterval(eraTimer); else eraGo(1); }, 1500); });
drawEra(false);

// ---------- women in Congress ----------
const bars = $('#bars'), cgN = $('#cgN'), cgT = $('#cgT');
const maxC = Math.max(...CONGRESS.map((c) => c[2] ));
const ord = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
bars.innerHTML = CONGRESS.map(([n, yr, total, h, s], i) => `<button type="button" style="--i:${i}" data-h="${(total / maxC) * 100}" class="${yr === 1933 || yr === 1971 || yr === 2025 ? 'mark' : ''}" aria-label="${ord(n)} Congress, ${yr} to ${yr + 2}: ${total} women, ${h} in the House and ${s} in the Senate"></button>`).join('');
const barEls = $$('button', bars);
function showC(i) {
  const [n, yr, total, h, s] = CONGRESS[i]; barEls.forEach((b, j) => b.classList.toggle('sel', j === i));
  cgN.textContent = total;
  const tag = yr === 1933 ? ' The Congress sitting when she was born.' : yr === 1971 ? ' The year the caucus was founded.' : yr === 2025 ? ' The Congress sitting when she died.' : '';
  cgT.innerHTML = `${total === 1 ? 'woman' : 'women'} served in the ${ord(n)} Congress, ${yr}–${yr + 2}: ${h} in the House and ${s} in the Senate.${tag}`;
}
barEls.forEach((b, i) => { b.addEventListener('pointerenter', () => showC(i)); b.addEventListener('focus', () => showC(i)); b.addEventListener('click', () => showC(i));
  b.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d && barEls[i + d]) { e.preventDefault(); barEls[i + d].focus(); } }); b.tabIndex = i === CONGRESS.length - 1 ? 0 : -1; });
$('#chart').addEventListener('seen', () => barEls.forEach((b) => { b.style.height = Math.max(.6, +b.dataset.h) + '%'; }));
showC(CONGRESS.length - 1);

// ---------- torches ----------
const lightCount = $('#lightCount');
function showLit(r) { if (r) lightCount.textContent = r.lit >= r.total ? `All ${r.total} torches are lit.` : `${r.lit} of ${r.total} torches lit.`; }
$('#lightBtn').addEventListener('click', () => { if (scene) showLit(scene.lightNext()); else lightCount.textContent = 'The torches need WebGL, which this browser has switched off.'; });

// ---------- go ----------
onScroll();
boot();
