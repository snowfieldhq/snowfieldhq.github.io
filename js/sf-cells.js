// Snowfield cell kit for the Row402 maps. Geometry is the shipped R1301 cell
// (brand/masters/pattern/assets/R1301-cell.json, sha256 415b1eca...) on the shipped
// lattice (pattern.tokens.json: pitch 100.4643, row step 87, mark height 112).
// Plate and cube colours are the ice ramp of the selected hero exports
// (brand/masters/selected/Export-Pack-2026-11-05/hero-ice-w-{light,dark}.svg).
const SF = (() => {
  const DX = 100.4643, DY = 87, H = 112, NS = 'http://www.w3.org/2000/svg';
  const M = 'matrix(1.7320508 0 0 -1 0 0)';
  const BOX = {
    top: 'M-1 55L-1 45L-3 47L-4 44L-1 41L-1 27L-13 15L-20 22L-20 28L-22 28L-22 24L-27 29ZM27 29L22 24L22 28L20 28L20 22L13 15L1 27L1 41L4 44L3 47L1 45L1 55Z',
    left: 'M-28 26L-23 21L-25 19L-24 16L-21 19L-14 12L-14 -12L-21 -19L-24 -16L-25 -19L-23 -21L-28 -26ZM-27 -29L-22 -24L-22 -28L-20 -28L-20 -22L-13 -15L-1 -27L-1 -41L-4 -44L-3 -47L-1 -45L-1 -55Z',
    right: 'M1 -55L1 -45L3 -47L4 -44L1 -41L1 -27L13 -15L20 -22L20 -28L22 -28L22 -24L27 -29ZM28 -26L23 -21L25 -19L24 -16L21 -19L14 -12L14 12L21 19L24 16L25 19L23 21L28 26Z'
  };
  const CUBE = { top: 'M0 24L11 13L0 2L-11 13Z', left: 'M-12 -12L-12 10L-1 -1L-1 -23Z', right: 'M12 -12L1 -23L1 -1L12 10Z' };
  const HEX = '0,-56 48.5,-28 48.5,28 0,56 -48.5,28 -48.5,-28';
  // ten steps of the hero ice ramp, light to deep: [top, left, right]
  const RAMP = {
    light: [['#ADDFFE','#74B7DF','#4B8EB5'],['#81C5ED','#599CC3','#307499'],['#71B4DC','#488BB2','#1E6589'],['#60A3CA','#377BA0','#045578'],['#5498BE','#2B7095','#004B6B'],['#498CB2','#1E658A','#00405D'],['#3C7FA5','#0C597D','#01354C'],['#2A6F94','#024A69','#00273A'],['#06567A','#013249','#00111E'],['#015477','#002F46','#000F1B']],
    dark: [['#CBEAFE','#80C4ED','#589BC2'],['#9DDAFF','#6BB1DA','#4288B0'],['#89CDF5','#60A3CA','#387BA1'],['#7FC2EB','#5699C0','#2D7297'],['#77BAE3','#4F92B8','#256B8F'],['#6FB2DA','#468AB0','#1B6387'],['#65A8CF','#3C80A5','#0D5A7D'],['#599CC3','#30759A','#024F70'],['#468AB0','#1B6387','#003E5A'],['#4288B0','#156287','#003D59']]
  };
  const PINK = ['#FF6CAC', '#E40085', '#A4005E'];
  const CU = { light: ['#3D3A43', '#242229', '#0D0B12'], dark: ['#FAF9FC', '#D9D8DB', '#B9B8BB'] };

  // colour tokens: light on :root, dark in the two guarded blocks (artifact theme contract)
  function css() {
    const decl = th => RAMP[th].map((t, i) => `--t${i}a:${t[0]};--t${i}b:${t[1]};--t${i}c:${t[2]};--t${i}o:${th === 'light' ? t[2] : t[0]};`).join('') + `--cu1:${CU[th][0]};--cu2:${CU[th][1]};--cu3:${CU[th][2]};`;
    let s = `:root{${decl('light')}}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${decl('dark')}}}:root[data-theme="dark"]{${decl('dark')}}`;
    for (let i = 0; i < 10; i++) s += `.t${i} .bt{fill:var(--t${i}a)}.t${i} .bl{fill:var(--t${i}b)}.t${i} .br{fill:var(--t${i}c)}.t${i} .hx{fill:var(--t${i}b)}.t${i} .ho{stroke:var(--t${i}o)}`;
    s += `.c1{fill:var(--cu1)}.c2{fill:var(--cu2)}.c3{fill:var(--cu3)}.tp .bt{fill:${PINK[0]}}.tp .bl{fill:${PINK[1]}}.tp .br{fill:${PINK[2]}}`;
    return s;
  }
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  function defs(svg) {
    const d = el('defs');
    for (const k of ['top', 'left', 'right']) d.append(el('path', { id: 'sf-b' + k, transform: M, d: BOX[k] }));
    const g = el('g', { id: 'sf-cu', transform: M });
    g.append(el('path', { class: 'c1', d: CUBE.top }), el('path', { class: 'c2', d: CUBE.left }), el('path', { class: 'c3', d: CUBE.right }));
    d.append(g, el('polygon', { id: 'sf-hx', points: HEX }));
    svg.append(d);
  }
  // axial lattice position to master units
  const pos = (q, r) => [DX * (q + r / 2), DY * r];
  // one cell. form: mark | tile | outline. tone: 0..9 or 'p' for the pink focus
  function cell(parent, x, y, k, tone, form = 'mark', extra = {}) {
    const g = el('g', { transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(5)})`, class: 'cell t' + tone + (extra.cls ? ' ' + extra.cls : '') });
    if (form === 'mark') {
      g.append(el('use', { href: '#sf-btop', class: 'bt' }), el('use', { href: '#sf-bleft', class: 'bl' }), el('use', { href: '#sf-bright', class: 'br' }));
      const cu = el('g', { class: 'cube' }); cu.append(el('use', { href: '#sf-cu' })); g.append(cu);
    } else if (form === 'tile') g.append(el('use', { href: '#sf-hx', class: 'hx', transform: 'scale(0.965)' }));
    else g.append(el('use', { href: '#sf-hx', class: 'ho', fill: 'none', 'stroke-width': 2.5, 'vector-effect': 'non-scaling-stroke', transform: 'scale(0.965)' }));
    parent.append(g); return g;
  }
  return { DX, DY, H, NS, el, css, defs, cell, pos, RAMP, PINK };
})();
