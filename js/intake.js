/* Snowfield one-call explainer. Animates the static rest frame already in the page:
   01 Answer, 02 Write up, 03 Alert and follow up, inside one crystal chamber. Loaded by site.js only
   when the figure nears the screen. Every motion ends on the shipped rest frame; reduced motion keeps it still. */
(function () {
  const fig = document.getElementById('intake');
  if (!fig || fig.classList.contains('ixjs')) return;
  const $ = s => fig.querySelector(s), NS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = v => Math.max(0, Math.min(1, v)), seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = t => (t = clamp(t), t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const out = t => 1 - Math.pow(1 - clamp(t), 3);
  const STAGE = [56, 140], WAY = [117, 64];
  const job = $('.ix-job'), jm = job.querySelector('.m'), jx = 188.9, jy = 96.5;
  const pink = $('.ix-pink .cube'), cubes = [...fig.querySelectorAll('.ix-c:not(.ix-pink) .cube')];
  const wall = $('#ix-vwall'), gate = $('#ix-vgate'), glow = $('#ix-vglow'), posts = $('#ix-posts');
  const ring = $('#ix-ring'), next = $('#ix-next'), pulse = $('#ix-pulse'), fill = $('#ix-fill');
  const status = $('#ix-status'), steps = [...fig.querySelectorAll('.ix-steps li')];
  const play = $('[data-act=toggle]'), replay = $('[data-act=replay]');
  const gLen = gate.getTotalLength(), pLen = pulse.getTotalLength();
  gate.style.strokeDasharray = gLen.toFixed(1);
  let jo = null, jt = null; // outline and tile forms, made on first use
  const form = (o, t, m) => {
    if (o > .001 && !jo) { jo = mk('ho'); } if (t > .001 && !jt) { jt = mk('hx'); }
    if (jo) jo.style.opacity = o.toFixed(3); if (jt) jt.style.opacity = t.toFixed(3); jm.style.opacity = m.toFixed(3);
  };
  function mk(cls) { const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#xb-h'); u.setAttribute('class', cls + ' t4'); u.setAttribute('transform', 'scale(.4825)'); job.insertBefore(u, jm); return u; }
  const at = (x, y) => job.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  const turn = c => { if (RM.matches || !c) return; c.classList.remove('turn'); void c.getBoundingClientRect(); c.classList.add('turn'); };
  let shown = -1, said = '';
  const step = i => { if (i === shown) return; shown = i; steps.forEach((li, k) => { li.classList.toggle('on', k === i); li.firstElementChild && li.firstElementChild.tagName === 'BUTTON' ? li.firstElementChild.setAttribute('aria-current', k === i ? 'step' : 'false') : 0; }); };
  const say = s => { if (s !== said) { said = s; status.textContent = s; } };
  let turnedPink = false, turnedAll = false;

  function render(p, rest) {
    fill.style.transform = `scaleX(${(rest ? 1 : p).toFixed(4)})`;
    if (rest || p >= 1) {
      step(2); say('Job sheet in your accounts; urgent calls alert you.');
      if (rest) fig.querySelectorAll('.cube.turn').forEach(c => c.classList.remove('turn'));
      glow.style.opacity = 1; gate.style.strokeDashoffset = 0; gate.style.opacity = 1; posts.style.opacity = 0;
      at(jx, jy); form(0, 0, 1); job.style.opacity = 1; ring.style.opacity = 1; next.style.opacity = ''; pulse.style.opacity = 0;
      return;
    }
    if (p < .34) { // 01 Answer: the call arrives at the open gate; the intake asks its questions
      const u = seg(p, 0, .34); step(0); turnedAll = false;
      if (u < .05) turnedPink = false;
      glow.style.opacity = .65; gate.style.opacity = 0; gate.style.strokeDashoffset = gLen; posts.style.opacity = 1;
      at(STAGE[0] - 32 * (1 - out(seg(u, 0, .3))), STAGE[1]); job.style.opacity = out(seg(u, 0, .25)).toFixed(3);
      form(1, 0, 0); ring.style.opacity = 0; next.style.opacity = 0;
      const w = seg(u, .35, .8); pulse.style.opacity = w > 0 && w < 1 ? Math.min(1, w * 5, (1 - w) * 5).toFixed(3) : 0;
      pulse.style.strokeDasharray = `${(pLen * .4).toFixed(1)} ${(pLen * 2).toFixed(1)}`;
      pulse.style.strokeDashoffset = (pLen * .4 - (pLen * 1.4) * ease(w)).toFixed(1);
      if (u >= .55 && !turnedPink) { turnedPink = true; turn(pink); }
      say(u < .5 ? 'An after-hours call comes in.' : 'Your intake questions get asked.');
    } else if (p < .67) { // 02 Write up: details fill the cell, then it passes the open gate into your accounts
      const u = seg(p, .34, .67); step(1); turnedAll = false; turnedPink = true;
      glow.style.opacity = .65; gate.style.opacity = 0; posts.style.opacity = 1; pulse.style.opacity = 0;
      const a = seg(u, 0, .35), b = seg(u, .3, .6); form(1 - a, a * (1 - b), b);
      const l1 = ease(seg(u, .55, .78)), l2 = ease(seg(u, .78, 1));
      if (u < .78) at(STAGE[0] + (WAY[0] - STAGE[0]) * l1, STAGE[1] + (WAY[1] - STAGE[1]) * l1);
      else at(WAY[0] + (jx - WAY[0]) * l2, WAY[1] + (jy - WAY[1]) * l2);
      job.style.opacity = 1; ring.style.opacity = 0; next.style.opacity = 0;
      say(u < .5 ? 'Address, problem and any photos get written up.' : 'The job sheet lands in your accounts.');
    } else { // 03 Alert and follow up: the gate seals, the new job is ringed, the next call can come
      const u = seg(p, .67, 1); step(2); turnedPink = true;
      at(jx, jy); form(0, 0, 1); job.style.opacity = 1; pulse.style.opacity = 0;
      const c = out(seg(u, 0, .3)); gate.style.opacity = c > .02 ? 1 : 0; gate.style.strokeDashoffset = (gLen * (1 - c)).toFixed(1);
      posts.style.opacity = (1 - out(seg(u, 0, .2))).toFixed(3); glow.style.opacity = (.65 + .35 * c).toFixed(3);
      ring.style.opacity = out(seg(u, .15, .35)).toFixed(3); next.style.opacity = (.55 * out(seg(u, .7, 1))).toFixed(3);
      if (u >= .3 && !turnedAll) { turnedAll = true; cubes.forEach((cu, i) => setTimeout(() => turn(cu), i * 60)); }
      say(u < .5 ? 'Urgent? Your on-call alert goes out.' : 'Job sheet in your accounts; urgent calls alert you.');
    }
  }

  const DUR = 9.5; let raf = 0, playing = false, prog = 1, last = 0, stopAt = 1, seen = false, io = null;
  const sync = () => { play.setAttribute('aria-pressed', String(playing)); play.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation'); };
  const stop = () => { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; sync(); };
  function tick(ts) {
    if (!playing) return;
    prog += Math.min(.05, (ts - last) / 1000 || .016) / DUR; last = ts;
    if (prog >= stopAt) { prog = stopAt; render(prog, false); stop(); return; }
    render(prog, false); raf = requestAnimationFrame(tick);
  }
  function from(a, b = 1) {
    if (RM.matches) { render(b, b === 1); return; }
    prog = a; stopAt = b; playing = true; last = performance.now(); sync(); render(prog, false);
    if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  const quiet = () => { seen = true; if (io) { io.disconnect(); io = null; } };
  const RANGES = [[0, .335], [.34, .669], [.67, 1]], STILL = [.3, .669, 1];
  steps.forEach((li, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ix-sbtn'; b.append(...li.childNodes); li.append(b);
    b.addEventListener('click', () => { quiet(); if (RM.matches) { stop(); render(STILL[i], i === 2); } else from(RANGES[i][0], RANGES[i][1]); });
  });
  play.addEventListener('click', () => {
    quiet();
    if (playing) stop();
    else if (prog >= stopAt - .01) from(prog >= .99 ? 0 : prog, 1);
    else { playing = true; last = performance.now(); sync(); raf = requestAnimationFrame(tick); }
  });
  replay.addEventListener('click', () => { quiet(); from(0, 1); });
  RM.addEventListener('change', () => { if (RM.matches) { stop(); render(1, true); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
  fig.classList.add('ixjs'); steps.forEach(li => li.firstElementChild.setAttribute('aria-current', li.classList.contains('on') ? 'step' : 'false')); sync();
  if ('IntersectionObserver' in window && !RM.matches) {
    io = new IntersectionObserver(es => { if (!seen && es.some(e => e.isIntersecting)) { quiet(); from(0, 1); } }, { threshold: .55 });
    io.observe(fig.querySelector('.ix-svg'));
  }
  window.__sfIntakeSeek = t => { quiet(); stop(); if (t === 'rest') render(1, true); else render(Number(t), false); };
})();
