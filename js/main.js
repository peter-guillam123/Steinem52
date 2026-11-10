// Linked, not ranked: scroll logic and the small interactives.
import { PLACES, FLIPS, QUIZ, ERA, TILE, CONGRESS, ARRIVALS, KEY, ROE } from './data.js';

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
      document.fonts?.load('italic 400 200px Fraunces').catch(() => {}),
    ]);
    scene = createScene(stage, { reduced, mobile, land, places: PLACES });
    scene.bindDrag($('#globeDrag'));
    stage.classList.add('on');
    if (active) apply(active, true);
  } catch (err) {
    console.warn('The 3D background could not start; the page works without it.', err);
    stage.remove();
  }
}

// ---------- which section is in the middle of the screen ----------
const sections = $$('[data-scene]');
let active = null, globeLive = false;
const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();
// how far the reader is through the pyramid-to-circle passage, 0 to 1
function rankP(sec) { const r = sec.getBoundingClientRect(), vh = innerHeight; return Math.min(1, Math.max(0, (-r.top - vh * 0.15) / Math.max(1, r.height - vh * 1.75))); }
function apply(sec, force) {
  if (sec === active && !force) return;
  active = sec;
  root.dataset.theme = sec.dataset.theme || 'hero';
  $('meta[name="theme-color"]').content = css('--bg') || '#150b1d';
  $('.odo').classList.toggle('on', sec.id !== 'top' && sec.dataset.scene !== 'off');
  globeLive = sec.dataset.globe === 'live';
  if (!scene) return;
  const name = sec.dataset.scene;
  scene.setVisible(name !== 'off');
  if (name === 'off') return;
  requestAnimationFrame(() => scene.setColors(css('--accent'), css('--accent2')));
  const [x = 0, y = 0, o = 1] = (sec.dataset.pos || '').split(',').map(Number);
  const narrow = innerWidth < 900, reading = o < 1;
  const flat = ['road', 'crowd', 'torches', 'dust'].includes(name);
  // on a phone the shape sits in the top half and the words in the bottom half
  scene.place(narrow ? 0 : x, narrow && !reading && !flat ? (sec.id === 'top' ? y : 0.4) : narrow && sec.dataset.globe ? 0.42 : y, narrow && reading ? Math.min(o, 0.3) : o);
  if (sec.dataset.rank === 'scroll') scene.setRank(rankP(sec));
  else scene.setShape(name);
  if (sec.dataset.look) { const [la, lo] = sec.dataset.look.split(',').map(Number); scene.lookAt(la, lo, true); }
  if (globeLive) choosePlace(placeIdx, false);
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
    if (scene && cur.dataset.rank === 'scroll') scene.setRank(rankP(cur));
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
const placeList = $('#places'), placeCard = $('#placeCard'), globeLabel = $('#globeLabel'), dragBox = $('#globeDrag');
PLACES.forEach((p, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" aria-pressed="${i === 0}"><small>${p.when}</small>${esc(p.short)}</button>`;
  li.firstChild.addEventListener('click', () => choosePlace(i, true));
  placeList.append(li);
});
function choosePlace(i, user) {
  placeIdx = (i + PLACES.length) % PLACES.length; const p = PLACES[placeIdx];
  $$('button', placeList).forEach((b, j) => b.setAttribute('aria-pressed', j === placeIdx));
  placeCard.innerHTML = `<p class="kicker" style="margin-bottom:.5rem">Stop ${placeIdx + 1} of ${PLACES.length} · ${p.when}</p><h4>${esc(p.name)}</h4><p>${p.text}${cite(p.cite)}</p>`;
  globeLabel.innerHTML = `<b>${esc(p.short)}</b> ${p.when}`;
  if (scene && (user || scene.shape === 'globe')) scene.selectPlace(placeIdx);
}
$('#placeNext').addEventListener('click', () => choosePlace(placeIdx + 1, true));
$('#placePrev').addEventListener('click', () => choosePlace(placeIdx - 1, true));
choosePlace(0, false);
(function pin() { // keep the name tag on the chosen place as the globe turns
  requestAnimationFrame(pin);
  if (!scene || !globeLive) { globeLabel.classList.remove('on'); return; }
  const q = scene.placeOnScreen(placeIdx); if (!q) return;
  const box = dragBox.getBoundingClientRect(); // only show the tag where the globe is, not over the text
  globeLabel.classList.toggle('on', q.facing && q.y > box.top - 10 && q.y < box.bottom + 10 && q.x > box.left - 10 && q.x < box.right + 10);
  globeLabel.style.transform = `translate(${Math.round(q.x)}px, ${Math.round(q.y)}px)`;
})();

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
const bars = $('#bars'), cgN = $('#cgN'), cgT = $('#cgT'), cgY = $('#cgY'), cgNote = $('#cgNote'), cgNames = $('#cgNames');
const maxC = Math.max(...CONGRESS.map((c) => c[2]));
const ord = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
const keyIdx = CONGRESS.map((c, i) => (KEY[c[0]] ? i : -1)).filter((i) => i >= 0);
bars.innerHTML = CONGRESS.map(([n, yr, total], i) => `<button type="button" style="--i:${i}" data-h="${(total / maxC) * 100}" class="${KEY[n] ? 'mark' : ''}" aria-label="${ord(n)} Congress, ${yr} to ${yr + 2}: ${total} women${KEY[n] ? '. ' + KEY[n][0] : ''}"></button>`).join('');
const barEls = $$('button', bars);
let cgI = 0;
function showC(i) {
  cgI = i; const [n, yr, total, h, s] = CONGRESS[i], k = KEY[n], who = ARRIVALS[n] || [];
  barEls.forEach((b, j) => { b.classList.toggle('sel', j === i); b.tabIndex = j === i ? 0 : -1; });
  cgY.textContent = `${ord(n)} Congress · ${yr}–${yr + 2}`; cgN.textContent = total;
  cgT.textContent = `${total === 1 ? 'woman' : 'women'}: ${h} in the House, ${s} in the Senate`;
  cgNote.innerHTML = k ? `<strong>${k[0]}.</strong> ${k[1]}${cite(k[2])}` : '';
  const shown = who.slice(0, 8).map(esc).join(', ');
  cgNames.innerHTML = who.length ? `<span>New this Congress (${who.length})</span>${shown}${who.length > 8 ? `, and ${who.length - 8} more` : ''}.` : '<span>New this Congress</span>No woman arrived for the first time.';
  $('#cgPrev').disabled = !keyIdx.some((x) => x < i); $('#cgNext').disabled = !keyIdx.some((x) => x > i);
}
barEls.forEach((b, i) => {
  b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showC(i); });
  b.addEventListener('focus', () => showC(i)); b.addEventListener('click', () => showC(i));
  b.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d && barEls[i + d]) { e.preventDefault(); barEls[i + d].focus(); } });
});
$('#cgNext').addEventListener('click', () => { const n = keyIdx.find((x) => x > cgI); if (n !== undefined) showC(n); });
$('#cgPrev').addEventListener('click', () => { const n = [...keyIdx].reverse().find((x) => x < cgI); if (n !== undefined) showC(n); });
$('#chart').addEventListener('seen', () => barEls.forEach((b) => { b.style.height = Math.max(0.6, +b.dataset.h) + '%'; }));
showC(0);

// ---------- while Roe stood ----------
const roeTrack = $('#roeTrack'), LIFE0 = 1934.23, LIFE = 92.44;
const pct = (y) => ((y - LIFE0) / LIFE) * 100;
const span = $('.span', roeTrack); span.style.left = pct(1973.06) + '%'; span.style.width = pct(2022.48) - pct(1973.06) + '%';
const usedYr = {};
ROE.forEach(([yr, head], i) => {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'tick';
  const off = usedYr[yr] ? 0.9 : 0; usedYr[yr] = 1; b.style.left = pct(yr + 0.5 + off) + '%';
  b.setAttribute('aria-label', `${yr}: ${head}`);
  b.addEventListener('click', () => { stopRoe(); showRoe(i); });
  roeTrack.append(b);
});
const roeTicks = $$('.tick', roeTrack);
let roeI = 0, roeTimer = 0;
function showRoe(i) {
  roeI = i; const [yr, head, text, src] = ROE[i];
  roeTicks.forEach((t, j) => { t.classList.toggle('on', j === i); t.classList.toggle('past', j < i); });
  $('#roeYr').textContent = yr; $('#roeH').textContent = head; $('#roeP').innerHTML = text + cite(src);
  $('#roeN').textContent = `${i + 1} of ${ROE.length}`;
  $('#roePrev').disabled = i === 0; $('#roeNext').disabled = i === ROE.length - 1;
}
function stopRoe() { clearInterval(roeTimer); roeTimer = 0; $('#roePlay').textContent = 'Play'; }
function playRoe() {
  stopRoe(); if (roeI >= ROE.length - 1) showRoe(0);
  $('#roePlay').textContent = 'Pause';
  roeTimer = setInterval(() => { if (roeI >= ROE.length - 1) stopRoe(); else showRoe(roeI + 1); }, 2600);
}
$('#roePrev').addEventListener('click', () => { stopRoe(); showRoe(Math.max(0, roeI - 1)); });
$('#roeNext').addEventListener('click', () => { stopRoe(); showRoe(Math.min(ROE.length - 1, roeI + 1)); });
$('#roePlay').addEventListener('click', () => (roeTimer ? stopRoe() : playRoe()));
$('#roe').addEventListener('seen', () => { if (!reduced) playRoe(); });
showRoe(0);

// ---------- go ----------
onScroll();
boot();
