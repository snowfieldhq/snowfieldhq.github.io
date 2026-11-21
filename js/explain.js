// Snowfield explainer pictures. Cells from js/sf-cells.js: the shipped R1301 cell on the
// shipped lattice. Motion: GSAP 3.12.5 from cdnjs, fetched only when a picture nears the screen.
// Each picture is drawn at its rest frame first; reduced motion keeps that frame.
(() => {
  'use strict';
  if (typeof SF === 'undefined') return;
  const D = document, el = SF.el;
  const RM = matchMedia('(prefers-reduced-motion: reduce)'), WIDE = matchMedia('(min-width: 1040px)'), ROW = matchMedia('(min-width: 900px)');
  const css = D.createElement('style'); css.textContent = SF.css(); D.head.append(css);
  const lat = k => (q, r, cx, cy) => [cx + SF.DX * k * (q + r / 2), cy + SF.DY * k * r];
  const hexArea = n => { const o = []; for (let r = -n; r <= n; r++) for (let q = -n; q <= n; q++) if (Math.abs(q + r) <= n) o.push([q, r]); return o; };
  const hexPts = (cx, cy, R) => [0, 1, 2, 3, 4, 5].map(i => { const a = Math.PI / 180 * (60 * i - 90); return (cx + R * Math.cos(a)).toFixed(1) + ',' + (cy + R * Math.sin(a)).toFixed(1); }).join(' ');
  const tone = r => 4 + r; // lighter at the top, deeper toward the bottom, as in the hero field
  const dist = s => Math.hypot(s.q + s.r / 2, s.r * .866);

  function canvas(fig, w, h, cls = '') {
    const svg = el('svg', { viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true', focusable: 'false', class: cls });
    SF.defs(svg); fig.querySelector('.ex-art').replaceChildren(svg); return svg;
  }
  function label(svg, x, y, lines, cls = 'ex-l', anchor = 'middle') {
    const t = el('text', { x, y, class: cls, 'text-anchor': anchor });
    [].concat(lines).forEach((s, i) => { const sp = el('tspan', { x, dy: i ? '1.52em' : 0 }); sp.textContent = s; t.append(sp); });
    svg.append(t); return t;
  }
  // a fixed lattice seat holding one moving group with all three cell forms
  function slot(parent, x, y, tn, k) {
    const at = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }), g = el('g');
    const o = SF.cell(g, 0, 0, k, tn, 'outline'), t = SF.cell(g, 0, 0, k, tn, 'tile'), m = SF.cell(g, 0, 0, k, tn, 'mark');
    at.append(g); parent.append(at); return { at, g, o, t, m, x, y, cube: m.querySelector('.cube') };
  }
  const form = (s, f) => { s.o.style.opacity = +(f === 'outline'); s.t.style.opacity = +(f === 'tile'); s.m.style.opacity = +(f === 'mark'); };
  const setForm = (t, s, f, at) => t.set(s.o, { opacity: +(f === 'outline') }, at).set(s.t, { opacity: +(f === 'tile') }, at).set(s.m, { opacity: +(f === 'mark') }, at);
  const morph = (t, s, from, to, at, d = .3) => t.to(s[from], { opacity: 0, duration: d }, at).to(s[to], { opacity: 1, duration: d }, at);
  const ring = (svg, x, y, R, cls = 'ex-ring') => { const p = el('polygon', { points: hexPts(x, y, R), class: cls }); svg.append(p); return p; };
  const dot = svg => { const g = el('g', { class: 'ex-dot' }); g.append(el('circle', { r: 14, class: 'ex-halo' }), el('circle', { r: 7, class: 'ex-core' })); svg.append(g); return g; };
  const turn = c => { if (!c) return; c.classList.remove('turn'); void c.getBoundingClientRect(); c.classList.add('turn'); };
  const pink = (svg, k) => { const g = el('g'); SF.cell(g, 0, 0, k, 'p', 'mark'); svg.append(g); return g; };
  const place = (g, x, y) => { if (window.gsap) gsap.set(g, { x, y }); else g.setAttribute('transform', `translate(${x} ${y})`); };

  /* 1. Knowledge layer: before (scattered) and after (one reference layer that answers or hands off) */
  function knowledge(fig, wide) {
    const k = wide ? .75 : .65, ax = lat(k), kb = wide ? .44 : .4;
    const L = wide
      ? { w: 1220, h: 500, c: [700, 212], n: 2, q: [425, 212], qLab: [425, 180], out: [[985, 126], [985, 314]], outLab: 'side',
          before: [[62, 62], [168, 42], [276, 80], [108, 150], [218, 170], [56, 250], [168, 260], [286, 238], [104, 344], [218, 350], [304, 326]],
          beforeLab: [180, 428], afterLab: [700, 428], hit: [1, -1], p1: [[-2, 0], [-1, 0], [0, -1], [1, -1], [2, -1]], p2: [[-2, 1], [-1, 1], [0, 1], [1, 1], [2, 0]] }
      : { w: 360, h: 616, c: [194, 372], n: 1, q: [42, 372], qLab: [42, 342], out: [[304, 514], [56, 514]], outLab: 'below',
          before: [[44, 104], [122, 92], [202, 110], [284, 96], [82, 168], [164, 176], [246, 164], [318, 156]],
          beforeLab: [180, 22], afterLab: [180, 240], hit: [1, 0], p1: [[-1, 0], [0, 0], [1, 0]], p2: [[-1, 0], [-1, 1]] };
    const svg = canvas(fig, L.w, L.h, wide ? 'ex-w' : '');
    const before = el('g', { class: 'ex-before' });
    L.before.forEach(([x, y], i) => SF.cell(before, x, y, kb, 4 + i % 4, 'outline'));
    svg.append(before);
    // the two routes, drawn under the cells so only the stretches outside the layer show
    const route = pts => pts.map(([q, r]) => ax(q, r, ...L.c));
    const trail = pts => { const p = el('polyline', { points: pts.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' '), class: 'ex-trail' }); svg.append(p); return p; };
    const stop = (from, to, gap = 27) => { const dx = to[0] - from[0], dy = to[1] - from[1], d = Math.hypot(dx, dy); return [to[0] - dx / d * gap, to[1] - dy / d * gap]; };
    const r1 = route(L.p1), r2 = route(L.p2);
    const tr1 = trail([L.q, ...r1, stop(r1[r1.length - 1], L.out[0])]), tr2 = trail([L.q, ...r2, stop(r2[r2.length - 1], L.out[1])]);
    const bLab = label(svg, ...L.beforeLab, ['Before: scattered playbooks,', 'escalation rules and source data']);
    const cells = hexArea(L.n).map(([q, r]) => { const [x, y] = ax(q, r, ...L.c); return Object.assign(slot(svg, x, y, tone(r), k), { q, r }); });
    const hit = cells.find(s => s.q === L.hit[0] && s.r === L.hit[1]);
    const hitRing = ring(svg, hit.x, hit.y, 52 * k);
    const aLab = label(svg, ...L.afterLab, 'After: one reference layer', 'ex-l ex-strong');
    const qLab = label(svg, ...L.qLab, 'Question');
    const qDot = el('circle', { cx: L.q[0], cy: L.q[1], r: 6, class: 'ex-qdot' }); svg.append(qDot);
    // outcomes: a filled tile for an answer with its source, a dashed outline for a hand-off
    const oa = el('g', { transform: `translate(${L.out[0][0]} ${L.out[0][1]})` }); SF.cell(oa, 0, 0, .42, 3, 'tile'); svg.append(oa);
    const ob = el('g'); ob.append(el('polygon', { points: hexPts(...L.out[1], 23), class: 'ex-ring ex-flag ex-out' })); svg.append(ob);
    const side = L.outLab === 'side';
    const la = side ? label(svg, L.out[0][0] + 38, L.out[0][1] - 6, ['Answer, with', 'its source'], 'ex-l', 'start') : label(svg, 352, L.out[0][1] + 52, ['Answer, with', 'its source'], 'ex-l', 'end');
    const lb = side ? label(svg, L.out[1][0] + 38, L.out[1][1] - 6, ['Not in the rules:', 'sent to a person'], 'ex-l', 'start') : label(svg, 8, L.out[1][1] + 52, ['Not in the rules:', 'sent to a person'], 'ex-l', 'start');
    const d1 = dot(svg), d2 = dot(svg);
    const shown = [hitRing, aLab, qLab, qDot, oa, ob, la, lb, tr1, tr2];
    const rest = () => {
      if (window.gsap) gsap.set([...cells.flatMap(s => [s.g, s.o, s.t, s.m]), ...shown, d1, d2, before, bLab], { clearProps: 'all' });
      cells.forEach(s => form(s, 'mark'));
    };
    rest();
    const tl = () => {
      const t = gsap.timeline({ paused: true });
      t.set(shown, { opacity: 0 }, 0).set(before, { opacity: 1 }, 0);
      cells.forEach((s, i) => { const [bx, by] = L.before[i % L.before.length]; setForm(t, s, 'outline', 0); t.set(s.g, { x: bx - s.x, y: by - s.y, scale: kb / k, opacity: 0, transformOrigin: '50% 50%' }, 0); });
      t.to(cells.map(s => s.g), { opacity: 1, duration: .3, stagger: { each: .03, from: 'random' } }, .3);
      t.to(cells.map(s => s.g), { x: 0, y: 0, scale: 1, duration: 1.2, ease: 'power2.inOut', stagger: { each: .04, from: 'random' } }, .6);
      const ord = cells.slice().sort((a, b) => dist(a) - dist(b));
      ord.forEach((s, i) => { morph(t, s, 'o', 't', 2.6 + i * .03); morph(t, s, 't', 'm', 3.2 + i * .03); });
      t.to(aLab, { opacity: 1, duration: .4 }, 3.5);
      // a question the layer covers: it finds its source and leaves as an answer
      const a1 = 4.3, p1 = r1.map(([x, y]) => ({ x, y })), p2 = r2.map(([x, y]) => ({ x, y }));
      t.to([qLab, qDot], { opacity: 1, duration: .3 }, a1 - .3).set(d1, { x: L.q[0], y: L.q[1], opacity: 1 }, a1);
      p1.forEach((p, i) => t.to(d1, { x: p.x, y: p.y, duration: .32, ease: 'none' }, a1 + .1 + i * .32));
      const hT = a1 + .1 + p1.length * .32;
      t.to(hitRing, { opacity: 1, duration: .25 }, hT).call(() => turn(hit.cube), null, hT);
      t.to(d1, { x: L.out[0][0], y: L.out[0][1], duration: .7, ease: 'power1.inOut' }, hT + .5).to(d1, { opacity: 0, duration: .2 }, hT + 1.2).to([oa, la, tr1], { opacity: 1, duration: .35 }, hT + 1.1);
      // a question outside the rules: nothing matches, so it goes to a person
      const a2 = hT + 1.5;
      t.set(d2, { x: L.q[0], y: L.q[1], opacity: 1 }, a2);
      p2.forEach((p, i) => t.to(d2, { x: p.x, y: p.y, duration: .3, ease: 'none' }, a2 + .1 + i * .3));
      const mT = a2 + .1 + p2.length * .3;
      t.to(d2, { x: L.out[1][0], y: L.out[1][1], duration: .6, ease: 'power1.inOut' }, mT).to(d2, { opacity: 0, duration: .2 }, mT + .6).to([ob, lb, tr2], { opacity: 1, duration: .35 }, mT + .5);
      return t;
    };
    return { tl, rest };
  }

  /* 2. The engagement: audit, build inside your accounts, your team runs it, Snowfield steps out */
  const strip = D.querySelector('#process .process-strip'), steps = strip ? [...strip.children] : [];
  const step = i => { if (!strip) return; strip.classList.toggle('live', i >= 0); steps.forEach((l, j) => l.classList.toggle('on', j === i)); };

  // Three panels: the field mapped (outlines, conflicts ringed), built inside your accounts (tiles in a frame),
  // run by your team (full cells, cubes turning) with Snowfield outside. Side by side from 900 px; stacked below.
  const ENG = {
    row: { w: 1020, h: 400, cls: 'ex-w', P: [{ c: [162, 168], k: .75 }, { c: [484, 168], k: .75, R: 150 }, { c: [798, 168], k: .75, R: 150 }],
      lab: [[162, 376, 'Gaps and conflicts mapped'], [484, 376, 'Your accounts'], [774, 376, 'Your team runs it']], pk: .75, pinkAt: [942, 294], exit: [[962, 64], [964, 215]], pLab: [942, 376, 'middle'], start: [36, 42] },
    stack: { w: 360, h: 660, cls: '', P: [{ c: [90, 106], k: .42 }, { c: [270, 106], k: .42, R: 88 }, { c: [180, 426], k: .65, R: 150 }],
      lab: [[90, 224, ['Gaps and conflicts', 'mapped']], [270, 224, 'Your accounts'], [160, 632, 'Your team runs it']], pk: .65, pinkAt: [312, 562], exit: [[316, 304]], pLab: [312, 632, 'middle'], start: [28, 34] }
  };
  function engagement(fig, L) {
    const svg = canvas(fig, L.w, L.h, L.cls), gaps = ['1,-1'], conf = ['-1,0', '1,0'];
    const frames = L.P.map(p => { if (!p.R) return null; const f = el('polygon', { points: hexPts(...p.c, p.R), class: 'ex-bound' }); svg.append(f); return f; });
    const P = L.P.map(p => { const ax = lat(p.k); return hexArea(1).map(([q, r]) => { const [x, y] = ax(q, r, ...p.c); return Object.assign(slot(svg, x, y, tone(r), p.k), { q, r, key: q + ',' + r }); }); });
    const confCells = P[0].filter(s => conf.includes(s.key)), flags = confCells.map(s => ring(svg, s.x, s.y, 50.5 * L.P[0].k, 'ex-ring ex-flag'));
    const labs = L.lab.map(([x, y, t]) => label(svg, x, y, t, 'ex-l ex-strong'));
    const pg = pink(svg, L.pk), pm = pg.firstChild, pLab = label(svg, L.pLab[0], L.pLab[1], 'Snowfield', 'ex-l ex-strong', L.pLab[2]);
    // where the first panels use smaller cells, Snowfield travels there as a flat pink tile of their size and becomes a full cell
    // at full size in the last panel, so no full cell ever drops below its minimum size
    const small = L.P[0].k < L.pk, pt = small ? SF.cell(pg, 0, 0, L.P[0].k, 3, 'tile') : null;
    if (pt) { pt.querySelector('use').style.fill = SF.PINK[1]; pt.style.opacity = 0; }
    const open = i => P[i].find(s => s.key === gaps[0]);
    const rest = () => {
      if (window.gsap) gsap.set([...P.flat().flatMap(s => [s.g, s.o, s.t, s.m]), ...frames.filter(Boolean), ...labs, pLab, ...flags, pg, pm, ...(pt ? [pt] : [])], { clearProps: 'all' });
      if (pt) pt.style.opacity = 0;
      P[0].forEach(s => { form(s, 'outline'); s.g.style.opacity = gaps.includes(s.key) ? 0 : 1; });
      P[1].forEach(s => form(s, 'tile')); P[2].forEach(s => form(s, 'mark'));
      place(pg, ...L.pinkAt); step(-1);
    };
    rest();
    const tl = () => {
      const t = gsap.timeline({ paused: true, onComplete: () => step(-1) });
      const bounds = frames.filter(Boolean), lens = L.P.filter(p => p.R).map(p => 6 * p.R + 2);
      t.set([...labs, pLab, ...flags, ...P[1].map(s => s.g), ...P[2].map(s => s.g)], { opacity: 0 }, 0)
        .set(pg, { x: L.start[0], y: L.start[1], opacity: 0 }, 0)
        .to(pg, { opacity: 1, duration: .25 }, .05);
      if (pt) t.set(pt, { opacity: 1 }, 0).set(pm, { opacity: 0 }, 0);
      bounds.forEach((f, i) => t.set(f, { attr: { 'stroke-dasharray': lens[i], 'stroke-dashoffset': lens[i] } }, 0));
      P[0].forEach(s => { setForm(t, s, 'outline', 0); t.set(s.g, { opacity: gaps.includes(s.key) ? 0 : .35 }, 0); });
      P[1].forEach(s => setForm(t, s, 'outline', 0)); P[2].forEach(s => setForm(t, s, 'tile', 0));
      // 1. audit: Snowfield walks the field; each cell it reads comes into focus; conflicts are ringed
      t.call(() => step(0), null, .05);
      const walk = P[0].filter(s => !gaps.includes(s.key)).sort((a, b) => a.r - b.r || (a.r % 2 ? b.q - a.q : a.q - b.q)), per = 2.2 / walk.length;
      walk.forEach((s, i) => { const at = .3 + i * per; t.to(pg, { x: s.x, y: s.y, duration: per, ease: 'sine.inOut' }, at).to(s.g, { opacity: 1, duration: .2 }, at + per * .7); if (conf.includes(s.key)) t.to(flags[confCells.indexOf(s)], { opacity: 1, duration: .25 }, at + per); });
      const b = .3 + walk.length * per + .3;
      t.to(labs[0], { opacity: 1, duration: .4 }, b - .3);
      // 2. build: Snowfield works from the open slot inside your accounts while the frame closes and the cells set
      t.call(() => step(1), null, b);
      t.to(pg, { x: open(1).x, y: open(1).y, duration: .8, ease: 'power2.inOut' }, b);
      t.to(bounds[0], { attr: { 'stroke-dashoffset': 0 }, duration: 1, ease: 'power1.inOut' }, b + .2).to(labs[1], { opacity: 1, duration: .4 }, b + .7);
      P[1].filter(s => s !== open(1)).sort((a, c) => dist(a) - dist(c)).forEach((s, i) => { t.to(s.g, { opacity: 1, duration: .25 }, b + .5 + i * .05); morph(t, s, 'o', 't', b + 1.1 + i * .05); });
      setForm(t, open(1), 'tile', b);
      // 3. your team runs it: cells go live and turn, Snowfield steps outside and its slot fills
      const o = b + 2.2;
      t.call(() => step(2), null, o);
      if (pt) t.to(pt, { opacity: 0, duration: .3 }, o + .5).to(pm, { opacity: 1, duration: .3 }, o + .5);
      // stacked: pass through the gutter between the two labels so Snowfield never crosses "Your accounts"
      if (small) t.to(pg, { keyframes: [{ x: 185, y: 224, duration: .4, ease: 'power1.in' }, { x: open(2).x, y: open(2).y, duration: .4, ease: 'power1.out' }] }, o);
      else t.to(pg, { x: open(2).x, y: open(2).y, duration: .8, ease: 'power2.inOut' }, o);
      t.to(open(1).g, { opacity: 1, duration: .3 }, o + .5);
      t.to(bounds[1], { attr: { 'stroke-dashoffset': 0 }, duration: 1, ease: 'power1.inOut' }, o + .2);
      P[2].filter(s => s !== open(2)).sort((a, c) => dist(a) - dist(c)).forEach((s, i) => { t.to(s.g, { opacity: 1, duration: .25 }, o + .5 + i * .05); morph(t, s, 't', 'm', o + 1.1 + i * .05); t.call(() => turn(s.cube), null, o + 1.5 + i * .08); });
      t.to(labs[2], { opacity: 1, duration: .4 }, o + 1.6);
      // leave over the top-right edge, outside the cells, then down to the rest spot, so it never crosses a neighbour
      t.to(pg, { keyframes: [...L.exit.map(([x, y], i) => ({ x, y, duration: i ? .25 : .45, ease: i ? 'none' : 'power1.in' })), { x: L.pinkAt[0], y: L.pinkAt[1], duration: .5, ease: 'power1.out' }] }, o + 2.1).to(pLab, { opacity: 1, duration: .4 }, o + 2.9);
      setForm(t, open(2), 'mark', o); t.to(open(2).g, { opacity: 1, duration: .4 }, o + 2.6).call(() => turn(open(2).cube), null, o + 2.8);
      t.to({}, { duration: .6 });
      return t;
    };
    return { tl, rest };
  }

  /* runner: draw the rest frame, fetch GSAP near the screen, play once in view; Pause and Replay */
  let gsapP = null;
  const loadG = () => gsapP || (gsapP = new Promise((ok, no) => { if (window.gsap) return ok(); const s = D.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'; s.crossOrigin = 'anonymous'; s.onload = ok; s.onerror = () => { gsapP = null; no(); }; D.head.append(s); }));
  const SCENES = { knowledge: f => knowledge(f, WIDE.matches), engagement: f => engagement(f, ROW.matches ? ENG.row : ENG.stack) };
  D.querySelectorAll('figure.explain').forEach(fig => {
    const btn = fig.querySelector('.ex-btn'); let sc, t = null, seen = false, armed = false, layout = '';
    const setBtn = s => { if (btn) btn.textContent = s; };
    const fresh = () => { if (t) t.kill(); t = sc.tl(); const c = t.eventCallback('onComplete'); t.eventCallback('onComplete', () => { if (c) c(); setBtn('Replay'); }); };
    const key = () => WIDE.matches + ',' + ROW.matches;
    const build = () => { if (t) t.kill(); t = null; armed = false; layout = key(); sc = SCENES[fig.dataset.scene](fig); setBtn('Replay'); };
    // before the picture scrolls into view, show the opening frame so play starts without a jump
    const arm = () => { if (armed || seen || RM.matches || !window.gsap) return; armed = true; fresh(); t.seek(0.01, false); };
    const play = () => loadG().then(() => { if (RM.matches) return; if (!armed) fresh(); armed = false; setBtn('Pause'); t.play(0); })
      .catch(() => { sc.rest(); setBtn('Replay'); });
    build();
    if (btn) btn.addEventListener('click', () => {
      if (!t || t.progress() === 1) return play();
      if (t.paused()) { t.play(); setBtn('Pause'); } else { t.pause(); setBtn('Play'); }
    });
    // a real layout change shows the new rest frame (Replay plays it); change events that leave the layout as it was are ignored
    [WIDE, ROW].forEach(m => m.addEventListener('change', () => { if (key() !== layout) build(); }));
    RM.addEventListener('change', () => { if (RM.matches) { if (t) t.kill(); t = null; sc.rest(); } setBtn('Replay'); });
    if (!('IntersectionObserver' in window)) return;
    const near = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && !RM.matches) { near.disconnect(); loadG().then(arm).catch(() => {}); } }, { rootMargin: '1500px 0px' });
    near.observe(fig);
    const io = new IntersectionObserver(es => { if (!seen && es.some(e => e.isIntersecting)) { seen = true; io.disconnect(); if (!RM.matches) play(); } }, { threshold: .5 });
    io.observe(fig.querySelector('.ex-art'));
  });
})();
