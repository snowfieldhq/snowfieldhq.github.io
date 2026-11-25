(() => {
  'use strict';
  const D = document;
  const root = D.documentElement;
  const qs = (sel, ctx = D) => (ctx ? ctx.querySelector(sel) : null);
  const qsa = (sel, ctx = D) => (ctx ? [...ctx.querySelectorAll(sel)] : []);

  /* Theme management: syncs desktop segmented toggle, mobile compact toggle, and localStorage */
  const currentTheme = () => (root.dataset.theme === 'light' ? 'light' : 'dark');

  function setTheme(theme, persist) {
    const next = theme === 'light' ? 'light' : 'dark';
    if (root.dataset.theme !== next) root.dataset.theme = next;
    if (persist) {
      try { localStorage.setItem('sf-theme', next); } catch (_) {}
    }
    qsa('.theme-seg button[data-t]').forEach(btn => {
      const v = String(btn.dataset.t === next);
      if (btn.getAttribute('aria-pressed') !== v) btn.setAttribute('aria-pressed', v);
    });
    qsa('.theme-compact').forEach(btn => {
      const target = next === 'dark' ? 'light' : 'dark';
      const lbl = `Switch to ${target} theme`;
      if (btn.getAttribute('aria-label') !== lbl) btn.setAttribute('aria-label', lbl);
      if (btn.getAttribute('title') !== lbl) btn.setAttribute('title', lbl);
    });
  }

  qsa('.theme-seg button[data-t]').forEach(btn => {
    btn.addEventListener('click', () => setTheme(btn.dataset.t, true));
  });
  qsa('.theme-compact').forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
    });
  });
  setTheme(currentTheme(), false);
  window.SNOW = { setTheme };

  /* Accessible mobile navigation drawer */
  const menuBtn = qs('.menu-btn');
  const drawer = qs('#mobile-nav');
  if (menuBtn && drawer) {
    const setOpen = open => {
      menuBtn.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('open', open);
      drawer.hidden = !open;
    };
    setOpen(false);
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') !== 'true';
      setOpen(open);
    });
    qsa('a', drawer).forEach(link => {
      link.addEventListener('click', () => setOpen(false));
    });
    D.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        menuBtn.focus();
      }
    });
    matchMedia('(min-width: 960px)').addEventListener('change', ev => {
      if (ev.matches) setOpen(false);
    });
  }

  /* Interactive Grounded Operational Assistant tabs (covered rule vs. out-of-policy escalation) */
  qsa('[data-assistant-widget]').forEach(widget => {
    const tabs = qsa('[role="tab"]', widget);
    const panels = qsa('[role="tabpanel"]', widget);
    const activate = idx => {
      tabs.forEach((tab, i) => {
        const on = i === idx;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        panel.hidden = i !== idx;
      });
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i));
      tab.addEventListener('keydown', ev => {
        if (ev.key === 'ArrowRight') { ev.preventDefault(); const n = (i + 1) % tabs.length; activate(n); tabs[n].focus(); }
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); const n = (i - 1 + tabs.length) % tabs.length; activate(n); tabs[n].focus(); }
      });
    });
  });

  /* Print / Save PDF trigger on the one-page studio summary */
  qsa('[data-print-btn]').forEach(btn => {
    btn.addEventListener('click', () => window.print());
  });
})();
