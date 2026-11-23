// Snowfield SOTA Interactive Architectural Stages
// Uses shipped R1301 cell geometry (js/sf-cells.js) on the exact Snowfield lattice.
// Zero dotted lines covering boxes/cells: optical waveguides live strictly in dedicated corridors.
// Self-contained zero-CDN animation engine with deterministic seek hook for verification.
(() => {
  'use strict';
  if (typeof SF === 'undefined') return;

  const D = document;
  const el = SF.el;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const styleEl = D.createElement('style');
  styleEl.textContent = SF.css();
  D.head.append(styleEl);

  const easeOut = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const easeInOut = t => {
    const x = Math.max(0, Math.min(1, t));
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const lat = k => (q, r, cx, cy) => [cx + SF.DX * k * (q + r / 2), cy + SF.DY * k * r];
  const hexArea = n => {
    const out = [];
    for (let r = -n; r <= n; r++) {
      for (let q = -n; q <= n; q++) {
        if (Math.abs(q + r) <= n) out.push([q, r]);
      }
    }
    return out;
  };
  const hexPts = (cx, cy, R) =>
    [0, 1, 2, 3, 4, 5]
      .map(i => {
        const a = (Math.PI / 180) * (60 * i - 90);
        return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
      })
      .join(' ');
  const tone = r => Math.max(1, Math.min(8, 4 + r));
  const cellDist = s => Math.hypot(s.q + s.r / 2, s.r * 0.866);

  function createSlot(parent, x, y, tn, k) {
    const at = el('g', { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`, class: 'sf-cell-slot' });
    const inner = el('g');
    const o = SF.cell(inner, 0, 0, k, tn, 'outline');
    const t = SF.cell(inner, 0, 0, k, tn, 'tile');
    const m = SF.cell(inner, 0, 0, k, tn, 'mark');
    at.append(inner);
    parent.append(at);
    return { at, inner, o, t, m, x, y, cube: m.querySelector('.cube') };
  }

  function setFormBlend(slot, oOp, tOp, mOp) {
    slot.o.style.opacity = oOp.toFixed(3);
    slot.t.style.opacity = tOp.toFixed(3);
    slot.m.style.opacity = mOp.toFixed(3);
  }

  function animatePulse(pathEl, progress, active) {
    if (!pathEl) return;
    if (!active || progress <= 0 || progress >= 1) {
      pathEl.style.opacity = '0';
      return;
    }
    const len = pathEl.getTotalLength ? pathEl.getTotalLength() : 64;
    const segLen = Math.max(18, len * 0.36);
    const offset = len * (1 - easeInOut(progress)) - segLen * 0.3;
    const fade = Math.min(1, progress * 5, (1 - progress) * 5);
    pathEl.style.strokeDasharray = `${segLen.toFixed(1)} ${(len * 2).toFixed(1)}`;
    pathEl.style.strokeDashoffset = `${offset.toFixed(1)}`;
    pathEl.style.opacity = (0.95 * fade).toFixed(3);
  }

  const controllers = {};

  /* ========================================================================
     SCENE 1: Knowledge Layer — Normalize Signal -> Cited Answer -> Escalation
     ======================================================================== */
  function initKnowledge(fig) {
    const svgBox = fig.querySelector('.kn-svg-box');
    if (!svgBox) return;

    const W = 440, H = 330, CX = 220, CY = 165, K = 0.60;
    const ax = lat(K);
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', focusable: 'false' });
    SF.defs(svg);
    svgBox.replaceChildren(svg);

    const gridGroup = el('g');
    svg.append(gridGroup);

    // Radial outward scatter strictly guaranteeing zero hex-over-hex overlap at t=0
    const cells = hexArea(2).map(([q, r], idx) => {
      const [x, y] = ax(q, r, CX, CY);
      const s = createSlot(gridGroup, x, y, tone(r), K);
      const rx = (x - CX) * 0.24;
      const ry = (y - CY) * 0.20;
      return Object.assign(s, { q, r, dx: rx, dy: ry, dist: cellDist({ q, r }), idx });
    });

    const hitCell = cells.find(c => c.q === 1 && c.r === -1) || cells[0];
    // Single signature Snowfield pink R1301 focal cell layer on the matched rule node
    const hitPink = SF.cell(hitCell.inner, 0, 0, K, 'p', 'mark');
    hitPink.style.opacity = '0';
    hitCell.pinkCube = hitPink.querySelector('.cube');
    // Precision ring seated strictly in the 3.4641-unit lattice gutter (non-colour cue for pink cell)
    const hitRing = el('polygon', {
      points: hexPts(hitCell.x, hitCell.y, 56 * K),
      class: 'sf-gutter-ring'
    });
    svg.append(hitRing);

    // DOM references inside the architectural stage
    const tabs = [...fig.querySelectorAll('.ex-tab')];
    const playBtn = fig.querySelector('[data-action="toggle"]');
    const replayBtn = fig.querySelector('[data-action="replay"]');
    const inputPanel = fig.querySelector('[data-kn-input]');
    const inputViews = [...fig.querySelectorAll('.kn-input-view')];
    const chamber = fig.querySelector('.kn-chamber');
    const statusText = fig.querySelector('[data-kn-status]');
    const statusTag = fig.querySelector('[data-kn-tag]');
    const cardAnswer = fig.querySelector('[data-kn-out="answer"]');
    const cardEscalate = fig.querySelector('[data-kn-out="escalate"]');

    // Waveguide tracks, ports, and pulse overlays (both desktop H and mobile V)
    const trIn = [...fig.querySelectorAll('[data-wg="in-track"]')];
    const ptIn = [...fig.querySelectorAll('[data-wg="in-port"]')];
    const plIn = [...fig.querySelectorAll('[data-wg="in-pulse"]')];
    const trAns = [...fig.querySelectorAll('[data-wg="ans-track"]')];
    const ptAns = [...fig.querySelectorAll('[data-wg="ans-port"]')];
    const plAns = [...fig.querySelectorAll('[data-wg="ans-pulse"]')];
    const trEsc = [...fig.querySelectorAll('[data-wg="esc-track"]')];
    const ptEsc = [...fig.querySelectorAll('[data-wg="esc-port"]')];
    const plEsc = [...fig.querySelectorAll('[data-wg="esc-pulse"]')];

    let cubeTurnedForPass = false;
    const DURATION = 10.5; // seconds for complete 3-stage cycle

    function setActiveTab(stepIdx) {
      tabs.forEach((t, i) => t.setAttribute('aria-selected', String(i === stepIdx)));
      inputViews.forEach((v, i) => { v.hidden = i !== stepIdx; });
    }

    function setClasses(list, cls, on) {
      list.forEach(node => node.classList.toggle(cls, on));
    }

    function renderAt(tNorm, isStaticRest) {
      const p = clamp01(tNorm);

      if (isStaticRest) {
        // Static rest frame: tells the entire story at a glance with one pink focal Snowfield cell
        setActiveTab(1);
        cells.forEach(c => {
          c.inner.setAttribute('transform', 'translate(0 0)');
          c.at.style.opacity = c === hitCell ? '1' : '0.86';
          setFormBlend(c, 0, 0, c === hitCell ? 0 : 1);
        });
        hitPink.style.opacity = '1';
        hitRing.classList.add('on');
        inputPanel.className = 'kn-panel lit';
        chamber.className = 'kn-chamber lit-ice';
        statusText.textContent = '19 approved sections';
        statusTag.textContent = 'Section 4.2';
        cardAnswer.className = 'kn-out-card active-answer';
        cardEscalate.className = 'kn-out-card dim';
        setClasses(trIn, 'active-ice', true);
        setClasses(trIn, 'active-esc', false);
        setClasses(ptIn, 'active-ice', true);
        setClasses(ptIn, 'active-esc', false);
        setClasses(trAns, 'active-ice', true);
        setClasses(ptAns, 'active-ice', true);
        setClasses(trEsc, 'active-esc', false);
        setClasses(ptEsc, 'active-esc', false);
        [...plIn, ...plAns, ...plEsc].forEach(elP => { elP.style.opacity = '0'; });
        return;
      }

      // 3 narrative chapters across [0 .. 1]:
      // Stage 0 [0.00 .. 0.34]: Scattered inputs -> crystallized unified policy lattice
      // Stage 1 [0.34 .. 0.68]: Covered question -> waveguide A->B -> lattice scan -> matched rule -> cited answer
      // Stage 2 [0.68 .. 1.00]: Out-of-policy question -> waveguide A->B -> lattice check -> refusal -> supervisor escalation
      if (p < 0.34) {
        cubeTurnedForPass = false;
        if (hitCell.cube) hitCell.cube.classList.remove('turn');
        if (hitCell.pinkCube) hitCell.pinkCube.classList.remove('turn');
        hitPink.style.opacity = '0';
        const u = seg(p, 0.0, 0.34);
        setActiveTab(0);
        inputPanel.className = 'kn-panel lit';
        chamber.className = 'kn-chamber';
        cardAnswer.className = 'kn-out-card dim';
        cardEscalate.className = 'kn-out-card dim';

        const gather = easeInOut(seg(u, 0.08, 0.56));
        const toMark = easeOut(seg(u, 0.68, 0.94));

        cells.forEach(c => {
          const lag = (c.dist / 2.6) * 0.14;
          const cg = easeInOut(seg(u, 0.06 + lag, 0.52 + lag));
          const tx = c.dx * (1 - cg);
          const ty = c.dy * (1 - cg);
          const sc = 0.78 + 0.22 * cg;
          c.inner.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${sc.toFixed(3)})`);
          c.at.style.opacity = (0.50 + 0.50 * cg).toFixed(3);
          const ct = easeOut(seg(u, 0.46 + lag, 0.68 + lag));
          const cm = easeOut(seg(u, 0.66 + lag, 0.88 + lag));
          setFormBlend(c, 1 - ct, ct * (1 - cm), cm);
        });

        hitRing.classList.remove('on');
        statusText.textContent = toMark > 0.7 ? 'Documents now agree' : 'Comparing your documents...';
        statusTag.textContent = toMark > 0.7 ? '1 policy' : '3 documents';

        setClasses(trIn, 'active-ice', gather > 0.1);
        setClasses(trIn, 'active-esc', false);
        setClasses(ptIn, 'active-ice', gather > 0.1);
        setClasses(ptIn, 'active-esc', false);
        setClasses(trAns, 'active-ice', false);
        setClasses(ptAns, 'active-ice', false);
        setClasses(trEsc, 'active-esc', false);
        setClasses(ptEsc, 'active-esc', false);

        plIn.forEach(node => animatePulse(node, seg(u, 0.12, 0.68), true));
        plAns.forEach(node => animatePulse(node, 0, false));
        plEsc.forEach(node => animatePulse(node, 0, false));
      } else if (p < 0.68) {
        const u = seg(p, 0.34, 0.68);
        setActiveTab(1);
        inputPanel.className = 'kn-panel lit';
        chamber.className = 'kn-chamber lit-ice';

        const inWave = seg(u, 0.02, 0.30);
        const scanWave = seg(u, 0.24, 0.64);
        const matched = u >= 0.52;
        const outWave = seg(u, 0.56, 0.88);
        const answerLit = u >= 0.76;

        cells.forEach(c => {
          c.inner.setAttribute('transform', 'translate(0 0)');
          setFormBlend(c, 0, 0, matched && c === hitCell ? 0 : 1);
          if (matched) {
            c.at.style.opacity = c === hitCell ? '1' : '0.48';
          } else if (scanWave > 0) {
            // Smooth crystallographic sweep from left to right across the lattice
            const normX = (c.x - (CX - 130)) / 260;
            const d = Math.abs(normX - scanWave);
            const boost = Math.max(0, 1 - d * 3.2);
            c.at.style.opacity = (0.58 + 0.42 * boost).toFixed(3);
          } else {
            c.at.style.opacity = '0.88';
          }
        });

        hitPink.style.opacity = matched ? '1' : '0';
        hitRing.classList.toggle('on', matched);
        if (matched && !cubeTurnedForPass && hitCell.pinkCube && !RM.matches) {
          cubeTurnedForPass = true;
          hitCell.pinkCube.classList.remove('turn');
          void hitCell.pinkCube.getBoundingClientRect();
          hitCell.pinkCube.classList.add('turn');
        }

        statusText.textContent = matched
          ? 'Found in Service Policy'
          : 'Looking up the policy...';
        statusTag.textContent = matched ? 'Section 4.2' : '19 sections';

        cardAnswer.className = answerLit ? 'kn-out-card active-answer' : 'kn-out-card dim';
        cardEscalate.className = 'kn-out-card dim';

        setClasses(trIn, 'active-ice', true);
        setClasses(trIn, 'active-esc', false);
        setClasses(ptIn, 'active-ice', true);
        setClasses(ptIn, 'active-esc', false);
        setClasses(trAns, 'active-ice', matched);
        setClasses(ptAns, 'active-ice', matched);
        setClasses(trEsc, 'active-esc', false);
        setClasses(ptEsc, 'active-esc', false);

        plIn.forEach(node => animatePulse(node, inWave, true));
        plAns.forEach(node => animatePulse(node, outWave, matched));
        plEsc.forEach(node => animatePulse(node, 0, false));
      } else {
        cubeTurnedForPass = false;
        if (hitCell.cube) hitCell.cube.classList.remove('turn');
        if (hitCell.pinkCube) hitCell.pinkCube.classList.remove('turn');
        hitPink.style.opacity = '0';
        const u = seg(p, 0.68, 1.0);
        setActiveTab(2);
        inputPanel.className = 'kn-panel lit-esc';
        chamber.className = 'kn-chamber lit-esc';

        const inWave = seg(u, 0.02, 0.30);
        const scanWave = seg(u, 0.24, 0.62);
        const refused = u >= 0.54;
        const outWave = seg(u, 0.56, 0.88);
        const escLit = u >= 0.74;

        cells.forEach(c => {
          c.inner.setAttribute('transform', 'translate(0 0)');
          setFormBlend(c, 0, 0, 1);
          if (refused) {
            c.at.style.opacity = '0.38';
          } else if (scanWave > 0) {
            const normX = (c.x - (CX - 130)) / 260;
            const d = Math.abs(normX - scanWave);
            const boost = Math.max(0, 1 - d * 3.0);
            c.at.style.opacity = (0.48 + 0.44 * boost).toFixed(3);
          } else {
            c.at.style.opacity = '0.82';
          }
        });

        hitRing.classList.remove('on');
        statusText.textContent = refused
          ? 'Not in the policy'
          : 'Looking up the policy...';
        statusTag.textContent = refused ? 'No match' : '19 sections';

        cardAnswer.className = 'kn-out-card dim';
        cardEscalate.className = escLit ? 'kn-out-card active-escalate' : 'kn-out-card dim';

        setClasses(trIn, 'active-ice', false);
        setClasses(trIn, 'active-esc', true);
        setClasses(ptIn, 'active-ice', false);
        setClasses(ptIn, 'active-esc', true);
        setClasses(trAns, 'active-ice', false);
        setClasses(ptAns, 'active-ice', false);
        setClasses(trEsc, 'active-esc', refused);
        setClasses(ptEsc, 'active-esc', refused);

        plIn.forEach(node => animatePulse(node, inWave, true));
        plAns.forEach(node => animatePulse(node, 0, false));
        plEsc.forEach(node => animatePulse(node, outWave, refused));
      }
    }

    // Playback loop
    let rafId = 0;
    let playing = false;
    let progress = 1;
    let lastTs = 0;
    let stopAt = 1;
    let seen = false;

    function updatePlayBtn() {
      if (!playBtn) return;
      playBtn.textContent = playing ? 'Pause' : 'Play';
      playBtn.setAttribute('aria-pressed', String(playing));
    }

    function stop() {
      playing = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      updatePlayBtn();
    }

    function tick(ts) {
      if (!playing) return;
      const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      progress += dt / DURATION;
      if (progress >= stopAt) {
        progress = stopAt;
        renderAt(progress, stopAt >= 0.999 ? false : false);
        stop();
        return;
      }
      renderAt(progress, false);
      rafId = requestAnimationFrame(tick);
    }

    function playFrom(startP, endP = 1) {
      if (RM.matches) {
        renderAt(endP >= 0.99 ? 0.95 : endP, endP === 1);
        return;
      }
      progress = startP;
      stopAt = endP;
      playing = true;
      lastTs = performance.now();
      updatePlayBtn();
      renderAt(progress, false);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    // Initial rest frame immediately on load (no blank frame, CLS 0.00)
    renderAt(1, true);
    updatePlayBtn();

    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => {
        const ranges = [[0.0, 0.33], [0.34, 0.67], [0.68, 0.99]];
        const [a, b] = ranges[idx] || [0, 1];
        if (RM.matches) {
          stop();
          const staticPts = [0.31, 0.65, 0.96];
          renderAt(staticPts[idx], false);
        } else {
          playFrom(a, b);
        }
      });
    });

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (playing) {
          stop();
        } else {
          if (progress >= 0.99 || progress >= stopAt - 0.01) {
            playFrom(0, 1);
          } else {
            playing = true;
            lastTs = performance.now();
            updatePlayBtn();
            rafId = requestAnimationFrame(tick);
          }
        }
      });
    }
    if (replayBtn) {
      replayBtn.addEventListener('click', () => playFrom(0, 1));
    }

    if ('IntersectionObserver' in window && !RM.matches) {
      const io = new IntersectionObserver(entries => {
        if (!seen && entries.some(e => e.isIntersecting)) {
          seen = true;
          io.disconnect();
          playFrom(0, 1);
        }
      }, { threshold: 0.35 });
      io.observe(fig);
    }

    RM.addEventListener('change', () => {
      if (RM.matches) { stop(); renderAt(1, true); }
    });

    controllers.knowledge = {
      seek(t) {
        stop();
        if (t === 'rest') { renderAt(1, true); return; }
        renderAt(Number(t), false);
      }
    };
  }

  /* ========================================================================
     SCENE 2: Engagement — Signal Audit -> Client Accounts -> Team Ownership
     Strictly ONE pink Snowfield R1301 cell visible across all 3 stages.
     ======================================================================== */
  function initEngagement(fig) {
    const chambers = [...fig.querySelectorAll('.eng-chamber')];
    const cards = [...fig.querySelectorAll('.eng-card')];
    const tabs = [...fig.querySelectorAll('.ex-tab')];
    const playBtn = fig.querySelector('[data-action="toggle"]');
    const replayBtn = fig.querySelector('[data-action="replay"]');
    if (chambers.length < 3) return;

    const W = 360, H = 260;

    function makeSvg(container) {
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', focusable: 'false' });
      SF.defs(svg);
      container.replaceChildren(svg);
      return svg;
    }

    function cornerBrackets(parent, x, y, R) {
      const g = el('g', { class: 'sf-conflict-bracket' });
      const b = R * 0.34;
      const top = y - R, bot = y + R, lft = x - R * 0.92, rgt = x + R * 0.92;
      g.append(
        el('path', { d: `M ${(lft + b).toFixed(1)} ${top.toFixed(1)} L ${lft.toFixed(1)} ${top.toFixed(1)} L ${lft.toFixed(1)} ${(top + b).toFixed(1)}` }),
        el('path', { d: `M ${(rgt - b).toFixed(1)} ${bot.toFixed(1)} L ${rgt.toFixed(1)} ${bot.toFixed(1)} L ${rgt.toFixed(1)} ${(bot - b).toFixed(1)}` })
      );
      parent.append(g);
      return g;
    }

    function makePink(svg, k) {
      const g = el('g', { class: 'sf-pink-mover' });
      SF.cell(g, 0, 0, k, 'p', 'mark');
      svg.append(g);
      return g;
    }

    // Panel 1: Audit — 7-cell outline field, gap at (1,-1), subtle brackets around conflict slots
    const svg1 = makeSvg(chambers[0]);
    const k1 = 0.60, ax1 = lat(k1), c1 = [180, 134];
    const p1Cells = hexArea(1).map(([q, r]) => {
      const [x, y] = ax1(q, r, ...c1);
      const s = createSlot(svg1, x, y, tone(r), k1);
      return Object.assign(s, { q, r, key: `${q},${r}` });
    });
    const gapKey = '1,-1';
    const confKeys = ['-1,0', '1,0'];
    const p1Open = p1Cells.find(s => s.key === gapKey);
    const p1Brackets = p1Cells
      .filter(s => confKeys.includes(s.key))
      .map(s => cornerBrackets(svg1, s.x, s.y, 58 * k1));
    // Seated strictly at exact lattice scale k1 inside the empty gap seat (zero cell overlap at any frame)
    const p1Pink = makePink(svg1, k1);

    // Panel 2: Build inside your accounts — clean vault boundary + solidifying ice tiles
    const svg2 = makeSvg(chambers[1]);
    const k2 = 0.56, ax2 = lat(k2), c2 = [180, 142];
    const vault2 = el('polygon', { points: hexPts(c2[0], c2[1], 100), class: 'sf-vault-frame' });
    svg2.append(vault2);
    const lbl2 = el('text', { x: 180, y: 20, class: 'sf-vault-label', 'text-anchor': 'middle' });
    lbl2.textContent = 'YOUR ACCOUNTS';
    svg2.append(lbl2);
    const p2Cells = hexArea(1).map(([q, r]) => {
      const [x, y] = ax2(q, r, ...c2);
      const s = createSlot(svg2, x, y, tone(r), k2);
      return Object.assign(s, { q, r, key: `${q},${r}`, dist: cellDist({ q, r }) });
    });
    const p2Open = p2Cells.find(s => s.key === gapKey);
    const p2Pink = makePink(svg2, k2);

    // Panel 3: Team ownership — full 7-cell live crystal inside vault, Snowfield cell stepped cleanly outside
    const svg3 = makeSvg(chambers[2]);
    const k3 = 0.55, ax3 = lat(k3), c3 = [142, 142];
    const vault3 = el('polygon', { points: hexPts(c3[0], c3[1], 98), class: 'sf-vault-frame' });
    svg3.append(vault3);
    const lbl3 = el('text', { x: 142, y: 20, class: 'sf-vault-label', 'text-anchor': 'middle' });
    lbl3.textContent = 'YOUR ACCOUNTS';
    svg3.append(lbl3);
    const p3Cells = hexArea(1).map(([q, r]) => {
      const [x, y] = ax3(q, r, ...c3);
      const s = createSlot(svg3, x, y, tone(r), k3);
      return Object.assign(s, { q, r, key: `${q},${r}`, dist: cellDist({ q, r }) });
    });
    const p3Open = p3Cells.find(s => s.key === gapKey);
    const p3PinkRest = [298, 138];
    const p3Pink = makePink(svg3, 0.58);
    const p3PinkLabel = el('text', { x: p3PinkRest[0], y: 198, class: 'sf-pink-label', 'text-anchor': 'middle' });
    p3PinkLabel.textContent = 'Snowfield';
    svg3.append(p3PinkLabel);

    const walkOrder = p1Cells
      .filter(s => s.key !== gapKey)
      .sort((a, b) => a.r - b.r || a.q - b.q);

    let cubesTurned = false;
    const DURATION = 9.0;

    function setActiveStep(stepIdx) {
      tabs.forEach((t, i) => t.setAttribute('aria-selected', String(i === stepIdx)));
      cards.forEach((c, i) => c.classList.toggle('active', i === stepIdx));
    }

    function renderAt(tNorm, isStaticRest) {
      const p = clamp01(tNorm);

      if (isStaticRest) {
        setActiveStep(2);
        // Panel 1: clean audited outlines
        p1Cells.forEach(s => {
          setFormBlend(s, 1, 0, 0);
          s.at.style.opacity = s.key === gapKey ? '0.18' : '1';
        });
        p1Brackets.forEach(b => { b.style.opacity = '0.85'; });
        p1Pink.style.opacity = '0';

        // Panel 2: clean solid tiles inside vault
        p2Cells.forEach(s => {
          setFormBlend(s, 0, 1, 0);
          s.at.style.opacity = '1';
        });
        p2Pink.style.opacity = '0';

        // Panel 3: full mark cells inside vault + single pink Snowfield cell cleanly outside
        p3Cells.forEach(s => {
          setFormBlend(s, 0, 0, 1);
          s.at.style.opacity = '1';
        });
        p3Pink.setAttribute('transform', `translate(${p3PinkRest[0]} ${p3PinkRest[1]})`);
        p3Pink.style.opacity = '1';
        p3PinkLabel.style.opacity = '1';
        return;
      }

      // Stage 0 [0..0.34]: Audit — pink Snowfield cell seats cleanly inside Panel 1's open audit slot
      // while illuminating each neighboring cell sequentially (0px shape overlap across all frames)
      // Stage 1 [0.34..0.67]: Build — pink Snowfield cell seats flush inside Panel 2's empty slot while tiles solidify
      // Stage 2 [0.67..1.00]: Ownership — Panel 3 cells turn live while pink Snowfield cell steps cleanly outside vault
      if (p < 0.34) {
        cubesTurned = false;
        const u = seg(p, 0, 0.34);
        setActiveStep(0);

        const scanIdx = u * walkOrder.length;
        p1Cells.forEach(s => {
          setFormBlend(s, 1, 0, 0);
          if (s.key === gapKey) {
            s.at.style.opacity = '0';
          } else {
            const wi = walkOrder.indexOf(s);
            s.at.style.opacity = wi <= scanIdx ? '1' : '0.35';
          }
        });
        p1Brackets.forEach((b, bi) => {
          const threshold = bi === 0 ? 0.42 : 0.72;
          b.style.opacity = u >= threshold ? '0.9' : '0';
        });
        p1Pink.setAttribute('transform', `translate(${p1Open.x.toFixed(2)} ${p1Open.y.toFixed(2)})`);
        p1Pink.style.opacity = '1';

        p2Cells.forEach(s => { setFormBlend(s, 1, 0, 0); s.at.style.opacity = '0.35'; });
        p2Pink.style.opacity = '0';

        p3Cells.forEach(s => { setFormBlend(s, 0, 1, 0); s.at.style.opacity = '0.35'; });
        p3Pink.style.opacity = '0';
        p3PinkLabel.style.opacity = '0';
      } else if (p < 0.67) {
        cubesTurned = false;
        const u = seg(p, 0.34, 0.67);
        setActiveStep(1);

        // Panel 1 completed state
        p1Cells.forEach(s => {
          setFormBlend(s, 1, 0, 0);
          s.at.style.opacity = s.key === gapKey ? '0.18' : '0.82';
        });
        p1Brackets.forEach(b => { b.style.opacity = '0.75'; });
        p1Pink.style.opacity = '0';

        // Panel 2 building inside client accounts (open slot hidden while Snowfield sits flush in it)
        p2Cells.forEach(s => {
          if (s === p2Open) {
            setFormBlend(s, 0, 1, 0);
            s.at.style.opacity = '0';
            return;
          }
          const lag = (s.dist / 1.5) * 0.22;
          const m = easeOut(seg(u, 0.14 + lag, 0.68 + lag));
          setFormBlend(s, 1 - m, m, 0);
          s.at.style.opacity = (0.45 + 0.55 * m).toFixed(3);
        });
        p2Pink.setAttribute('transform', `translate(${p2Open.x.toFixed(2)} ${p2Open.y.toFixed(2)})`);
        p2Pink.style.opacity = '1';

        p3Cells.forEach(s => { setFormBlend(s, 0, 1, 0); s.at.style.opacity = '0.45'; });
        p3Pink.style.opacity = '0';
        p3PinkLabel.style.opacity = '0';
      } else {
        const u = seg(p, 0.67, 1.0);
        setActiveStep(2);

        p1Cells.forEach(s => {
          setFormBlend(s, 1, 0, 0);
          s.at.style.opacity = s.key === gapKey ? '0.18' : '0.82';
        });
        p1Brackets.forEach(b => { b.style.opacity = '0.75'; });
        p1Pink.style.opacity = '0';

        p2Cells.forEach(s => {
          setFormBlend(s, 0, 1, 0);
          s.at.style.opacity = '0.86';
        });
        p2Pink.style.opacity = '0';

        // Panel 3: cells upgrade to full mark; Snowfield glides cleanly out above-right (zero overlap with neighbors)
        // Two-leg path: (p3Open) -> (288, 86) clear above (1,0), then down to rest (298, 138)
        let px = p3Open.x, py = p3Open.y;
        const leg1 = easeInOut(seg(u, 0.16, 0.52));
        const leg2 = easeInOut(seg(u, 0.52, 0.82));
        const midX = 292, midY = 82;
        if (u < 0.52) {
          px = p3Open.x + (midX - p3Open.x) * leg1;
          py = p3Open.y + (midY - p3Open.y) * leg1;
        } else {
          px = midX + (p3PinkRest[0] - midX) * leg2;
          py = midY + (p3PinkRest[1] - midY) * leg2;
        }

        p3Cells.forEach(s => {
          const lag = (s.dist / 1.5) * 0.16;
          const m = easeOut(seg(u, 0.06 + lag, 0.45 + lag));
          setFormBlend(s, 0, 1 - m, m);
          if (s === p3Open) {
            // Only reveal p3Open after p3Pink has completely cleared its cell seat
            s.at.style.opacity = u >= 0.48 ? easeOut(seg(u, 0.48, 0.78)).toFixed(3) : '0';
          } else {
            s.at.style.opacity = '1';
          }
        });

        if (u >= 0.48 && !cubesTurned && !RM.matches) {
          cubesTurned = true;
          p3Cells.forEach((s, i) => {
            if (!s.cube) return;
            setTimeout(() => {
              s.cube.classList.remove('turn');
              void s.cube.getBoundingClientRect();
              s.cube.classList.add('turn');
            }, i * 55);
          });
        }

        p3Pink.setAttribute('transform', `translate(${px.toFixed(2)} ${py.toFixed(2)})`);
        p3Pink.style.opacity = '1';
        p3PinkLabel.style.opacity = easeOut(seg(u, 0.65, 0.92)).toFixed(3);
      }
    }

    let rafId = 0;
    let playing = false;
    let progress = 1;
    let lastTs = 0;
    let stopAt = 1;
    let seen = false;

    function updatePlayBtn() {
      if (!playBtn) return;
      playBtn.textContent = playing ? 'Pause' : 'Play';
      playBtn.setAttribute('aria-pressed', String(playing));
    }

    function stop() {
      playing = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      updatePlayBtn();
    }

    function tick(ts) {
      if (!playing) return;
      const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      progress += dt / DURATION;
      if (progress >= stopAt) {
        progress = stopAt;
        renderAt(progress, false);
        stop();
        return;
      }
      renderAt(progress, false);
      rafId = requestAnimationFrame(tick);
    }

    function playFrom(startP, endP = 1) {
      if (RM.matches) {
        renderAt(endP, endP === 1);
        return;
      }
      progress = startP;
      stopAt = endP;
      playing = true;
      lastTs = performance.now();
      updatePlayBtn();
      renderAt(progress, false);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }

    renderAt(1, true);
    updatePlayBtn();

    const triggerStep = idx => {
      const ranges = [[0.0, 0.33], [0.34, 0.66], [0.67, 0.99]];
      const [a, b] = ranges[idx] || [0, 1];
      if (RM.matches) {
        stop();
        const staticPts = [0.28, 0.60, 0.98];
        renderAt(staticPts[idx], false);
      } else {
        playFrom(a, b);
      }
    };

    tabs.forEach((tab, idx) => tab.addEventListener('click', () => triggerStep(idx)));
    cards.forEach((card, idx) => card.addEventListener('click', () => triggerStep(idx)));

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (playing) {
          stop();
        } else if (progress >= 0.99 || progress >= stopAt - 0.01) {
          playFrom(0, 1);
        } else {
          playing = true;
          lastTs = performance.now();
          updatePlayBtn();
          rafId = requestAnimationFrame(tick);
        }
      });
    }
    if (replayBtn) {
      replayBtn.addEventListener('click', () => playFrom(0, 1));
    }

    if ('IntersectionObserver' in window && !RM.matches) {
      const io = new IntersectionObserver(entries => {
        if (!seen && entries.some(e => e.isIntersecting)) {
          seen = true;
          io.disconnect();
          playFrom(0, 1);
        }
      }, { threshold: 0.35 });
      io.observe(fig);
    }

    RM.addEventListener('change', () => {
      if (RM.matches) { stop(); renderAt(1, true); }
    });

    controllers.engagement = {
      seek(t) {
        stop();
        if (t === 'rest') { renderAt(1, true); return; }
        renderAt(Number(t), false);
      }
    };
  }

  D.querySelectorAll('figure.explain').forEach(fig => {
    if (fig.dataset.scene === 'knowledge') initKnowledge(fig);
    if (fig.dataset.scene === 'engagement') initEngagement(fig);
  });

  window.__sfExplainSeek = (scene, t) => {
    if (controllers[scene]) controllers[scene].seek(t);
  };
})();
