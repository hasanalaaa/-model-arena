/* Model Arena viewer. Plain JS, no dependencies. */
(function () {
  'use strict';

  // ───────────────────────── helpers
  const $ = (sel, el = document) => el.querySelector(sel);
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'text') el.textContent = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

  // ───────────────────────── state
  const KEY = 'model-arena.v1';
  const S = {
    lang: safeGet('arena.lang') || 'ar',
    theme: safeGet('arena.theme') || '',
    data: null, manifest: null,
    store: { ratings: {}, duels: [] },
    filter: { cat: 'all', diff: 0, q: '' },
    blind: { order: [], revealed: false, key: '' },
    cache: {},
  };
  try {
    const raw = JSON.parse(safeGet(KEY) || 'null');
    if (raw && typeof raw === 'object') S.store = { ratings: raw.ratings || {}, duels: raw.duels || [] };
  } catch { /* ignore corrupt data */ }
  const saveStore = () => safeSet(KEY, JSON.stringify(S.store));
  const T = () => I18N[S.lang];
  const tr = (obj) => (obj && (obj[S.lang] || obj.en)) || '';

  function applyChrome() {
    const t = T();
    document.documentElement.lang = S.lang;
    document.documentElement.dir = t.dir;
    if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme;
    $('#brandName').textContent = t.app;
    document.title = t.app;
    $('#langBtn').textContent = t.lang;
    $('#themeBtn').setAttribute('aria-label', t.theme);
    const nav = $('#nav');
    nav.replaceChildren(
      h('a', { href: '#/', 'data-r': 'home' }, t.nav_tests),
      h('a', { href: '#/board', 'data-r': 'board' }, t.nav_board),
      h('a', { href: '#/preview', 'data-r': 'preview' }, t.nav_preview),
    );
  }
  function markNav(route) {
    document.querySelectorAll('#nav a').forEach((a) => {
      if (a.dataset.r === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  // ───────────────────────── data
  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(url + ' → ' + r.status);
    return r.json();
  }
  async function getText(url) {
    if (S.cache[url]) return S.cache[url];
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ' → ' + r.status);
    return (S.cache[url] = await r.text());
  }
  async function load() {
    S.data = await getJSON('tests/tests.json');
    try { S.manifest = await getJSON('submissions/manifest.json'); } catch { S.manifest = { models: [] }; }
  }
  const testById = (id) => S.data.tests.find((x) => x.id === id);
  const catById = (id) => S.data.categories.find((x) => x.id === id);
  const modelsFor = (id) => S.manifest.models.filter((m) => m.tests.includes(id));
  const modelBySlug = (s) => S.manifest.models.find((m) => m.slug === s);
  const ratingKey = (slug, id) => slug + '/' + id;
  const diffInfo = (d) => S.data.difficulty.find((x) => x.level === d);

  // ratings → 0..1
  function ratingScore(slug, id) {
    const r = S.store.ratings[ratingKey(slug, id)];
    if (!r || !r.s) return null;
    const vals = r.s.filter((v) => v > 0);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length / 5;
  }

  // ───────────────────────── router
  function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = raw.split('?');
    return { parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
  }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

  async function render() {
    const app = $('#app');
    if (!S.data) return;
    const { parts, q } = parseHash();
    window.scrollTo(0, 0);
    if (parts[0] === 'test' && parts[1]) { markNav('home'); return viewTest(app, parts[1], q); }
    if (parts[0] === 'board') { markNav('board'); return viewBoard(app); }
    if (parts[0] === 'preview') { markNav('preview'); return viewPreview(app, q); }
    markNav('home');
    return viewHome(app);
  }

  // ───────────────────────── home
  function viewHome(app) {
    const t = T();
    const subs = S.manifest.models.reduce((a, m) => a + m.tests.length, 0);
    const rated = Object.keys(S.store.ratings).filter((k) => ratingScore(...k.split('/')) != null).length;
    const grid = h('div', { class: 'grid' });
    const hint = h('div');

    const drawGrid = () => {
      const f = S.filter, q = f.q.trim().toLowerCase();
      const list = S.data.tests.filter((x) =>
        (f.cat === 'all' || x.category === f.cat) &&
        (!f.diff || x.difficulty === f.diff) &&
        (!q || (x.title.en + ' ' + x.title.ar + ' ' + x.id).toLowerCase().includes(q)));
      grid.replaceChildren(...list.map(card));
      hint.replaceChildren(list.length ? '' : h('div', { class: 'empty' }, t.empty_filter));
    };
    const chip = (label, active, on) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(active), onclick: on }, label);
    const catRow = h('div', { class: 'row' });
    const diffRow = h('div', { class: 'row' });
    const drawChips = () => {
      catRow.replaceChildren(h('span', { class: 'lbl' }, t.cat),
        chip(t.all, S.filter.cat === 'all', () => { S.filter.cat = 'all'; drawChips(); drawGrid(); }),
        ...S.data.categories.map((c) => chip(c.icon + ' ' + tr(c), S.filter.cat === c.id, () => { S.filter.cat = c.id; drawChips(); drawGrid(); })));
      diffRow.replaceChildren(h('span', { class: 'lbl' }, t.diff),
        chip(t.all, !S.filter.diff, () => { S.filter.diff = 0; drawChips(); drawGrid(); }),
        ...S.data.difficulty.map((d) => chip(d.icon + ' ' + tr(d), S.filter.diff === d.level, () => { S.filter.diff = d.level; drawChips(); drawGrid(); })));
    };
    function card(x) {
      const cat = catById(x.category), d = diffInfo(x.difficulty), ms = modelsFor(x.id);
      const ratedHere = ms.filter((m) => ratingScore(m.slug, x.id) != null).length;
      return h('a', { class: 'card', href: '#/test/' + x.id },
        h('div', { class: 'meta' }, h('span', {}, cat.icon + ' ' + tr(cat)), h('span', { class: 'badge d' + x.difficulty }, d.icon + ' ' + tr(d))),
        h('h3', {}, tr(x.title)),
        h('div', { class: 'meta' },
          h('span', { class: 'pips', title: t.models_n(ms.length) }, ...ms.slice(0, 8).map(() => h('i', { class: 'pip' })), ms.length === 0 ? h('i', { class: 'pip off' }) : null),
          h('span', {}, t.models_n(ms.length))),
        ratedHere ? h('span', { class: 'done' }, '★ ' + ratedHere + '/' + ms.length) : null);
    }
    const search = h('input', { class: 'search', type: 'search', placeholder: t.search, value: S.filter.q, 'aria-label': t.search,
      oninput: (e) => { S.filter.q = e.target.value; drawGrid(); } });

    app.replaceChildren(
      h('section', { class: 'hero' },
        h('h1', {}, t.app), h('p', {}, t.tagline),
        h('div', { class: 'stats' },
          stat(S.data.tests.length, t.stat_tests), stat(S.manifest.models.length, t.stat_models),
          stat(subs, t.stat_subs), stat(rated, t.stat_rated))),
      h('section', { class: 'filters' }, catRow, diffRow, h('div', { class: 'row' }, search)),
      grid, hint);
    drawChips(); drawGrid();
  }
  const stat = (n, label) => h('div', { class: 'stat' }, h('b', {}, n), h('span', {}, label));

  // ───────────────────────── test page
  const LETTERS = ['A', 'B', 'C', 'D'];
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
    const ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = text; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* ignore */ } ta.remove(); return ok;
  }

  async function viewTest(app, id, q) {
    const t = T();
    const test = testById(id);
    if (!test) { app.replaceChildren(h('div', { class: 'empty' }, 'Unknown test: ' + id)); return; }
    const cat = catById(test.category), d = diffInfo(test.difficulty);
    const avail = modelsFor(id);
    let selected = (q.get('m') ? q.get('m').split(',') : avail.slice(0, 2).map((m) => m.slug)).filter((s) => avail.some((m) => m.slug === s)).slice(0, 4);
    const blindOn = q.get('blind') === '1';

    let promptText = '';
    try {
      const [p, pre] = await Promise.all([getText('tests/prompts/' + id + '.md'), getText('tests/_preamble.md')]);
      promptText = p.trim() + '\n\n' + pre.trim();
    } catch { promptText = '(prompt file missing)'; }

    const setUrl = (sel, blind) => {
      const qs = new URLSearchParams();
      if (sel.length) qs.set('m', sel.join(','));
      if (blind) qs.set('blind', '1');
      history.replaceState(null, '', '#/test/' + id + (qs.toString() ? '?' + qs : ''));
    };

    const copyBtn = h('button', { class: 'btn primary', type: 'button', onclick: async () => {
      if (await copyText(promptText)) { copyBtn.textContent = t.copied; setTimeout(() => (copyBtn.textContent = t.copy), 1600); }
    } }, t.copy);
    const pre = h('pre', { class: 'prompt', tabindex: '0' }, promptText);

    const cmpHost = h('div');
    const chipsHost = h('div', { class: 'mchips' });
    let blind = blindOn;

    function newBlind() {
      S.blind = { order: shuffle(selected), revealed: false, key: selected.slice().sort().join(',') };
    }
    function drawChips() {
      chipsHost.replaceChildren(...avail.map((m) => {
        const on = selected.includes(m.slug);
        return h('button', { class: 'mchip', type: 'button', 'aria-pressed': String(on), disabled: !on && selected.length >= 4,
          onclick: () => {
            selected = on ? selected.filter((s) => s !== m.slug) : [...selected, m.slug];
            setUrl(selected, blind); newBlind(); drawChips(); drawCompare();
          } }, m.name, m.vendor ? h('small', {}, m.vendor) : null);
      }));
    }
    function drawCompare() {
      if (!avail.length) {
        cmpHost.replaceChildren(h('div', { class: 'empty' }, h('p', {}, t.no_models), h('p', { class: 'hint' }, t.no_models_help),
          h('pre', { class: 'prompt cmd' }, 'node scripts/add.mjs "Model name" ' + id + ' output.html')));
        return;
      }
      if (!selected.length) { cmpHost.replaceChildren(h('div', { class: 'empty' }, t.pick_one)); return; }
      let order = selected;
      if (blind) {
        const key = selected.slice().sort().join(',');
        if (S.blind.key !== key || S.blind.order.length !== selected.length) newBlind();
        order = S.blind.order;
      }
      const hidden = blind && !S.blind.revealed;
      const duel = lastDuel(id, selected);
      const bar = blind ? h('div', { class: 'blindbar' },
        h('span', {}, '🕶 ' + t.blind + (S.blind.revealed ? ' · ' + t.revealed : '')),
        !S.blind.revealed ? h('button', { class: 'btn sm', type: 'button', onclick: () => { S.blind.revealed = true; drawCompare(); } }, t.reveal) : null) : null;

      const grid = h('div', { class: 'compare n' + order.length, style: '--n:' + order.length });
      order.forEach((slug, i) => grid.append(cell(slug, i, hidden, duel)));
      cmpHost.replaceChildren(...[bar, grid].filter(Boolean));
    }

    function cell(slug, i, hidden, duel) {
      const m = modelBySlug(slug);
      const src = 'submissions/' + slug + '/' + id + '.html';
      const iframe = h('iframe', { src, title: hidden ? t.model_label(LETTERS[i]) : m.name, loading: 'lazy',
        sandbox: 'allow-scripts allow-pointer-lock allow-modals allow-downloads allow-forms', allow: 'fullscreen; autoplay' });
      const frame = h('div', { class: 'frame' }, iframe);
      const title = hidden ? t.model_label(LETTERS[i]) : m.name;
      const tools = h('div', { class: 'cell-tools' },
        h('button', { class: 'btn sm', type: 'button', title: t.reload, onclick: () => { iframe.src = src; } }, '↻'),
        h('button', { class: 'btn sm', type: 'button', title: t.fullscreen, onclick: () => { (frame.requestFullscreen || frame.webkitRequestFullscreen || (() => {})).call(frame); } }, '⛶'),
        hidden ? null : h('a', { class: 'btn sm', href: src, target: '_blank', rel: 'noopener', title: t.newtab }, '↗'));
      if (blind && !S.blind.revealed && selected.length > 1) {
        tools.prepend(h('button', { class: 'btn sm primary', type: 'button', onclick: () => {
          recordDuel(id, slug, selected); S.blind.revealed = true; drawCompare();
        } }, t.winner));
      }
      const won = duel && duel.winner === slug && !hidden;
      return h('div', { class: 'cell' + (won ? ' won' : ''), 'data-slug': hidden ? '' : slug },
        h('div', { class: 'cell-head' }, h('div', {}, h('b', {}, title), ' ', hidden || !m.vendor ? null : h('small', {}, m.vendor), won ? h('small', {}, ' · ' + t.won) : null), tools),
        frame, ratingBox(slug, test));
    }

    app.replaceChildren(
      h('a', { class: 'crumb', href: '#/' }, (T().dir === 'rtl' ? '→ ' : '← ') + t.back),
      h('div', { class: 'thead' },
        h('h1', {}, tr(test.title)),
        h('span', { class: 'badge' }, cat.icon + ' ' + tr(cat)),
        h('span', { class: 'badge d' + test.difficulty }, d.icon + ' ' + tr(d))),
      h('div', { class: 'cols' },
        h('section', { class: 'panel' }, h('h2', {}, t.prompt), h('p', { class: 'hint' }, t.prompt_hint), pre, h('div', { class: 'row' }, copyBtn)),
        h('section', { class: 'panel' },
          h('h2', {}, t.criteria), h('ul', { class: 'list' }, ...test.criteria.map((c) => h('li', {}, tr(c)))),
          h('h2', {}, t.pitfalls), h('p', { class: 'hint' }, tr(test.pitfalls)))),
      h('div', { class: 'cmp-head' },
        h('h2', {}, t.compare),
        h('label', { class: 'switch', title: t.blind_hint },
          h('input', { type: 'checkbox', checked: blind || null, onchange: (e) => { blind = e.target.checked; newBlind(); setUrl(selected, blind); drawCompare(); } }),
          t.blind + ' ', h('small', { class: 'hint' }, '(' + t.blind_hint + ')')),
        h('button', { class: 'btn sm', type: 'button', onclick: drawCompare }, '↻ ' + t.restart)),
      avail.length ? h('p', { class: 'hint', style: 'margin-block-end:.5rem' }, t.pick_models) : null,
      chipsHost, cmpHost);
    if (blind) newBlind();
    drawChips(); drawCompare();
  }

  // ratings UI
  function ratingBox(slug, test) {
    const t = T();
    const key = ratingKey(slug, test.id);
    const cur = () => S.store.ratings[key] || { s: test.criteria.map(() => 0), n: '' };
    const avg = h('span', { class: 'avg' });
    const note = h('input', { class: 'note', type: 'text', placeholder: t.note, value: cur().n || '', 'aria-label': t.note,
      oninput: (e) => { const r = cur(); r.n = e.target.value; S.store.ratings[key] = r; saveStore(); } });
    const rows = h('div');
    const drawAvg = () => {
      const sc = ratingScore(slug, test.id);
      avg.textContent = sc == null ? '' : t.avg + ' ' + (sc * 5).toFixed(1) + '/5';
    };
    const draw = () => {
      const r = cur();
      rows.replaceChildren(...test.criteria.map((c, i) => h('div', { class: 'rrow' },
        h('span', { class: 't' }, tr(c)),
        h('span', { class: 'dots', role: 'radiogroup', 'aria-label': tr(c) },
          ...[1, 2, 3, 4, 5].map((v) => h('button', { class: 'dot' + (r.s[i] >= v ? ' on' : ''), type: 'button', role: 'radio',
            'aria-checked': String(r.s[i] === v), 'aria-label': v + ' ' + t.stars,
            onclick: () => { const x = cur(); x.s[i] = x.s[i] === v ? 0 : v; S.store.ratings[key] = x; saveStore(); draw(); } }))))));
      drawAvg();
    };
    draw();
    return h('div', { class: 'rate' }, h('div', { class: 'rt' }, h('span', {}, t.rating), avg), rows, note);
  }

  const sameSet = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
  const lastDuel = (id, models) => S.store.duels.find((x) => x.test === id && sameSet(x.models, models));
  function recordDuel(id, winner, models) {
    S.store.duels = S.store.duels.filter((x) => !(x.test === id && sameSet(x.models, models)));
    S.store.duels.push({ test: id, winner, models: models.slice(), ts: Date.now() });
    saveStore();
  }

  // ───────────────────────── leaderboard
  function computeBoard() {
    const rows = S.manifest.models.map((m) => {
      const byCat = {};
      let sum = 0, n = 0;
      for (const id of m.tests) {
        const sc = ratingScore(m.slug, id);
        if (sc == null) continue;
        sum += sc; n++;
        const c = testById(id).category;
        (byCat[c] = byCat[c] || []).push(sc);
      }
      const duels = S.store.duels.filter((x) => x.models.includes(m.slug));
      const wins = duels.filter((x) => x.winner === m.slug).length;
      return { m, score: n ? sum / n : null, n, byCat, duels: duels.length, wins };
    });
    rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || (b.wins / (b.duels || 1)) - (a.wins / (a.duels || 1)) || a.m.name.localeCompare(b.m.name));
    return rows;
  }
  function viewBoard(app) {
    const t = T();
    const rows = computeBoard();
    const anyRating = rows.some((r) => r.score != null || r.duels);
    const msg = h('span', { class: 'toast' });
    const fileIn = h('input', { type: 'file', accept: 'application/json', hidden: true, onchange: async (e) => {
      try {
        const obj = JSON.parse(await e.target.files[0].text());
        if (!obj || typeof obj !== 'object' || typeof obj.ratings !== 'object') throw new Error('bad');
        S.store = { ratings: obj.ratings || {}, duels: Array.isArray(obj.duels) ? obj.duels : [] };
        saveStore(); msg.textContent = t.imported; setTimeout(render, 600);
      } catch { msg.textContent = t.import_bad; msg.style.color = 'var(--bad)'; }
    } });
    const head = h('tr', {}, h('th', {}, t.rank), h('th', {}, t.model), h('th', {}, t.overall), h('th', {}, t.duels), h('th', {}, t.coverage),
      ...S.data.categories.map((c) => h('th', { title: tr(c) }, c.icon + ' ' + tr(c))));
    const pct = (v) => (v == null ? '–' : Math.round(v * 100) + '%');
    const bar = (v) => h('span', { class: 'bar' }, h('i', { style: 'width:' + Math.round((v || 0) * 100) + '%' }));
    const body = rows.map((r, i) => h('tr', {},
      h('td', { class: 'rk' }, r.score == null ? '–' : i + 1),
      h('td', { class: 'mn' }, r.m.name, r.m.vendor ? h('small', {}, r.m.vendor) : null),
      h('td', { class: 'num' }, bar(r.score), r.score == null ? '–' : (r.score * 5).toFixed(2) + '/5'),
      h('td', { class: 'num' }, r.duels ? r.wins + '/' + r.duels + ' (' + Math.round((r.wins / r.duels) * 100) + '%)' : '–'),
      h('td', { class: 'num' }, r.n + '/' + r.m.tests.length),
      ...S.data.categories.map((c) => {
        const a = r.byCat[c.id];
        return h('td', { class: 'num' }, a ? pct(a.reduce((x, y) => x + y, 0) / a.length) : '–');
      })));
    app.replaceChildren(
      h('section', { class: 'hero' }, h('h1', {}, t.board), h('p', {}, t.board_hint)),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => {
          const blob = new Blob([JSON.stringify({ app: 'model-arena', exported: new Date().toISOString(), ...S.store }, null, 2)], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: 'model-arena-ratings.json' }); document.body.append(a); a.click(); a.remove();
        } }, '⭳ ' + t.export),
        h('button', { class: 'btn', type: 'button', onclick: () => fileIn.click() }, '⭱ ' + t.import), fileIn,
        h('button', { class: 'btn', type: 'button', onclick: () => { if (confirm(t.confirm_reset)) { S.store = { ratings: {}, duels: [] }; saveStore(); render(); } } }, t.reset), msg),
      rows.length ? h('div', { class: 'tablewrap' }, h('table', { class: 'board' }, h('thead', {}, head), h('tbody', {}, body))) : h('div', { class: 'empty' }, t.no_models),
      !anyRating && rows.length ? h('p', { class: 'hint', style: 'margin-top:1rem' }, t.no_ratings) : null);
  }

  // ───────────────────────── quick preview
  function cleanHtml(raw) {
    let s = String(raw).replace(/^﻿/, '');
    const fence = s.match(/```(?:html|HTML)?\s*\n([\s\S]*?)\n```/);
    if (fence) s = fence[1];
    const st = s.search(/<!doctype html|<html[\s>]/i);
    if (st > 0) s = s.slice(st);
    const en = s.toLowerCase().lastIndexOf('</html>');
    if (en !== -1) s = s.slice(0, en + 7);
    return s.trim();
  }
  function viewPreview(app, q) {
    const t = T();
    let code = '';
    const testSel = h('select', { 'aria-label': t.test }, ...S.data.tests.map((x) => h('option', { value: x.id }, tr(catById(x.category)) + ' · ' + tr(x.title))));
    if (q.get('t')) testSel.value = q.get('t');
    const nameIn = h('input', { type: 'text', placeholder: 'e.g. GPT-5', 'aria-label': t.model_name });
    const area = h('textarea', { placeholder: t.paste_here, spellcheck: 'false', 'aria-label': t.paste_here });
    const cmpSel = h('select', { 'aria-label': t.compare_with });
    const out = h('div', { class: 'pvout' });
    const howto = h('pre', { class: 'prompt cmd', hidden: true });
    const dl = h('button', { class: 'btn', type: 'button', disabled: true, onclick: () => {
      const blob = new Blob([code], { type: 'text/html' });
      const a = h('a', { href: URL.createObjectURL(blob), download: testSel.value + '.html' }); document.body.append(a); a.click(); a.remove();
    } }, '⭳ ' + t.download);
    const fillCmp = () => {
      const ms = modelsFor(testSel.value);
      cmpSel.replaceChildren(h('option', { value: '' }, t.none), ...ms.map((m) => h('option', { value: m.slug }, m.name)));
      if (ms.length) cmpSel.value = ms[0].slug;
    };
    const frameOf = (title, srcAttr, val) => h('div', { class: 'cell' }, h('div', { class: 'cell-head' }, h('b', {}, title)),
      h('div', { class: 'frame' }, h('iframe', { title, sandbox: 'allow-scripts allow-pointer-lock allow-modals allow-downloads allow-forms', allow: 'fullscreen; autoplay', [srcAttr]: val })),
      h('div'));
    const run = () => {
      code = cleanHtml(area.value);
      if (!code) { out.replaceChildren(h('div', { class: 'empty' }, t.preview_empty)); return; }
      const cells = [frameOf(t.yours + (nameIn.value ? ' · ' + nameIn.value : ''), 'srcdoc', code)];
      if (cmpSel.value) cells.push(frameOf(modelBySlug(cmpSel.value).name, 'src', 'submissions/' + cmpSel.value + '/' + testSel.value + '.html'));
      out.style.setProperty('--n', cells.length);
      out.replaceChildren(...cells);
      dl.disabled = false;
      const slug = (nameIn.value || 'model-name').toLowerCase().trim().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '') || 'model-name';
      howto.hidden = false;
      howto.textContent = t.save_howto + ' submissions/' + slug + '/' + testSel.value + '.html\n' + t.then_run + ':\nnode scripts/add.mjs "' + (nameIn.value || 'Model name') + '" ' + testSel.value + ' ' + testSel.value + '.html';
    };
    testSel.addEventListener('change', () => { fillCmp(); if (code) run(); });
    cmpSel.addEventListener('change', () => { if (code) run(); });
    fillCmp();
    out.replaceChildren(h('div', { class: 'empty' }, t.preview_empty));

    app.replaceChildren(
      h('section', { class: 'hero' }, h('h1', {}, t.preview), h('p', {}, t.preview_hint)),
      h('div', { class: 'pv' },
        h('section', { class: 'panel' },
          h('label', { class: 'fld' }, t.test, testSel),
          h('label', { class: 'fld' }, t.model_name, nameIn),
          h('label', { class: 'fld' }, t.compare_with, cmpSel),
          area,
          h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: run }, '▶ ' + t.run), dl),
          howto),
        out));
  }

  // ───────────────────────── boot
  function boot() {
    applyChrome();
    $('#langBtn').addEventListener('click', () => { S.lang = S.lang === 'ar' ? 'en' : 'ar'; safeSet('arena.lang', S.lang); applyChrome(); render(); });
    $('#themeBtn').addEventListener('click', () => {
      const dark = S.theme ? S.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      S.theme = dark ? 'light' : 'dark'; safeSet('arena.theme', S.theme); applyChrome();
    });
    window.addEventListener('hashchange', render);
    load().then(render).catch((err) => {
      const t = T();
      $('#app').replaceChildren(h('div', { class: 'errbox' }, h('b', {}, t.load_fail), h('p', {}, location.protocol === 'file:' ? t.need_server : String(err)),
        location.protocol === 'file:' ? h('pre', { class: 'prompt cmd' }, 'node scripts/serve.mjs') : null));
    });
  }
  boot();
})();
