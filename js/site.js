/* Snowfield public site: surface switch, Snow pause, and the reader's honeycomb + hex snow (shared masters hexfield.js + snowfall.js).
   The page is complete before this runs; weather loads after first paint, idles off-screen and in hidden tabs, and stops for reduced motion. */
(function () {
  const R = document.documentElement, $ = s => document.querySelector(s);
  R.classList.add('js');
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  const NAMES = { dark: 'Obsidian', paper: 'Paper', light: 'Light' }, ORDER = ['dark', 'paper', 'light'];
  const surf = $('#surface'), snowBtn = $('#snow'), meta = document.querySelector('meta[name=theme-color]');
  const label = () => { const n = NAMES[R.dataset.theme] || 'Obsidian'; surf.querySelector('.lbl').textContent = n; surf.setAttribute('aria-label', 'Page surface: ' + n); meta.content = getComputedStyle(R).getPropertyValue('--bg').trim(); };
  label();
  surf.addEventListener('click', () => { R.dataset.theme = ORDER[(ORDER.indexOf(R.dataset.theme) + 1) % 3]; store('sf-surface', R.dataset.theme); label(); fit(); });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let on = store('sf-snow') !== 'off';
  const syncBtn = () => { snowBtn.setAttribute('aria-pressed', String(on && !reduce.matches)); snowBtn.disabled = reduce.matches; snowBtn.title = reduce.matches ? 'Snow is off because your device asks for reduced motion' : (on ? 'Pause snow' : 'Play snow'); };
  syncBtn();
  snowBtn.addEventListener('click', () => { on = !on; store('sf-snow', on ? 'on' : 'off'); syncBtn(); if (snow) { if (!on) { snow.clearFlash(); snow.wipe(); } } run(); });

  const canvas = $('#sky'), comb = $('#comb'), col = $('main');
  let snow = null, stops = null, raf = 0, clock = 0, last = 0, gap = 28, cost = 0;
  const tok = n => getComputedStyle(R).getPropertyValue(n).trim();
  const dark = () => R.dataset.theme === 'dark';
  function fit() {
    if (!snow) return;
    const W = innerWidth, H = Math.max(80, innerHeight - 44), band = Math.round(comb.getBoundingClientRect().width);
    const box = col.getBoundingClientRect(), slim = band < 54;
    comb.classList.toggle('slim', slim);
    const Rhex = slim ? Math.max(8, Math.min(15.5, (band - 2) / Math.sqrt(3))) : Math.max(21, Math.min(27.84, band / 4.8));
    stops = SnowfieldHex.band(comb, { width: band, height: H, R: Rhex, edge: slim ? 1 : 2, slim });
    snow.set({ color: dark() ? '220,235,247' : '82,114,140', stormColor: dark() ? '162,222,255' : '31,102,146', clear: [Math.max(0, box.left - 6), Math.min(W - band, box.right + 2)], dim: dark() ? .19 : .14, lane: [W - band, W], bandLeft: W - band, graph: stops && stops.graph || null });
    snow.size(W, H, devicePixelRatio);
    paint();
    if (reduce.matches || !on) snow.wipe(); else snow.draw();
  }
  function paint() { if (!stops) return; const max = document.documentElement.scrollHeight - innerHeight; SnowfieldHex.paintGradient(stops, max > 0 ? scrollY / max : 0, dark() ? 'dark' : 'light'); }
  function tick(now) {
    raf = 0; if (last) cost = cost * .9 + Math.min(200, now - last) * .1; last = 0;
    if (now - clock < gap) { raf = requestAnimationFrame(tick); return; }
    const dt = Math.min(.07, Math.max(0, (now - clock) / 1000)); clock = now;
    snow.step(dt); snow.draw(); last = now;
    gap = cost > 30 ? 55 : cost < 20 ? 28 : gap; // slower phones draw at ~18 fps; motion is time-based so drift is unchanged
    if (live()) raf = requestAnimationFrame(tick);
  }
  const live = () => snow && on && !reduce.matches && !document.hidden;
  function run() { if (raf && !live()) { cancelAnimationFrame(raf); raf = 0; } if (!raf && live()) { clock = performance.now(); last = 0; raf = requestAnimationFrame(tick); } }

  let scrollQueued = false;
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { scrollQueued = false; paint(); }); } }, { passive: true });
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fit, 150); });
  document.addEventListener('visibilitychange', run);
  reduce.addEventListener('change', () => { syncBtn(); fit(); run(); });

  const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.append(s); });
  function start() {
    Promise.all([load('js/hexfield.min.js'), load('js/snowfall.min.js')]).then(() => {
      snow = SnowfieldSnow(canvas, { color: '220,235,247', seed: 7 });
      fit(); run();
      fetch('js/r1301.json').then(r => r.ok ? r.json() : null).then(g => { if (g && snow) snow.set({ r1301: g }); }).catch(() => {});
    }).catch(() => {});
  }
  const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
  if (document.readyState === 'complete') idle(start, { timeout: 1200 }); else addEventListener('load', () => idle(start, { timeout: 1200 }));
})();
