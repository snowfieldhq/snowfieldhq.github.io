// Snowfield Flagship Interactive Architectural Stages
// Uses shipped R1301 cell geometry (js/sf-cells.js) on the exact Snowfield lattice.
// Zero dotted lines covering boxes/cells: optical waveguides live strictly in dedicated corridors.
// Phases 1-3 (Authorship -> Build -> Team Ownership) animate seamlessly inside ONE single unified chamber.
// Self-contained zero-CDN animation engine with deterministic seek hook for verification.
(() => {
  'use strict';
  if (typeof SF === 'undefined') return;

  const D = document;
  const el = SF.el;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

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
  const hexVerts = (cx, cy, R) =>
    [0, 1, 2, 3, 4, 5].map(i => {
      const a = (Math.PI / 180) * (60 * i - 90);
      return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    });
  const hexPts = (cx, cy, R) =>
    hexVerts(cx, cy, R)
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(' ');
  const tone = r => Math.max(1, Math.min(8, 4 + r));
  const cellDist = s => Math.hypot(s.q + s.r / 2, s.r * 0.866);

  function createSlot(parent, x, y, tn, k) {
    const at = el('g', { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`, class: 'sf-cell-slot' });
    const inner = el('g');
    const m = SF.cell(inner, 0, 0, k, tn, 'mark');
    at.append(inner);
    parent.append(at);
    return { at, inner, o: null, t: null, m, tn, k, x, y, cube: m.querySelector('.cube') };
  }

  function setFormBlend(slot, oOp, tOp, mOp) {
    if (oOp > 0.001 && !slot.o) {
      slot.o = SF.cell(slot.inner, 0, 0, slot.k, slot.tn, 'outline');
    }
    if (tOp > 0.001 && !slot.t) {
      slot.t = SF.cell(slot.inner, 0, 0, slot.k, slot.tn, 'tile');
    }
    if (slot.o) slot.o.style.opacity = oOp.toFixed(3);
    if (slot.t) slot.t.style.opacity = tOp.toFixed(3);
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
     SCENE 1: Knowledge Layer — Reconcile Sources -> Cited Answer -> Handoff
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
    // Precision ring seated strictly in the 3.4641-unit lattice gutter (non-color cue for pink cell)
    const hitRing = el('polygon', {
      points: hexPts(hitCell.x, hitCell.y, 56 * K),
      class: 'sf-gutter-ring'
    });
    svg.append(hitRing);

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
    const DURATION = 10.5;

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
        statusText.textContent = toMark > 0.7 ? 'All 3 sources reconciled' : 'Comparing 3 sources...';
        statusTag.textContent = toMark > 0.7 ? '19 sections' : 'Step 1 of 3';

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
        const scanWave = seg(u, 0.20, 0.56);
        const matched = u >= 0.50;
        const outWave = seg(u, 0.52, 0.88);
        const answerLit = u >= 0.52;

        cells.forEach(c => {
          c.inner.setAttribute('transform', 'translate(0 0)');
          setFormBlend(c, 0, 0, matched && c === hitCell ? 0 : 1);
          if (matched) {
            c.at.style.opacity = c === hitCell ? '1' : '0.48';
          } else if (scanWave > 0) {
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
          ? 'Match found in Service Policy'
          : 'Checking approved policy...';
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
        const scanWave = seg(u, 0.20, 0.56);
        const refused = u >= 0.50;
        const outWave = seg(u, 0.52, 0.88);
        const escLit = u >= 0.52;

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
          ? 'No matching rule found'
          : 'Checking approved policy...';
        statusTag.textContent = refused ? 'Route to manager' : '19 sections';

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

    controllers.knowledge = {
      seek(t) {
        stop();
        if (t === 'rest') { renderAt(1, true); return; }
        renderAt(Number(t), false);
      }
    };
  }

  /* ========================================================================
     SCENE 2: Unified Single-Panel Engagement Stage (Audit -> Build -> Onboard)
     ONE persistent 7-cell R1301 crystal stage and ONE pink Snowfield cell
     evolving smoothly inside a single frame — zero panel-to-panel jumping.
     ======================================================================== */
  function initEngagement(fig) {
    const svgBox = fig.querySelector('.eng-svg-box');
    const chamber = fig.querySelector('.eng-unified-chamber');
    const stepItems = [...fig.querySelectorAll('.eng-step')];
    const tabs = [...fig.querySelectorAll('.ex-tab')];
    const playBtn = fig.querySelector('[data-action="toggle"]');
    const replayBtn = fig.querySelector('[data-action="replay"]');
    const stageLabel = fig.querySelector('[data-eng-label]');
    const stageBadge = fig.querySelector('[data-eng-badge]');
    const statusText = fig.querySelector('[data-eng-status]');
    const statusTag = fig.querySelector('[data-eng-tag]');
    const progressFill = fig.querySelector('[data-eng-progress]');
    if (!svgBox || stepItems.length < 3) return;

    const W = 560, H = 356;
    const CX = 204, CY = 186, K = 0.62;
    const VR = 124;
    const ax = lat(K);

    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', focusable: 'false' });
    SF.defs(svg);
    svgBox.replaceChildren(svg);

    // Subtle hexagonal vault perimeter split into permanent 4-side wall (indices 2..5..0)
    // and revocable-access right portal (indices 0..1..2) so Snowfield exits with 0px stroke collision.
    const V = hexVerts(CX, CY, VR);
    const fmt = pt => `${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`;

    const vaultGlow = el('polygon', {
      points: hexPts(CX, CY, VR),
      class: 'sf-vault-fill'
    });
    svg.append(vaultGlow);

    const vaultMainPath = `M ${fmt(V[2])} L ${fmt(V[3])} L ${fmt(V[4])} L ${fmt(V[5])} L ${fmt(V[0])}`;
    const vaultMain = el('path', { d: vaultMainPath, class: 'sf-vault-frame' });
    svg.append(vaultMain);

    const vaultGatePath = `M ${fmt(V[0])} L ${fmt(V[1])} L ${fmt(V[2])}`;
    const vaultGate = el('path', { d: vaultGatePath, class: 'sf-vault-frame sf-vault-gate' });
    svg.append(vaultGate);

    // Subtle open-gate terminal posts at top and bottom-right vertices (visible while revocable access is open)
    const gatePosts = el('g', { class: 'sf-gate-posts' });
    gatePosts.append(
      el('circle', { cx: V[0][0].toFixed(1), cy: V[0][1].toFixed(1), r: '3.2' }),
      el('circle', { cx: V[2][0].toFixed(1), cy: V[2][1].toFixed(1), r: '3.2' })
    );
    svg.append(gatePosts);

    // Crisp label centered cleanly above top vertex (204, 62) with 25px open clearance
    const vaultLabel = el('text', { x: CX, y: 34, class: 'sf-vault-label', 'text-anchor': 'middle' });
    vaultLabel.textContent = 'YOUR ACCOUNTS';
    svg.append(vaultLabel);

    // Single persistent 7-cell cluster
    const cellLayer = el('g');
    svg.append(cellLayer);
    const gapKey = '1,-1';
    const confKeys = ['-1,0', '0,1'];

    const cells = hexArea(1).map(([q, r]) => {
      const [x, y] = ax(q, r, CX, CY);
      const s = createSlot(cellLayer, x, y, tone(r), K);
      const key = `${q},${r}`;
      // Gentle outward scatter in Phase 1 audit (<5.5px so cell-to-cell clearance stays strictly > 0px)
      const dx = (x - CX) * 0.08;
      const dy = (y - CY) * 0.08;
      return Object.assign(s, { q, r, key, dx, dy, dist: cellDist({ q, r }) });
    });

    const openSlot = cells.find(s => s.key === gapKey);
    const walkOrder = cells
      .filter(s => s.key !== gapKey)
      .sort((a, b) => a.r - b.r || a.q - b.q);

    // Clean precision highlight rings in the lattice gutter for the two disagreeing cells in Phase 1
    const conflictRings = cells
      .filter(s => confKeys.includes(s.key))
      .map(s => {
        const ring = el('polygon', {
          points: hexPts(s.x, s.y, 56 * K),
          class: 'sf-audit-ring'
        });
        svg.append(ring);
        return ring;
      });

    // Strictly ONE pink Snowfield R1301 cell for the entire 0% -> 100% animation
    const pinkRest = [446, CY];
    const pinkMid = [322, 102]; // Clear high arc right through the open V0->V1->V2 portal (0px collision!)
    const pinkMover = el('g', { class: 'sf-pink-mover' });
    const pinkCell = SF.cell(pinkMover, 0, 0, K, 'p', 'mark');
    const pinkCube = pinkCell.querySelector('.cube');
    svg.append(pinkMover);

    // Non-color gutter ring around the single pink focal cell (honors snowfield-style non-color cue)
    const pinkGutterRing = el('polygon', {
      points: hexPts(0, 0, 56 * K),
      class: 'sf-gutter-ring'
    });
    pinkMover.append(pinkGutterRing);

    // Labels seated cleanly beneath pinkRest (446, 186): cell bottom is y=220.7, labels sit at y=246 & y=266
    const pinkLabel = el('text', { x: pinkRest[0], y: 246, class: 'sf-pink-label', 'text-anchor': 'middle' });
    pinkLabel.textContent = 'Snowfield';
    svg.append(pinkLabel);

    const pinkSub = el('text', { x: pinkRest[0], y: 266, class: 'sf-pink-sub', 'text-anchor': 'middle' });
    pinkSub.textContent = 'Stepped back';
    svg.append(pinkSub);

    const mainLen = 4 * VR;
    const gateLen = 2 * VR;
    vaultMain.style.strokeDasharray = `${mainLen.toFixed(1)}`;
    vaultGate.style.strokeDasharray = `${gateLen.toFixed(1)}`;

    let buildCubeTurned = false;
    let handoffCubesTurned = false;
    const DURATION = 10.2;

    function setActiveStep(stepIdx) {
      tabs.forEach((t, i) => t.setAttribute('aria-selected', String(i === stepIdx)));
      stepItems.forEach((item, i) => {
        item.classList.toggle('active', i === stepIdx);
        item.classList.toggle('done', i < stepIdx);
        item.setAttribute('aria-current', i === stepIdx ? 'step' : 'false');
      });
    }

    function setPinkPos(x, y) {
      pinkMover.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    }

    function renderAt(tNorm, isStaticRest) {
      const p = clamp01(tNorm);

      if (progressFill) {
        progressFill.style.transform = `scaleX(${(isStaticRest ? 1 : p).toFixed(4)})`;
      }

      if (isStaticRest) {
        setActiveStep(2);
        if (chamber) chamber.className = 'eng-unified-chamber lit-ice';
        if (stageLabel) stageLabel.textContent = 'Your accounts';
        if (stageBadge) stageBadge.textContent = 'Phase 3 of 3';
        if (statusText) statusText.textContent = 'Running in your accounts';
        if (statusTag) statusTag.textContent = 'Team-owned';

        vaultGlow.style.opacity = '1';
        vaultMain.style.opacity = '1';
        vaultMain.style.strokeDashoffset = '0';
        vaultGate.style.opacity = '1';
        vaultGate.style.strokeDashoffset = '0';
        gatePosts.style.opacity = '0';
        vaultLabel.style.opacity = '1';

        cells.forEach(s => {
          s.inner.setAttribute('transform', 'translate(0 0)');
          setFormBlend(s, 0, 0, 1);
          s.at.style.opacity = '1';
        });
        conflictRings.forEach(r => { r.style.opacity = '0'; });

        setPinkPos(pinkRest[0], pinkRest[1]);
        pinkMover.style.opacity = '1';
        pinkGutterRing.classList.add('on');
        pinkLabel.style.opacity = '1';
        pinkSub.style.opacity = '1';
        return;
      }

      // Phase 1 [0.00 .. 0.34]: Audit — outline cluster settles into alignment, Snowfield seated in open slot
      if (p < 0.34) {
        buildCubeTurned = false;
        handoffCubesTurned = false;
        const u = seg(p, 0.0, 0.34);
        setActiveStep(0);
        if (chamber) chamber.className = 'eng-unified-chamber';
        if (stageLabel) stageLabel.textContent = 'Current operation';
        if (stageBadge) stageBadge.textContent = 'Phase 1 of 3';

        const settle = easeInOut(seg(u, 0.20, 0.88));
        const scanIdx = u * (walkOrder.length + 0.5);

        vaultGlow.style.opacity = '0';
        vaultMain.style.opacity = '0';
        vaultMain.style.strokeDashoffset = `${mainLen.toFixed(1)}`;
        vaultGate.style.opacity = '0';
        vaultGate.style.strokeDashoffset = `${gateLen.toFixed(1)}`;
        gatePosts.style.opacity = '0';
        vaultLabel.style.opacity = '0';

        cells.forEach(s => {
          setFormBlend(s, 1, 0, 0);
          if (s === openSlot) {
            s.inner.setAttribute('transform', 'translate(0 0)');
            s.at.style.opacity = '0';
          } else {
            const tx = s.dx * (1 - settle);
            const ty = s.dy * (1 - settle);
            s.inner.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)})`);
            const wi = walkOrder.indexOf(s);
            s.at.style.opacity = wi <= scanIdx ? '1' : '0.42';
          }
        });

        // Two disagreeing rules highlight cleanly during audit, then fade out as rules align
        const ringEnv = Math.sin(Math.PI * seg(u, 0.14, 0.86));
        conflictRings.forEach((r, ri) => {
          const offset = ri === 0 ? 0 : 0.10;
          const v = Math.sin(Math.PI * seg(u, 0.14 + offset, 0.82 + offset));
          r.style.opacity = (0.85 * Math.max(0, v)).toFixed(3);
        });

        // Single pink Snowfield cell seats flush inside openSlot (1,-1) — 0px overlap
        setPinkPos(openSlot.x, openSlot.y);
        pinkMover.style.opacity = '1';
        pinkGutterRing.classList.add('on');
        pinkLabel.style.opacity = '0';
        pinkSub.style.opacity = '0';

        if (statusText) {
          statusText.textContent = u >= 0.72
            ? 'Conflicting rules aligned'
            : (ringEnv > 0.3 ? 'Checking rule conflicts...' : 'Mapping playbooks...');
        }
        if (statusTag) {
          statusTag.textContent = u >= 0.72 ? 'Rules aligned' : 'Audit';
        }
      } else if (p < 0.67) {
        // Phase 2 [0.34 .. 0.67]: Build — SAME 7-cell cluster gains YOUR ACCOUNTS boundary (open access gate)
        // and solidifies from outlines into ice-blue tiles while Snowfield works seated in (1,-1)
        handoffCubesTurned = false;
        const u = seg(p, 0.34, 0.67);
        setActiveStep(1);
        if (chamber) chamber.className = 'eng-unified-chamber lit-ice';
        if (stageLabel) stageLabel.textContent = 'Your accounts';
        if (stageBadge) stageBadge.textContent = 'Phase 2 of 3';

        const drawWall = easeOut(seg(u, 0.0, 0.42));
        vaultGlow.style.opacity = (0.65 * drawWall).toFixed(3);
        vaultMain.style.opacity = drawWall > 0.02 ? '1' : '0';
        vaultMain.style.strokeDashoffset = (mainLen * (1 - drawWall)).toFixed(1);
        // Right portal stays OPEN while Snowfield builds inside client accounts
        vaultGate.style.opacity = '0';
        vaultGate.style.strokeDashoffset = `${gateLen.toFixed(1)}`;
        gatePosts.style.opacity = easeOut(seg(u, 0.30, 0.55)).toFixed(3);
        vaultLabel.style.opacity = easeOut(seg(u, 0.12, 0.44)).toFixed(3);

        cells.forEach(s => {
          s.inner.setAttribute('transform', 'translate(0 0)');
          if (s === openSlot) {
            setFormBlend(s, 0, 1, 0);
            s.at.style.opacity = '0';
            return;
          }
          const lag = (s.dist / 1.6) * 0.22;
          const m = easeOut(seg(u, 0.12 + lag, 0.68 + lag));
          setFormBlend(s, 1 - m, m, 0);
          s.at.style.opacity = (0.62 + 0.38 * m).toFixed(3);
        });
        conflictRings.forEach(r => { r.style.opacity = '0'; });

        setPinkPos(openSlot.x, openSlot.y);
        pinkMover.style.opacity = '1';
        pinkGutterRing.classList.add('on');
        pinkLabel.style.opacity = '0';
        pinkSub.style.opacity = '0';

        if (u >= 0.26 && !buildCubeTurned && pinkCube && !RM.matches) {
          buildCubeTurned = true;
          pinkCube.classList.remove('turn');
          void pinkCube.getBoundingClientRect();
          pinkCube.classList.add('turn');
        }

        if (statusText) {
          statusText.textContent = u >= 0.72
            ? 'Built in your accounts'
            : 'Building in your accounts...';
        }
        if (statusTag) {
          statusTag.textContent = u >= 0.72 ? 'Verified' : 'Revocable access';
        }
      } else {
        // Phase 3 [0.67 .. 1.00]: Onboard — SAME cluster upgrades to full live R1301 marks;
        // single pink Snowfield cell glides cleanly out through the OPEN portal (0px stroke/cell collision);
        // 7th client cell fills the vacated slot; portal seals closed behind Snowfield.
        const u = seg(p, 0.67, 1.0);
        setActiveStep(2);
        if (chamber) chamber.className = 'eng-unified-chamber lit-ice';
        if (stageLabel) stageLabel.textContent = 'Your accounts';
        if (stageBadge) stageBadge.textContent = 'Phase 3 of 3';

        // Two-leg exit trajectory through open upper-right portal:
        // Leg 1 (u: 0.08..0.38): (235.14, 132.06) -> (322, 102) [strictly increasing distance from (1,0)]
        // Leg 2 (u: 0.38..0.66): (322, 102) -> (446, 186) [cleanly outside VR=124]
        let px = openSlot.x, py = openSlot.y;
        const leg1 = easeInOut(seg(u, 0.08, 0.38));
        const leg2 = easeInOut(seg(u, 0.38, 0.66));
        if (u < 0.38) {
          px = openSlot.x + (pinkMid[0] - openSlot.x) * leg1;
          py = openSlot.y + (pinkMid[1] - openSlot.y) * leg1;
        } else {
          px = pinkMid[0] + (pinkRest[0] - pinkMid[0]) * leg2;
          py = pinkMid[1] + (pinkRest[1] - pinkMid[1]) * leg2;
        }

        // Vault main stays solid; revocable-access gate seals shut ONLY AFTER pinkMover clears x > 378 (u >= 0.56)
        const closeGate = easeOut(seg(u, 0.56, 0.84));
        vaultGlow.style.opacity = (0.65 + 0.35 * closeGate).toFixed(3);
        vaultMain.style.opacity = '1';
        vaultMain.style.strokeDashoffset = '0';
        vaultGate.style.opacity = closeGate > 0.02 ? '1' : '0';
        vaultGate.style.strokeDashoffset = (gateLen * (1 - closeGate)).toFixed(1);
        gatePosts.style.opacity = (1 - easeOut(seg(u, 0.54, 0.72))).toFixed(3);
        vaultLabel.style.opacity = '1';

        cells.forEach(s => {
          s.inner.setAttribute('transform', 'translate(0 0)');
          const lag = (s.dist / 1.6) * 0.16;
          const m = easeOut(seg(u, 0.06 + lag, 0.44 + lag));
          setFormBlend(s, 0, 1 - m, m);
          if (s === openSlot) {
            // Reveal 7th client cell ONLY after pinkMover is well clear (>110px away at u >= 0.42)
            s.at.style.opacity = u >= 0.42 ? easeOut(seg(u, 0.42, 0.70)).toFixed(3) : '0';
          } else {
            s.at.style.opacity = '1';
          }
        });
        conflictRings.forEach(r => { r.style.opacity = '0'; });

        if (u >= 0.54 && !handoffCubesTurned && !RM.matches) {
          handoffCubesTurned = true;
          cells.forEach((s, i) => {
            if (!s.cube) return;
            setTimeout(() => {
              s.cube.classList.remove('turn');
              void s.cube.getBoundingClientRect();
              s.cube.classList.add('turn');
            }, i * 50);
          });
        }

        setPinkPos(px, py);
        pinkMover.style.opacity = '1';
        pinkGutterRing.classList.add('on');
        const lblOp = easeOut(seg(u, 0.68, 0.90));
        pinkLabel.style.opacity = lblOp.toFixed(3);
        pinkSub.style.opacity = easeOut(seg(u, 0.74, 0.95)).toFixed(3);

        if (statusText) {
          statusText.textContent = u >= 0.68
            ? 'Running in your accounts'
            : 'Handing off to your team...';
        }
        if (statusTag) {
          statusTag.textContent = u >= 0.68 ? 'Team-owned' : 'Live onboarding';
        }
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
    stepItems.forEach((item, idx) => {
      item.addEventListener('click', () => triggerStep(idx));
      item.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          triggerStep(idx);
        }
      });
    });

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

  let pendingJobs = [];
  let flushTimer = 0;

  function flushAllNow() {
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = 0; }
    while (pendingJobs.length) {
      const fn = pendingJobs.shift();
      fn();
    }
  }

  function scheduleDrain() {
    if (flushTimer || !pendingJobs.length) return;
    flushTimer = setTimeout(() => {
      flushTimer = 0;
      const fn = pendingJobs.shift();
      if (fn) fn();
      if (pendingJobs.length) scheduleDrain();
    }, 16);
  }

  D.querySelectorAll('figure.explain').forEach(fig => {
    if (fig.dataset.scene === 'knowledge') {
      pendingJobs.push(() => initKnowledge(fig));
    }
    if (fig.dataset.scene === 'engagement') {
      pendingJobs.push(() => initEngagement(fig));
    }
  });

  // Yield briefly after first paint so mobile hero LCP & TBT stay fast, while populating
  // both below-the-fold rest frames immediately in separate short turns (<50ms each).
  setTimeout(scheduleDrain, 40);

  window.__sfExplainSeek = (scene, t) => {
    flushAllNow();
    if (controllers[scene]) controllers[scene].seek(t);
  };
})();
