// The background scene: one cloud of particles that takes a new shape for each chapter.
import * as THREE from 'three';

const DEG = Math.PI / 180;
const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;

export function createScene(canvas, { reduced = false, mobile = false, land = [], places = [] } = {}) {
  const N = mobile ? 11000 : 26000;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  const px = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(px);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 5;
  const rig = new THREE.Group();   // moves and fades with the chapter
  const spin = new THREE.Group();  // rotates (the globe, the pointer sway)
  rig.add(spin); scene.add(rig);

  // ---------- shapes ----------
  const shapes = {};
  const make = (fn) => { const pos = new Float32Array(N * 3), al = new Float32Array(N); fn(pos, al); return { pos, al }; };
  const put = (pos, i, x, y, z) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; };

  shapes.dust = make((p, a) => { for (let i = 0; i < N; i++) { put(p, i, rnd(-4.6, 4.6), rnd(-2.8, 2.8), rnd(-4, 1.2)); a[i] = rnd(.08, .5); } });

  // Her aviators, modelled on the 1972 photograph: big rounded teardrop lenses, thin wire, a double bridge, long arms.
  shapes.glasses = make((p, a) => {
    const pw = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
    const lens = (t, side, k = 1) => {
      const c = Math.cos(t), s = Math.sin(t), up = s > 0;
      let x = .6 * pw(c, up ? .72 : .86), y = (up ? .44 : .62) * pw(s, up ? .62 : .9);
      if (!up) x += side * .1 * -s * (1 - .5 * c * side); // the lower edge swings out towards the cheek
      y += -side * x * .04;                                 // the top line dips a little towards the nose
      return [side * .74 + x * k, y * k - .02];
    };
    for (let i = 0; i < N; i++) {
      const r = Math.random(), side = i % 2 ? 1 : -1;
      if (r < .56) { const [x, y] = lens(rnd(Math.PI * 2), side); put(p, i, x + gauss() * .008, y + gauss() * .008, gauss() * .012); a[i] = 1; }
      else if (r < .74) { const [x, y] = lens(rnd(Math.PI * 2), side, Math.sqrt(Math.random()) * .97); put(p, i, x, y, -.02); a[i] = .07 + .2 * Math.max(0, y + .2); }
      else if (r < .8) { const t = rnd(-1, 1); put(p, i, t * .3, .4 + gauss() * .006, 0); a[i] = .95; }
      else if (r < .85) { const t = rnd(-1, 1); put(p, i, t * .17, .17 - .09 * (1 - t * t) + gauss() * .006, 0); a[i] = .95; }
      else { // an arm running back to the ear, with a hook at the end
        const t = Math.random(), hook = t > .82 ? (t - .82) / .18 : 0;
        put(p, i, side * (1.37 + .04 * t), .3 - .02 * t - .3 * hook * hook, -t * 2.3); a[i] = (side < 0 ? .95 : .3) * (1 - t * .35);
      }
    }
  });

  shapes.road = make((p, a) => {
    for (let i = 0; i < N; i++) {
      const r = Math.random(), z = 3 - Math.pow(Math.random(), 1.4) * 26;
      if (r < .26) { put(p, i, (i % 2 ? 1 : -1) * 1.25 + gauss() * .015, -1.05, z); a[i] = .95; }
      else if (r < .42) { const zz = Math.floor(z / 1.6) * 1.6 + rnd(.7); put(p, i, gauss() * .02, -1.05, zz); a[i] = 1; }
      else if (r < .68) { put(p, i, rnd(-9, 9), -1.06 + gauss() * .01, z); a[i] = .22; }
      else if (r < .76) { const k = Math.floor(rnd(14)); const s = k % 2 ? 1 : -1; put(p, i, s * 1.9 + gauss() * .01, -1.05 + rnd(1.5), 2 - k * 1.9); a[i] = .7; }
      else { const t = rnd(Math.PI); put(p, i, Math.cos(t) * rnd(3, 13), .2 + Math.sin(t) * rnd(0, 5), -24 + rnd(6)); a[i] = rnd(.15, .8); }
    }
  });

  const R = 1.28;
  const ll = (lat, lon, r = R) => { const a = lat * DEG, o = lon * DEG; return [r * Math.cos(a) * Math.sin(o), r * Math.sin(a), r * Math.cos(a) * Math.cos(o)]; };
  shapes.globe = make((p, a) => {
    const L = land.length / 2;
    for (let i = 0; i < N; i++) {
      if (L && i < N * .82) { const k = Math.floor(rnd(L)); const [x, y, z] = ll(land[k * 2 + 1] / 10 + gauss() * .35, land[k * 2] / 10 + gauss() * .35); put(p, i, x, y, z); a[i] = .9; }
      else { const u = rnd(-1, 1), t = rnd(Math.PI * 2), s = Math.sqrt(1 - u * u); put(p, i, R * .995 * s * Math.cos(t), R * .995 * u, R * .995 * s * Math.sin(t)); a[i] = .12; }
    }
  });

  shapes.ears = make((p, a) => {
    const ear = (t, k, side) => { // an upright ellipse, tipped about its base
      const tilt = (side > 0 ? -7 : 15) * DEG, x = .19 * k * Math.cos(t), y = .86 + .86 * k * Math.sin(t);
      return [side * .3 + x * Math.cos(tilt) - y * Math.sin(tilt), -.42 + x * Math.sin(tilt) + y * Math.cos(tilt)];
    };
    for (let i = 0; i < N; i++) {
      const r = Math.random(), side = i % 2 ? 1 : -1;
      if (r < .5) { const [x, y] = ear(rnd(Math.PI * 2), 1, side); put(p, i, x + gauss() * .01, y + gauss() * .01, gauss() * .03); a[i] = 1; }
      else if (r < .68) { const [x, y] = ear(rnd(Math.PI * 2), Math.sqrt(Math.random()) * .62, side); put(p, i, x, y, -.02); a[i] = .3; }
      else if (r < .9) { const t = Math.random(), u = rnd(-1, 1); put(p, i, side * (.07 + t * .46), -1.0 + u * (.05 + t * .2), gauss() * .02); a[i] = .95; }
      else { const t = rnd(Math.PI * 2), k = Math.sqrt(Math.random()) * .08; put(p, i, k * Math.cos(t), -1.0 + k * Math.sin(t), .02); a[i] = 1; }
    }
  });

  // pyramid and circle share the same clusters, so each "person" keeps their particles
  const ROWS = 8, nodes = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c <= r; c++) nodes.push({ r, c });
  const K = nodes.length, per = Math.floor(N * .8 / K);
  const pyr = (n) => [(n.c - n.r / 2) * .38, 1.05 - n.r * .29];
  const cir = (j) => { const t = (j / K) * Math.PI * 2 + Math.PI / 2; return [Math.cos(t) * 1.12, Math.sin(t) * 1.12 - .03]; };
  const cluster = (posOf, linkOf) => make((p, a) => {
    for (let i = 0; i < N; i++) {
      const j = Math.floor(i / per);
      if (j < K) { const [x, y] = posOf(j); const big = linkOf === 'pyr' ? (nodes[j].r === 0 ? 2.1 : 1 - nodes[j].r * .055) : 1; const t = rnd(Math.PI * 2), k = Math.sqrt(Math.random()) * .085 * big; put(p, i, x + k * Math.cos(t), y + k * Math.sin(t), gauss() * .03); a[i] = linkOf === 'pyr' ? (nodes[j].r === 0 ? 1 : .95 - nodes[j].r * .09) : .95; }
      else {
        const j2 = Math.floor(rnd(K)), t = Math.random();
        if (linkOf === 'pyr') { const n = nodes[j2]; if (n.r === ROWS - 1) { const [x, y] = pyr(n); put(p, i, x, y, 0); a[i] = .1; continue; } const [x1, y1] = pyr(n), [x2, y2] = pyr({ r: n.r + 1, c: n.c + (i % 2) }); put(p, i, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 0); a[i] = .34; }
        else { const hop = [1, 1, 1, 9, 14, 17][i % 6]; const [x1, y1] = cir(j2), [x2, y2] = cir((j2 + hop) % K); put(p, i, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 0); a[i] = hop === 1 ? .5 : .16; }
      }
    }
  });
  shapes.pyramid = cluster((j) => pyr(nodes[j]), 'pyr');
  shapes.circle = cluster((j) => cir(j), 'cir');

  const textShape = (str, font, size, scale) => make((p, a) => {
    const c = document.createElement('canvas'); c.width = 760; c.height = 380; const g = c.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${font} ${size}px Fraunces, Georgia, serif`; g.fillText(str, 380, 200);
    const d = g.getImageData(0, 0, 760, 380).data, pts = [];
    for (let y = 0; y < 380; y += 2) for (let x = 0; x < 760; x += 2) if (d[(y * 760 + x) * 4 + 3] > 128) pts.push(x, y);
    const M = pts.length / 2 || 1;
    for (let i = 0; i < N; i++) { const k = Math.floor(rnd(M)); put(p, i, ((pts[k * 2] || 380) - 380) / scale + gauss() * .006, -((pts[k * 2 + 1] || 190) - 190) / scale + gauss() * .006, gauss() * .06); a[i] = rnd(.55, 1); }
  });
  shapes.ms = textShape('Ms.', '600', 330, 215);
  shapes.question = textShape('?', 'italic 400', 360, 150);

  // 38 lights, one for each state the amendment needed: 35 lit, three dark
  shapes.tally = make((p, a) => {
    const spot = (k) => { const row = Math.floor(k / 10), col = k % 10, n = row === 3 ? 8 : 10; return [(col - (n - 1) / 2) * .3, .62 - row * .4]; };
    const each = Math.floor(N / 38);
    for (let i = 0; i < N; i++) {
      const k = Math.min(37, Math.floor(i / each)), [x, y] = spot(k), lit = k < 35, t = rnd(Math.PI * 2);
      const r = lit ? Math.sqrt(Math.random()) * .1 : .1 + gauss() * .004;
      put(p, i, x + r * Math.cos(t), y + r * Math.sin(t), gauss() * .02); a[i] = lit ? rnd(.6, 1) : .3;
    }
  });

  shapes.rings = make((p, a) => {
    for (let i = 0; i < N; i++) {
      const t = rnd(Math.PI * 2), tube = gauss() * .035, r = .82 + tube;
      if (i % 2) { put(p, i, -.5 + r * Math.cos(t), r * Math.sin(t), gauss() * .035); }
      else { const y = r * Math.sin(t), tilt = 62 * DEG; put(p, i, .5 + r * Math.cos(t), y * Math.cos(tilt), y * Math.sin(tilt) + gauss() * .03); }
      a[i] = rnd(.5, 1);
    }
  });

  shapes.crowd = make((p, a) => {
    const signs = []; for (let k = 0; k < 46; k++) { const z = 2 - Math.pow(Math.random(), 1.1) * 13; signs.push([rnd(-1, 1) * (1.8 + (2.4 - z) * .5), z, rnd(.16, .26), rnd(.1, .16), rnd(.2, .38)]); }
    for (let i = 0; i < N; i++) {
      if (i % 9 === 0) { // a placard held over the heads
        const [sx, sz, w, h, up] = signs[i % signs.length], e = Math.floor(rnd(5)), t = Math.random();
        if (e === 4) { put(p, i, sx, -1.08 + t * up, sz); a[i] = .5; }
        else { const x = e < 2 ? (t - .5) * w : (e === 2 ? -w / 2 : w / 2), y = e < 2 ? (e ? h : 0) : t * h; put(p, i, sx + x, -1.08 + up + y, sz); a[i] = .95; }
      } else { // a head and shoulders
        const z = 2.4 - Math.pow(Math.random(), 1.25) * 20, w = 2.2 + (2.4 - z) * .55, head = i % 3 === 0;
        put(p, i, rnd(-w, w), head ? -1.03 + gauss() * .012 : -1.15 + Math.abs(gauss()) * .06, z); a[i] = head ? 1 : rnd(.3, .7);
      }
    }
  });

  const T = mobile ? 70 : 130, tPer = Math.floor(N / T), torch = [];
  shapes.torches = make((p, a) => {
    for (let k = 0; k < T; k++) torch.push({ x: rnd(-3.9, 3.9), y: rnd(-1.9, 1.7), z: rnd(-3.4, .6), lit: k < 5 });
    torch[0].x = 0; torch[0].y = -.1; torch[0].z = .4;
    for (let i = 0; i < N; i++) {
      const f = torch[Math.min(T - 1, Math.floor(i / tPer))], h = Math.pow(Math.random(), 1.7), w = (1 - h) * .1;
      put(p, i, f.x + gauss() * w, f.y + h * .34 - .05, f.z + gauss() * w); a[i] = f.lit ? rnd(.6, 1) : .1;
    }
  });

  // ---------- particle material ----------
  const geo = new THREE.BufferGeometry();
  const aFrom = new THREE.BufferAttribute(new Float32Array(shapes.dust.pos), 3);
  const aTo = new THREE.BufferAttribute(new Float32Array(shapes.dust.pos), 3);
  const aAF = new THREE.BufferAttribute(new Float32Array(shapes.dust.al), 1);
  const aAT = new THREE.BufferAttribute(new Float32Array(shapes.dust.al), 1);
  const rand = new Float32Array(N); for (let i = 0; i < N; i++) rand[i] = Math.random();
  geo.setAttribute('position', aTo); geo.setAttribute('aFrom', aFrom); geo.setAttribute('aTo', aTo);
  geo.setAttribute('aAF', aAF); geo.setAttribute('aAT', aAT); geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
  const U = {
    uMix: { value: 1 }, uTime: { value: 0 }, uSize: { value: mobile ? 26 : 30 }, uPx: { value: px }, uWave: { value: 0 }, uStag: { value: .55 },
    uOpacity: { value: 0 }, uFlick: { value: 0 }, uA: { value: new THREE.Color('#ff5a36') }, uB: { value: new THREE.Color('#f5b82e') }, uInk: { value: new THREE.Color('#f6ead9') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aFrom; attribute vec3 aTo; attribute float aAF; attribute float aAT; attribute float aRand;
      uniform float uMix, uTime, uSize, uPx, uWave, uStag, uFlick; varying float vA; varying float vC;
      void main(){
        float m = clamp((uMix - aRand * uStag) / (1.0 - uStag), 0.0, 1.0); m = m * m * (3.0 - 2.0 * m);
        vec3 p = mix(aFrom, aTo, m);
        float k = sin(m * 3.14159);
        p += k * 0.42 * vec3(sin(aRand * 40.0 + uTime * 0.6), cos(aRand * 31.0 + uTime * 0.5), sin(aRand * 17.0 + uTime * 0.4));
        p += 0.011 * vec3(sin(uTime * 0.7 + aRand * 50.0), cos(uTime * 0.6 + aRand * 70.0), sin(uTime * 0.5 + aRand * 90.0));
        p.y += uWave * 0.016 * sin(p.x * 3.0 + p.z * 2.0 + uTime * 1.3);
        p.y += uFlick * 0.03 * sin(uTime * 5.0 + aRand * 60.0) * fract(aRand * 9.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float tw = 0.72 + 0.28 * sin(uTime * 1.7 + aRand * 100.0);
        vA = mix(aAF, aAT, m) * tw; vC = fract(aRand * 13.0);
        gl_PointSize = max(1.0, uSize * uPx * (0.55 + 0.9 * fract(aRand * 7.0)) / -mv.z);
      }`,
    fragmentShader: `
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uInk; uniform float uOpacity; varying float vA; varying float vC;
      void main(){
        float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.08, d);
        vec3 c = vC < 0.55 ? uA : (vC < 0.85 ? uB : uInk);
        gl_FragColor = vec4(c, a * vA * uOpacity);
      }`,
  });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; spin.add(points);

  // ---------- globe furniture: markers, route, pulse ----------
  const globeKit = new THREE.Group(); globeKit.visible = false; spin.add(globeKit);
  const kitMat = { m: null, l: null, r: null };
  if (places.length) {
    const mp = new Float32Array(places.length * 3); places.forEach((pl, i) => mp.set(ll(pl.lat, pl.lon, R * 1.012), i * 3));
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    const dot = document.createElement('canvas'); dot.width = dot.height = 64; const dg = dot.getContext('2d'); const gr = dg.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, '#fff'); gr.addColorStop(.35, '#fff'); gr.addColorStop(.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, 64, 64);
    kitMat.m = new THREE.PointsMaterial({ size: .1, map: new THREE.CanvasTexture(dot), transparent: true, depthWrite: false, depthTest: false, color: '#fff3d6', opacity: 0 });
    globeKit.add(new THREE.Points(mg, kitMat.m));
    const lp = [];
    for (let i = 0; i < places.length - 1; i++) {
      const a = new THREE.Vector3(...ll(places[i].lat, places[i].lon, 1)), b = new THREE.Vector3(...ll(places[i + 1].lat, places[i + 1].lon, 1)), ang = a.angleTo(b);
      for (let s = 0; s < 40; s++) for (const t of [s / 40, (s + 1) / 40]) { const v = new THREE.Vector3().copy(a).multiplyScalar(Math.sin((1 - t) * ang)).addScaledVector(b, Math.sin(t * ang)).normalize(); v.multiplyScalar(R * (1.012 + Math.sin(t * Math.PI) * Math.min(.22, ang * .16))); lp.push(v.x, v.y, v.z); }
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    kitMat.l = new THREE.LineBasicMaterial({ color: '#ffb35a', transparent: true, opacity: 0, depthTest: false });
    globeKit.add(new THREE.LineSegments(lg, kitMat.l));
    kitMat.d = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthTest: false });
    var done = new THREE.LineSegments(lg.clone(), kitMat.d); done.geometry.setDrawRange(0, 0); globeKit.add(done);
    kitMat.s = new THREE.PointsMaterial({ size: .3, map: kitMat.m.map, transparent: true, depthWrite: false, depthTest: false, color: '#ffffff', opacity: 0 });
    var here = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3)), kitMat.s); here.frustumCulled = false; globeKit.add(here);
    kitMat.r = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false });
    var ring = new THREE.Mesh(new THREE.RingGeometry(.05, .062, 40), kitMat.r); globeKit.add(ring);
  }

  // ---------- state ----------
  const POSE = { glasses: [.08, .6, -.1] }; // three-quarter view, as she wears them in the photograph below the title
  const S = { rotZ: 0, tRotZ: 0, shape: 'dust', x: 0, y: 0, tx: 0, ty: 0, scale: 1, rotX: 0, rotY: 0, tRotX: 0, tRotY: 0, drag: false, px: 0, py: 0, autoSpin: 0, visible: true, torchLive: false };
  const dur = (d) => (reduced ? 0.01 : d);
  const gs = window.gsap;
  const ease = (m) => m * m * (3 - 2 * m);

  function freeze() { // bake the current in-between positions into aFrom
    const mix = U.uMix.value, st = U.uStag.value, f = aFrom.array, t = aTo.array, af = aAF.array, at = aAT.array;
    for (let i = 0; i < N; i++) {
      const m = ease(Math.min(1, Math.max(0, (mix - rand[i] * st) / (1 - st)))), j = i * 3;
      f[j] += (t[j] - f[j]) * m; f[j + 1] += (t[j + 1] - f[j + 1]) * m; f[j + 2] += (t[j + 2] - f[j + 2]) * m; af[i] += (at[i] - af[i]) * m;
    }
    aFrom.needsUpdate = true; aAF.needsUpdate = true;
  }
  function setShape(name, opts = {}) {
    if (!shapes[name] || (name === S.shape && !opts.force)) return;
    gs.killTweensOf(U.uMix); S.pendingRank = null; freeze();
    aTo.array.set(shapes[name].pos); aAT.array.set(shapes[name].al); aTo.needsUpdate = true; aAT.needsUpdate = true;
    U.uStag.value = opts.stag ?? .55; U.uMix.value = 0; S.shape = name;
    S.morphing = true;
    gs.to(U.uMix, { value: 1, duration: dur(opts.dur ?? 2.6), ease: 'power2.inOut', onComplete: () => { S.morphing = false; if (S.pendingRank != null) { const v = S.pendingRank; S.pendingRank = null; setRank(v); } } });
    gs.to(U.uWave, { value: name === 'crowd' ? 1 : 0, duration: dur(1.5) });
    gs.to(U.uFlick, { value: name === 'torches' ? 1 : 0, duration: dur(1.5) });
    const g = name === 'globe'; if (g) globeKit.visible = true;
    for (const k of ['m', 'l', 'r', 'd', 's']) if (kitMat[k]) gs.to(kitMat[k], { opacity: g ? ({ l: .28, r: 0, m: .7, d: .95, s: 1 })[k] : 0, duration: dur(g ? 2 : .5), delay: g ? dur(1.6) : 0, onComplete: () => { if (!g && S.shape !== 'globe') globeKit.visible = false; } });
    if (!g) { const [rx, ry, rz] = POSE[name] || [0, 0, 0]; S.tRotX = rx; S.tRotY = ry; S.tRotZ = rz; S.autoSpin = 0; } else S.tRotZ = 0;
  }
  // the ranked-to-linked slider drives the morph by hand
  function setRank(v) {
    if (S.shape !== 'pyramid' && S.shape !== 'circle') { S.pendingRank = v; setShape(v > .5 ? 'circle' : 'pyramid', { dur: 1.6 }); return; }
    if (S.morphing) { S.pendingRank = v; return; }
    gs.killTweensOf(U.uMix);
    aFrom.array.set(shapes.pyramid.pos); aAF.array.set(shapes.pyramid.al); aTo.array.set(shapes.circle.pos); aAT.array.set(shapes.circle.al);
    aFrom.needsUpdate = aTo.needsUpdate = aAF.needsUpdate = aAT.needsUpdate = true;
    U.uStag.value = .25; U.uMix.value = v; S.shape = v > .5 ? 'circle' : 'pyramid'; S.rankLock = true;
  }
  function setColors(a, b) { const ca = new THREE.Color(a), cb = new THREE.Color(b); gs.to(U.uA.value, { r: ca.r, g: ca.g, b: ca.b, duration: dur(1.4) }); gs.to(U.uB.value, { r: cb.r, g: cb.g, b: cb.b, duration: dur(1.4) }); }
  function place(x, y, o) { S.tx = x; S.ty = y; gs.to(U.uOpacity, { value: o, duration: dur(1.2), overwrite: true }); }
  function lookAt(lat, lon, spinAfter = false) {
    S.tRotX = lat * DEG * .85; let ty = -lon * DEG; const cur = S.tRotY; ty += Math.round((cur - ty) / (Math.PI * 2)) * Math.PI * 2; S.tRotY = ty; S.autoSpin = spinAfter ? 1 : 0;
  }
  function selectPlace(i) {
    const pl = places[i]; if (!pl || !ring) return; lookAt(pl.lat, pl.lon); S.sel = i;
    const v = new THREE.Vector3(...ll(pl.lat, pl.lon, R * 1.016)); ring.position.copy(v); ring.lookAt(v.clone().multiplyScalar(2));
    here.geometry.attributes.position.setXYZ(0, v.x, v.y, v.z); here.geometry.attributes.position.needsUpdate = true;
    done.geometry.setDrawRange(0, i * 80);
    gs.killTweensOf(ring.scale); gs.killTweensOf(kitMat.r); ring.scale.setScalar(.8); kitMat.r.opacity = 1;
    if (!reduced) gs.to(ring.scale, { x: 3.4, y: 3.4, z: 3.4, duration: 1.6, repeat: -1, ease: 'power1.out' }), gs.to(kitMat.r, { opacity: 0, duration: 1.6, repeat: -1, ease: 'power1.in' });
  }
  function setVisible(v) { S.visible = v; canvas.classList.toggle('on', v); }

  // torches
  let lit = 5;
  function light(k) {
    const f = torch[k]; if (!f || f.lit) return false; f.lit = true; lit++;
    const from = k * tPer, to = k === T - 1 ? N : from + tPer, sh = shapes.torches.al;
    for (let i = from; i < to; i++) sh[i] = rnd(.6, 1);
    if (S.shape === 'torches') { const o = { v: 0 }; gs.to(o, { v: 1, duration: dur(.9), onUpdate: () => { for (let i = from; i < to; i++) aAT.array[i] = .1 + (sh[i] - .1) * o.v; aAT.needsUpdate = true; } }); }
    return true;
  }
  const v3 = new THREE.Vector3();
  function lightNear(cx, cy) { // pointer in normalised device coordinates
    if (S.shape !== 'torches') return null; let hit = false;
    torch.forEach((f, k) => { if (f.lit) return; v3.set(f.x, f.y + .1, f.z).applyMatrix4(points.matrixWorld).project(camera); if (Math.hypot(v3.x - cx, (v3.y - cy) * (canvas.clientHeight / canvas.clientWidth)) < .075) hit = light(k) || hit; });
    return hit ? { lit, total: T } : null;
  }

  // ---------- pointer ----------
  window.addEventListener('pointermove', (e) => {
    S.px = (e.clientX / window.innerWidth) * 2 - 1; S.py = -((e.clientY / window.innerHeight) * 2 - 1);
    if (S.drag) { S.tRotY += (e.clientX - S.lx) * .006; S.tRotX = Math.max(-1.2, Math.min(1.2, S.tRotX + (e.clientY - S.ly) * .005)); S.lx = e.clientX; S.ly = e.clientY; S.autoSpin = 0; }
    if (S.torchLive) lightNear(S.px, S.py);
  }, { passive: true });
  // The page content sits above the canvas, so dragging is bound to an element in the page.
  function bindDrag(el) {
    el.addEventListener('pointerdown', (e) => { if (S.shape !== 'globe') return; S.drag = true; S.lx = e.clientX; S.ly = e.clientY; el.classList.add('dragging'); });
    const end = () => { S.drag = false; el.classList.remove('dragging'); };
    window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  }
  const pv = new THREE.Vector3();
  function placeOnScreen(i) { // where a place sits on the page, and whether it faces us
    const pl = places[i]; if (!pl) return null;
    pv.set(...ll(pl.lat, pl.lon, R * 1.02)).applyMatrix4(points.matrixWorld);
    const facing = pv.clone().sub(rig.position).normalize().dot(camera.position.clone().sub(pv).normalize()) > .12;
    pv.project(camera);
    return { x: (pv.x + 1) / 2 * canvas.clientWidth, y: (1 - pv.y) / 2 * canvas.clientHeight, facing };
  }

  // ---------- loop ----------
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    S.halfH = Math.tan(20 * DEG) * 5; S.halfW = S.halfH * camera.aspect; S.narrow = w < 900;
    S.fit = Math.min(1, Math.max(.5, (S.halfW * 2) / 3.4));
  }
  window.addEventListener('resize', resize); resize();
  let last = performance.now(), raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!S.visible || document.hidden) { last = now; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!reduced) U.uTime.value += dt;
    const k = reduced ? 1 : 1 - Math.pow(.0018, dt);
    S.x += (S.tx * S.halfW - S.x) * k; S.y += (S.ty * S.halfH - S.y) * k;
    const flat = S.shape === 'road' || S.shape === 'crowd' || S.shape === 'dust' || S.shape === 'torches';
    if (S.shape === 'globe' && here) kitMat.s.size = .26 + .06 * Math.sin(now / 260);
    const sc = flat ? 1 : S.fit * (S.narrow ? .92 : 1); S.scale += (sc - S.scale) * k;
    rig.position.set(S.x, S.y, 0); rig.scale.setScalar(S.scale);
    if (S.shape === 'globe' && S.autoSpin && !S.drag && !reduced) S.tRotY += dt * .12;
    const sway = S.shape === 'globe' || reduced ? 0 : 1;
    S.rotX += (S.tRotX - S.py * .1 * sway - S.rotX) * k; S.rotY += (S.tRotY + S.px * .16 * sway - S.rotY) * k;
    S.rotZ += (S.tRotZ - S.rotZ) * k;
    spin.rotation.set(S.rotX, S.rotY, S.rotZ);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  const api = { setShape, setRank, setColors, place, lookAt, selectPlace, setVisible, bindDrag, placeOnScreen, torchLive: (v) => { S.torchLive = v; }, unlockRank: () => { S.rankLock = false; }, get shape() { return S.shape; }, state: S, onLight: null, counts: () => ({ lit, total: T }) };
  return api;
}
