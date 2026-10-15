/* PIANO — общий скрипт сайта. Без зависимостей. */
(function () {
  'use strict';
  var D = window.PIANO;

  /* ---------- Утилиты ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function plural(n, a, b, c) { var m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); }
  function weeks(n) { return n + ' ' + plural(n, 'неделя', 'недели', 'недель'); }
  function lowerFirst(s) { return /^[А-ЯЁA-Z][А-ЯЁA-Z-]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); }

  var IMG = {
    model: function (n) { return 'img/model-' + n + '.jpg'; },
    cover: function (slug) { return 'img/cover-' + slug + '.jpg'; },
    mat: function (slug) { return 'img/material-' + slug + '.jpg'; }
  };
  var ICON = {
    heart: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.5s-6.5-3.9-6.5-8.4A3.4 3.4 0 0 1 10 5.9a3.4 3.4 0 0 1 6.5 2.2c0 4.5-6.5 8.4-6.5 8.4z"/></svg>',
    down: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v9M4 7l4 4 4-4M3 14h10"/></svg>',
    close: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12"/></svg>',
    grid: '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="1" y="1" width="5" height="5"/><rect x="8" y="1" width="5" height="5"/><rect x="1" y="8" width="5" height="5"/><rect x="8" y="8" width="5" height="5"/></svg>',
    list: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 3h12M1 7h12M1 11h12"/></svg>'
  };

  /* ---------- Данные ---------- */
  var byDir = {}, byCol = {}, byModel = {}, byMat = {};
  D.directions.forEach(function (d) { byDir[d.slug] = d; });
  D.collections.forEach(function (c) { byCol[c.slug] = c; });
  D.models.forEach(function (m) { byModel[m.n] = m; });
  D.materials.forEach(function (m, i) { m.code = 'M' + String(i + 1).padStart(2, '0'); byMat[m.slug] = m; });
  function modelsOf(c) { return D.models.filter(function (m) { return m.c === c; }); }
  function colsOf(d) { return D.collections.filter(function (c) { return c.dir === d; }); }
  function modelsOfDir(d) { return D.models.filter(function (m) { return byCol[m.c].dir === d; }); }
  function fullName(m) { return byCol[m.c].name + ', ' + lowerFirst(m.name); }
  function matsText(m) { return m.mats.map(function (s) { return byMat[s].name; }).join(', '); }
  function colsWithMat(slug) { return D.collections.filter(function (c) { return c.materials.indexOf(slug) !== -1 || modelsOf(c.slug).some(function (m) { return m.mats.indexOf(slug) !== -1; }); }); }

  /* ---------- Избранное ---------- */
  var FKEY = 'piano:favs';
  var favs = {
    list: function () { try { return JSON.parse(localStorage.getItem(FKEY)) || []; } catch (e) { return []; } },
    save: function (l) { try { localStorage.setItem(FKEY, JSON.stringify(l)); } catch (e) {} favs.paint(); },
    has: function (id) { return favs.list().indexOf(id) !== -1; },
    toggle: function (id) { var l = favs.list(), i = l.indexOf(id); if (i === -1) l.push(id); else l.splice(i, 1); favs.save(l); return i === -1; },
    paint: function () {
      var n = favs.list().length;
      $$('[data-fav-count]').forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
      $$('[data-fav-id]').forEach(function (b) {
        var on = favs.has(b.getAttribute('data-fav-id'));
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        var nm = b.getAttribute('data-fav-name') || '';
        b.setAttribute('aria-label', (on ? 'Убрать из избранного' : 'Добавить в избранное') + (nm ? ': ' + nm : ''));
        var t = $('[data-fav-text]', b); if (t) t.textContent = on ? 'В избранном' : 'В избранное';
      });
    }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav-id]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    favs.toggle(b.getAttribute('data-fav-id'));
  });
  function favBtn(id, name) { return '<button type="button" class="fav-btn" data-fav-id="' + esc(id) + '" data-fav-name="' + esc(name) + '" aria-pressed="false" aria-label="Добавить в избранное: ' + esc(name) + '">' + ICON.heart + '</button>'; }

  /* ---------- Карточки ---------- */
  function cardCollection(c, ratio) {
    var n = modelsOf(c.slug).length;
    return '<a class="card reveal" href="collection.html?c=' + c.slug + '">' +
      '<div class="photo ' + (ratio || 'r45') + '"><img src="' + IMG.cover(c.slug) + '" alt="Коллекция ' + esc(c.name) + '" loading="lazy"></div>' +
      '<div class="card__meta"><h3 class="h3">' + esc(c.name) + '</h3><span class="label muted">' + n + ' ' + plural(n, 'модель', 'модели', 'моделей') + '</span></div>' +
      '<p class="caption" style="margin-top:4px">' + esc(c.mats) + '</p></a>';
  }
  function cardModel(m) {
    var nm = fullName(m);
    return '<div class="mcard reveal"><a class="card" href="model.html?n=' + m.n + '">' +
      '<span class="label card__num">N°' + m.n + '</span>' +
      '<div class="photo r32"><img src="' + IMG.model(m.n) + '" alt="' + esc(nm) + '" loading="lazy"></div>' +
      '<div class="card__row"><span>' + esc(nm) + '</span><span class="caption" style="line-height:26px;white-space:nowrap">' + weeks(m.weeks) + '</span></div>' +
      '<p class="caption" style="margin-top:2px">' + esc(matsText(m)) + '</p></a>' +
      '<div style="position:absolute;top:24px;right:0">' + favBtn('m' + m.n, nm) + '</div></div>';
  }
  function cardRelated(c) {
    return '<a class="card reveal" href="collection.html?c=' + c.slug + '"><div class="photo r45"><img src="' + IMG.cover(c.slug) + '" alt="' + esc(c.name) + '" loading="lazy"></div>' +
      '<div class="card__meta"><h3 class="h3">' + esc(c.name) + '</h3><span class="label muted">' + esc(byDir[c.dir].name) + '</span></div></a>';
  }
  function related(c, k) {
    var same = D.collections.filter(function (x) { return x.family === c.family && x.dir !== c.dir; });
    var rest = D.collections.filter(function (x) { return x.dir !== c.dir && same.indexOf(x) === -1; });
    var seen = {}, out = [];
    same.concat(rest).forEach(function (x) { if (!seen[x.dir] && out.length < k) { seen[x.dir] = 1; out.push(x); } });
    return out;
  }
  function secHead(label, title, link) {
    return '<div class="sec-head"><span class="label">' + esc(label) + '</span><h2 class="h2">' + esc(title) + '</h2>' + (link || '') + '</div>';
  }

  /* ---------- Раздел направления ---------- */
  function pageCatalog(root) {
    var d = byDir[param('d')] || byDir.kitchens;
    var cols = colsOf(d.slug), all = modelsOfDir(d.slug);
    var groups = Object.keys(D.materialGroups).filter(function (g) { return all.some(function (m) { return m.mats.some(function (s) { return byMat[s].g === g; }); }); });
    var st = { c: param('c') || 'all', g: param('g') || 'all', v: param('view') === 'list' ? 'list' : 'grid' };
    document.title = d.name + ' — PIANO';

    root.innerHTML =
      '<div class="wrap"><p class="label crumbs"><a href="index.html">Главная</a> / <a href="catalog.html">Каталог</a> / <span aria-current="page">' + esc(d.name) + '</span></p>' +
      '<div class="g12" style="align-items:end;padding:64px 0 40px"><h1 class="display" style="grid-column:1/7">' + esc(d.name) + '</h1>' +
      '<div style="grid-column:8/13"><p class="lead">' + esc(d.intro) + '</p><p class="label muted" style="margin-top:24px">' + cols.length + ' ' + plural(cols.length, 'коллекция', 'коллекции', 'коллекций') + ' · ' + all.length + ' ' + plural(all.length, 'модель', 'модели', 'моделей') + '</p></div></div>' +
      '<nav class="chips" aria-label="Направления" style="padding-bottom:64px">' + D.directions.map(function (x) { return '<a class="chip" style="display:inline-flex;align-items:center;text-decoration:none' + (x === d ? ';background:var(--ink);border-color:var(--ink);color:var(--surface)" aria-current="page"' : '"') + ' href="catalog.html?d=' + x.slug + '">' + esc(x.name) + '</a>'; }).join('') + '</nav>' +
      '<div class="cols5 hide-sm" style="grid-template-columns:repeat(' + Math.max(cols.length, 3) + ',minmax(0,1fr));padding-bottom:96px">' + cols.map(function (c) { return cardCollection(c, 'r43'); }).join('') + '</div>' +
      '<div class="filters"><div class="filters__group"><span class="label">Коллекция</span><div class="chips" role="group" aria-label="Коллекция" data-f="c"></div></div>' +
      '<div class="filters__row"><div class="filters__group"><span class="label">Материал</span><div class="chips" role="group" aria-label="Материал" data-f="g"></div></div>' +
      '<div style="display:flex;align-items:center;gap:16px"><span class="label muted" data-count></span><div class="seg" role="group" aria-label="Вид каталога"><button type="button" data-v="grid">' + ICON.grid + 'Сетка</button><button type="button" data-v="list">' + ICON.list + 'Список</button></div></div></div></div>' +
      '<div data-results style="padding:56px 0 var(--sec)" aria-live="polite"></div></div>';

    var cBox = $('[data-f="c"]', root), gBox = $('[data-f="g"]', root), res = $('[data-results]', root);
    cBox.innerHTML = [['all', 'Все']].concat(cols.map(function (c) { return [c.slug, c.name]; })).map(function (x) { return '<button type="button" class="chip" data-val="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('');
    gBox.innerHTML = [['all', 'Все']].concat(groups.map(function (g) { return [g, D.materialGroups[g]]; })).map(function (x) { return '<button type="button" class="chip" data-val="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('');

    function render() {
      $$('button', cBox).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.val === st.c ? 'true' : 'false'); });
      $$('button', gBox).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.val === st.g ? 'true' : 'false'); });
      $$('[data-v]', root).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === st.v ? 'true' : 'false'); });
      var items = all.filter(function (m) { return (st.c === 'all' || m.c === st.c) && (st.g === 'all' || m.mats.some(function (s) { return byMat[s].g === st.g; })); });
      $('[data-count]', root).textContent = items.length + ' ' + plural(items.length, 'модель', 'модели', 'моделей');
      if (!items.length) {
        res.innerHTML = '<div class="empty"><p class="lead">Под такой набор моделей нет.</p><button type="button" class="chip" data-reset>Сбросить фильтры</button></div>';
      } else if (st.v === 'list') {
        res.innerHTML = '<div class="ilist"><div class="irow ihead"><span class="label muted">N°</span><span class="label muted">Модель</span><span class="label muted">Материалы</span><span class="label muted">Срок</span></div>' +
          items.map(function (m) { return '<a class="irow" href="model.html?n=' + m.n + '"><span class="label muted">N°' + m.n + '</span><span class="irow__nm">' + esc(fullName(m)) + '</span><span class="caption">' + esc(matsText(m)) + '</span><span class="caption">' + weeks(m.weeks) + '</span><span class="irow__pv" aria-hidden="true"><img src="' + IMG.model(m.n) + '" alt="" loading="lazy"></span></a>'; }).join('') + '</div>';
      } else {
        res.innerHTML = '<div class="cols3">' + items.map(cardModel).join('') + '</div>';
      }
      var u = new URL(location.href);
      u.searchParams.set('d', d.slug);
      ['c', 'g'].forEach(function (k) { if (st[k] === 'all') u.searchParams.delete(k); else u.searchParams.set(k, st[k]); });
      if (st.v === 'list') u.searchParams.set('view', 'list'); else u.searchParams.delete('view');
      history.replaceState(null, '', u);
      favs.paint(); reveal();
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.parentNode === cBox) st.c = b.dataset.val;
      else if (b.parentNode === gBox) st.g = b.dataset.val;
      else if (b.dataset.v) st.v = b.dataset.v;
      else if (b.hasAttribute('data-reset')) { st.c = 'all'; st.g = 'all'; }
      else return;
      render();
    });
    render();
  }

  /* ---------- Коллекция ---------- */
  function pageCollection(root) {
    var c = byCol[param('c')] || byCol.rebro;
    var d = byDir[c.dir], f = D.factories[c.factory], ms = modelsOf(c.slug);
    var sib = colsOf(c.dir), i = sib.indexOf(c), next = sib.length > 1 ? sib[(i + 1) % sib.length] : D.collections[(D.collections.indexOf(c) + 1) % D.collections.length];
    var minW = Math.min.apply(null, ms.map(function (m) { return m.weeks; })), maxW = Math.max.apply(null, ms.map(function (m) { return m.weeks; }));
    document.title = 'Коллекция «' + c.name + '» — PIANO';
    $('[data-hero-img]').src = IMG.model(ms[ms.length - 1].n);
    $('[data-hero-img]').alt = fullName(ms[ms.length - 1]);
    $('[data-hero-list]').innerHTML = '<p class="label" style="margin-bottom:12px;color:rgba(244,241,236,.72)">' + esc(d.name) + '</p>' + sib.map(function (x) { return '<a href="collection.html?c=' + x.slug + '"' + (x === c ? ' aria-current="page"' : '') + '>' + esc(x.name) + '</a>'; }).join('');
    $('[data-hero-desc]').textContent = c.desc;
    $('[data-hero-title]').innerHTML = esc(c.name) + '<sup>(' + ms.length + ')</sup>';
    $('[data-hero-meta]').innerHTML = '<span class="label">' + esc(f.name) + ' · ' + esc(f.place.split(', ')[1] || f.place) + '</span><span class="label" style="opacity:.8">' + esc(c.mats) + '</span>';

    root.innerHTML =
      '<section class="sec"><div class="wrap g12"><span class="label muted" style="grid-column:1/4">О коллекции</span><p class="quote" style="grid-column:4/10">' + esc(c.story) + '</p>' +
      '<dl class="facts" style="grid-column:10/13"><div><dt class="label muted">Фабрика</dt><dd>' + esc(f.name) + ', ' + esc(f.place.split(',')[0]) + ', с ' + f.since + ' года</dd></div><div><dt class="label muted">Срок</dt><dd>' + (minW === maxW ? weeks(minW) : minW + '–' + maxW + ' недель') + '</dd></div><div><dt class="label muted">Направление</dt><dd><a href="catalog.html?d=' + d.slug + '">' + esc(d.name) + '</a></dd></div></dl></div></section>' +
      '<section class="sec sec--top0"><div class="wrap">' + secHead('Модели', ms.length === 2 ? 'Две модели коллекции' : 'Модели коллекции', '<a class="tlink" href="catalog.html?d=' + d.slug + '">' + esc(d.name) + ' →</a>') + '<div class="cols3">' + ms.map(cardModel).join('') + '</div></div></section>' +
      '<section class="sec sec--raised"><div class="wrap">' + secHead('Материалы', 'Из чего собрана «' + c.name + '»', '<a class="tlink" href="materials.html">Библиотека →</a>') +
      '<div class="cols4">' + c.materials.map(function (s) { var m = byMat[s]; return '<a class="sw reveal" href="materials.html?m=' + s + '"><span class="sw__img"><img src="' + IMG.mat(s) + '" alt="" loading="lazy"></span><span class="sw__nm" style="font-size:16px;line-height:26px;margin-top:16px">' + esc(m.name) + '</span><span class="sw__tp">' + esc(m.finish) + '</span></a>'; }).join('') + '</div></div></section>' +
      '<section class="sec"><div class="wrap">' + secHead('Сочетается с', 'Тот же язык материалов в других комнатах') + '<div class="cols3">' + related(c, 3).map(cardRelated).join('') + '</div>' +
      '<a class="next" style="margin-top:120px" href="collection.html?c=' + next.slug + '"><span><span class="label muted">Следующая коллекция</span><span class="display" style="display:block;font-size:64px;line-height:64px;margin-top:12px">' + esc(next.name) + ' →</span></span><span class="photo r32 hide-sm" style="width:320px;flex:none"><img src="' + IMG.cover(next.slug) + '" alt="" loading="lazy"></span></a></div></section>';
    favs.paint(); reveal();
  }

  /* ---------- Модель ---------- */
  function pageModel(root) {
    var m = byModel[param('n')] || byModel['001'];
    var c = byCol[m.c], d = byDir[c.dir], f = D.factories[c.factory], nm = fullName(m);
    var sib = modelsOf(c.slug), others = sib.filter(function (x) { return x !== m; });
    var idx = D.models.indexOf(m), next = D.models[(idx + 1) % D.models.length];
    var gallery = [{ src: IMG.model(m.n), alt: nm }, { src: IMG.cover(c.slug), alt: 'Коллекция ' + c.name }].concat(others.slice(0, 1).map(function (o) { return { src: IMG.model(o.n), alt: fullName(o) }; }));
    document.title = 'N°' + m.n + ' ' + nm + ' — PIANO';

    var specs = m.specs.map(function (s) { var p = s.match(/^(.+?)\s(\d.*|до .*|от .*)$/); return p ? [p[1], p[2]] : ['Особенность', s]; });
    specs.push(['Материалы', matsText(m)], ['Фабрика', f.name + ', ' + f.place], ['Срок', weeks(m.weeks) + ' от утверждения проекта']);

    root.innerHTML =
      '<div class="wrap"><p class="label crumbs" style="padding-bottom:40px"><a href="catalog.html">Каталог</a> / <a href="catalog.html?d=' + d.slug + '">' + esc(d.name) + '</a> / <a href="collection.html?c=' + c.slug + '">' + esc(c.name) + '</a> / <span aria-current="page">N°' + m.n + '</span></p>' +
      '<div class="pdp"><div class="pdp__gal"><div class="photo r32"><img data-main src="' + gallery[0].src + '" alt="' + esc(gallery[0].alt) + '"></div><div class="thumbs" role="group" aria-label="Фотографии">' +
      gallery.map(function (g, i) { return '<button type="button" class="thumb" data-g="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="' + esc(g.alt) + '"><img src="' + g.src + '" alt=""></button>'; }).join('') + '</div></div>' +
      '<div class="pdp__info"><p class="label muted">N°' + m.n + ' · Коллекция «' + esc(c.name) + '»</p><h1 class="h1" style="font-size:48px;line-height:54px;margin-top:16px">' + esc(nm) + '</h1><p style="margin-top:24px">' + esc(m.desc) + '</p>' +
      '<div style="margin-top:40px;padding-top:16px;border-top:1px solid var(--line)"><p class="label muted">Отделка: <span style="color:var(--ink)" data-mat-label>' + esc(byMat[m.mats[0]].name) + '</span></p><div class="sw-row" role="group" aria-label="Отделка">' +
      m.mats.map(function (s, i) { var x = byMat[s]; return '<button type="button" class="sw" data-mat="' + s + '" aria-pressed="' + (i === 0) + '"><span class="sw__img"><img src="' + IMG.mat(s) + '" alt=""></span><span class="sw__nm">' + esc(x.name) + '</span></button>'; }).join('') + '</div></div>' +
      '<div style="margin-top:40px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px"><a class="btn" href="contacts.html?model=' + m.n + '#form">Рассчитать проект</a><button type="button" class="btn btn--outline" data-fav-id="m' + m.n + '" data-fav-name="' + esc(nm) + '" aria-pressed="false" aria-label="Добавить в избранное">' + ICON.heart + '</button></div>' +
      '<div class="caption" style="margin-top:16px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><span>Стоимость рассчитываем после замера</span><span>Срок — ' + weeks(m.weeks) + '</span></div></div></div></div>' +
      '<section class="sec" style="padding-bottom:0"><div class="wrap spec"><div style="grid-column:1/4"><span class="label muted">Характеристики</span></div><dl style="grid-column:4/9">' +
      specs.map(function (s) { return '<div class="srow"><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<div style="grid-column:10/13"><p class="label muted" style="margin-bottom:12px">Для дизайнеров</p><a class="dl" href="designers.html#files">Спецификация, PDF ' + ICON.down + '</a><a class="dl" href="designers.html#files">3D-модель, 3ds Max ' + ICON.down + '</a><a class="dl" href="designers.html#files">3D-модель, SketchUp ' + ICON.down + '</a></div></div></section>' +
      '<section class="sec" style="padding-bottom:0"><div class="wrap">' + secHead('Сочетается с', 'Тот же язык материалов в других комнатах', '<a class="tlink" href="index.html#interior">Цельный интерьер →</a>') + '<div class="cols3">' + related(c, 3).map(cardRelated).join('') + '</div></div></section>' +
      '<section class="sec"><div class="wrap">' + secHead('Коллекция «' + c.name + '»', others.length ? 'Другие модели коллекции' : 'Коллекция', '<a class="tlink" href="collection.html?c=' + c.slug + '">Вся коллекция →</a>') +
      '<div class="cols3">' + others.map(cardModel).join('') +
      '<div class="reveal" style="display:flex;flex-direction:column;justify-content:space-between;gap:24px;padding:24px;background:var(--surface-raised);min-height:280px"><p class="label muted">Не нашли нужную форму?</p><div><p class="lead" style="margin-bottom:24px">Любую модель соберём под размеры вашего помещения.</p><a class="tlink" href="contacts.html#form">Обсудить с дизайнером →</a></div></div></div>' +
      '<a class="next" style="margin-top:96px" href="model.html?n=' + next.n + '"><span class="label muted">Следующая модель</span><span class="next__t">N°' + next.n + ' ' + esc(fullName(next)) + ' →</span></a></div></section>' +
      '<div class="sticky-cta"><a class="btn btn--block" href="contacts.html?model=' + m.n + '#form">Записаться на замер</a></div>';

    root.addEventListener('click', function (e) {
      var t = e.target.closest('.thumb');
      if (t) { var g = gallery[+t.dataset.g]; var im = $('[data-main]', root); im.src = g.src; im.alt = g.alt; $$('.thumb', root).forEach(function (b) { b.setAttribute('aria-pressed', b === t ? 'true' : 'false'); }); return; }
      var s = e.target.closest('[data-mat]');
      if (s) { $$('[data-mat]', root).forEach(function (b) { b.setAttribute('aria-pressed', b === s ? 'true' : 'false'); }); var x = byMat[s.dataset.mat]; $('[data-mat-label]', root).textContent = x.name + ' — ' + x.finish.toLowerCase(); }
    });
    favs.paint(); reveal();
  }

  /* ---------- Материалы ---------- */
  function pageMaterials(root) {
    var st = { g: param('g') || 'all', sel: byMat[param('m')] ? param('m') : 'travertine' };
    root.innerHTML =
      '<div class="filters" style="flex-direction:row;justify-content:space-between;align-items:center;flex-wrap:wrap"><div class="chips" role="group" aria-label="Группа материалов" data-groups></div><span class="label muted" data-count></span></div>' +
      '<div class="lib" style="padding:56px 0 var(--sec)"><div class="lib__grid" data-grid></div><aside class="lib__detail" data-detail aria-live="polite"></aside></div>';
    var gb = $('[data-groups]', root);
    gb.innerHTML = [['all', 'Все']].concat(Object.keys(D.materialGroups).map(function (g) { return [g, D.materialGroups[g]]; })).map(function (x) { return '<button type="button" class="chip" data-val="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('');
    function detail() {
      var m = byMat[st.sel], cs = colsWithMat(m.slug);
      $('[data-detail]', root).innerHTML = '<div class="photo r43"><img src="' + IMG.mat(m.slug) + '" alt="' + esc(m.name) + '"></div>' +
        '<p class="label muted" style="margin-top:24px">' + esc(D.materialGroups[m.g]) + ' · ' + m.code + '</p><h2 class="h2" style="margin-top:8px">' + esc(m.name) + '</h2>' +
        '<dl style="margin-top:24px"><div class="drow"><dt class="label">Отделка</dt><dd>' + esc(m.finish) + '</dd></div><div class="drow"><dt class="label">Происхождение</dt><dd>' + esc(m.origin) + '</dd></div><div class="drow"><dt class="label">Уход</dt><dd>' + esc(m.care) + '</dd></div>' +
        '<div class="drow"><dt class="label">Где есть</dt><dd><div class="tags">' + cs.map(function (c) { return '<a href="collection.html?c=' + c.slug + '">' + esc(c.name) + '</a>'; }).join('') + '</div></dd></div></dl>' +
        '<div style="margin-top:24px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px"><a class="btn" href="contacts.html?sample=' + m.slug + '#form">Заказать образец</a><button type="button" class="btn btn--outline" data-fav-id="mat:' + m.slug + '" data-fav-name="' + esc(m.name) + '" aria-pressed="false"><span data-fav-text>В избранное</span></button></div>';
    }
    function render() {
      $$('button', gb).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.val === st.g ? 'true' : 'false'); });
      var list = D.materials.filter(function (m) { return st.g === 'all' || m.g === st.g; });
      $('[data-count]', root).textContent = list.length + ' ' + plural(list.length, 'материал', 'материала', 'материалов');
      $('[data-grid]', root).innerHTML = list.map(function (m) { return '<button type="button" class="sw" data-m="' + m.slug + '" aria-pressed="' + (m.slug === st.sel) + '"><span class="sw__img"><img src="' + IMG.mat(m.slug) + '" alt="" loading="lazy"></span><span class="sw__nm">' + esc(m.name) + '</span><span class="sw__tp">' + esc(m.finish) + '</span></button>'; }).join('');
      detail(); favs.paint();
      var u = new URL(location.href); u.searchParams.set('m', st.sel); if (st.g === 'all') u.searchParams.delete('g'); else u.searchParams.set('g', st.g); history.replaceState(null, '', u);
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.parentNode === gb) { st.g = b.dataset.val; render(); }
      else if (b.dataset.m) { st.sel = b.dataset.m; render(); if (window.innerWidth <= 1024) $('[data-detail]', root).scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    render();
  }

  /* ---------- Избранное ---------- */
  var SAMPLE = ['m001', 'mat:oak-fluted', 'm032', 'm007', 'mat:travertine', 'm016', 'mat:bronze'];
  function pageFavorites(root) {
    var imp = param('list');
    if (imp) { var l = favs.list(); imp.split(',').forEach(function (id) { if (id && l.indexOf(id) === -1) l.push(id); }); favs.save(l); history.replaceState(null, '', 'favorites.html'); }
    function render() {
      var ids = favs.list().filter(function (id) { return id.indexOf('mat:') === 0 ? byMat[id.slice(4)] : byModel[id.slice(1)]; });
      var nm = ids.filter(function (id) { return id.charAt(0) === 'm' && id.indexOf('mat:') !== 0; }).length, nt = ids.length - nm;
      $('[data-fav-summary]').textContent = nm + ' ' + plural(nm, 'модель', 'модели', 'моделей') + ' · ' + nt + ' ' + plural(nt, 'материал', 'материала', 'материалов');
      if (!ids.length) {
        root.innerHTML = '<div class="g12" style="padding:96px 0;border-top:1px solid var(--line)"><p class="quote" style="grid-column:1/8">Здесь появятся модели и материалы, которые вы отметите сердцем.</p><div style="grid-column:9/13;display:flex;flex-direction:column;align-items:flex-start;gap:16px"><a class="btn" href="catalog.html">Перейти в каталог</a><button type="button" class="btn btn--outline" data-sample>Показать пример подборки</button></div></div>';
        return;
      }
      var tiles = ids.map(function (id) {
        var isMat = id.indexOf('mat:') === 0, o = isMat ? byMat[id.slice(4)] : byModel[id.slice(1)];
        var name = isMat ? o.name : fullName(o), kind = isMat ? 'Материал · ' + o.code : 'Модель N°' + o.n;
        var href = isMat ? 'materials.html?m=' + o.slug : 'model.html?n=' + o.n, src = isMat ? IMG.mat(o.slug) : IMG.model(o.n);
        return '<div class="tile ' + (isMat ? 's2' : 's4') + '"><a class="card" href="' + href + '"><div class="photo ' + (isMat ? 'r11' : 'r32') + '"><img src="' + src + '" alt="' + esc(name) + '" loading="lazy"></div><p class="label muted" style="margin-top:14px">' + esc(kind) + '</p><p style="margin-top:4px">' + esc(name) + '</p></a>' +
          '<button type="button" class="rm" data-rm="' + esc(id) + '" aria-label="Убрать из избранного: ' + esc(name) + '">' + ICON.close + '</button></div>';
      }).join('');
      root.innerHTML = '<div class="favl"><div class="board">' + tiles + '</div>' +
        '<aside class="panel" aria-label="Отправить подборку"><p class="label muted">Подборка</p><h2 class="h3" style="font-size:32px;line-height:40px;font-weight:300;margin-top:12px">Отправить дизайнеру студии</h2><p class="muted" style="margin-top:16px">Дизайнер посмотрит подборку и перезвонит с идеями, как собрать это в одном интерьере.</p>' +
        '<form data-demo="favorites" novalidate style="margin-top:32px;display:flex;flex-direction:column;gap:32px"><input type="hidden" name="list" value="' + esc(ids.join(',')) + '">' +
        '<label class="field"><span class="label">Имя</span><input name="name" required autocomplete="name" placeholder="Как к вам обращаться"><span class="field__hint" hidden></span></label>' +
        '<label class="field"><span class="label">Телефон</span><input name="phone" type="tel" required autocomplete="tel" placeholder="+7"><span class="field__hint" hidden></span></label>' +
        '<label class="field"><span class="label">Комментарий</span><textarea name="comment" rows="2" placeholder="Например: квартира 120 м², черновая отделка"></textarea></label>' +
        '<div style="display:grid;gap:12px"><button type="submit" class="btn">Отправить подборку</button><button type="button" class="btn btn--outline" data-copy>Скопировать ссылку</button></div></form>' +
        '<p class="caption" style="margin-top:16px">Подборка хранится в этом браузере. По ссылке её можно открыть на другом устройстве.</p></aside></div>';
    }
    root.addEventListener('click', function (e) {
      var rm = e.target.closest('[data-rm]');
      if (rm) { var l = favs.list(), i = l.indexOf(rm.dataset.rm); if (i !== -1) l.splice(i, 1); favs.save(l); render(); return; }
      if (e.target.closest('[data-sample]')) { favs.save(SAMPLE.slice()); render(); return; }
      var cp = e.target.closest('[data-copy]');
      if (cp) {
        var url = location.href.split('?')[0] + '?list=' + favs.list().join(',');
        var done = function () { cp.textContent = 'Ссылка скопирована'; cp.classList.add('is-on'); };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else done();
      }
    });
    render();
  }

  /* ---------- Запись в шоурум ---------- */
  function pageBooking(root) {
    var WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'], WDacc = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
    var MON = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    var MONnom = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    var days = [], t = new Date(); t.setHours(0, 0, 0, 0);
    for (var i = 1; days.length < 10; i++) { var x = new Date(t); x.setDate(t.getDate() + i); if (x.getDay() !== 0) days.push(x); }
    var st = { d: 0, s: -1, goal: 0 };
    var GOALS = ['Кухня', 'Мебель', 'Лестница', 'Двери и окна', 'Всё сразу'];
    function times(dt) { return dt.getDay() === 6 ? ['12:00', '13:30', '15:00', '16:30'] : ['11:00', '12:30', '14:00', '15:30', '17:00', '18:30']; }
    function busy(dt, i) { return (dt.getDate() * 3 + i) % 5 === 0; }
    var months = days.map(function (d) { return MONnom[d.getMonth()]; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' — ');
    $('[data-month]', root).textContent = months;
    $('[data-days]', root).innerHTML = days.map(function (d, i) { return '<button type="button" class="day" data-d="' + i + '"><span class="day__w">' + WD[d.getDay()] + '</span><span class="day__n">' + d.getDate() + '</span></button>'; }).join('');
    $('[data-goals]', root).innerHTML = GOALS.map(function (g, i) { return '<button type="button" class="chip" data-goal="' + i + '">' + g + '</button>'; }).join('');
    function when() { var d = days[st.d], tt = times(d); return 'в ' + WDacc[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()] + (st.s >= 0 ? ', в ' + tt[st.s] : ''); }
    function render() {
      var d = days[st.d], tt = times(d);
      $$('[data-d]', root).forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.d === st.d ? 'true' : 'false'); });
      $$('[data-goal]', root).forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.goal === st.goal ? 'true' : 'false'); });
      $('[data-day-label]', root).textContent = WD[d.getDay()] + ', ' + d.getDate() + ' ' + MON[d.getMonth()];
      $('[data-slots]', root).innerHTML = tt.map(function (s, i) { var b = busy(d, i); return '<button type="button" class="slot" data-s="' + i + '"' + (b ? ' disabled aria-label="' + s + ', занято"' : '') + ' aria-pressed="' + (i === st.s) + '">' + s + '</button>'; }).join('');
      $('[data-summary]', root).textContent = st.s >= 0 ? 'Визит ' + when() + ' · ' + GOALS[st.goal].toLowerCase() : 'Выберите свободное время';
      $('[data-book]', root).disabled = st.s < 0;
      $('input[name="when"]', root).value = st.s >= 0 ? when() : '';
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.d) { st.d = +b.dataset.d; st.s = -1; render(); }
      else if (b.dataset.s && !b.disabled) { st.s = +b.dataset.s; render(); }
      else if (b.dataset.goal) { st.goal = +b.dataset.goal; render(); }
      else if (b.hasAttribute('data-again')) { $('[data-booking]', root).hidden = false; $('[data-done]', root).hidden = true; }
    });
    $('form', root).addEventListener('piano:valid', function (e) {
      e.preventDefault();
      $('[data-when]', root).textContent = when();
      $('[data-booking]', root).hidden = true; $('[data-done]', root).hidden = false;
      $('[data-done]', root).focus();
    });
    render();
  }

  /* ---------- Формы: проверка в демо-режиме ---------- */
  function validate(form) {
    var ok = true;
    $$('input[required], select[required]', form).forEach(function (inp) {
      var f = inp.closest('.field'), h = f && $('.field__hint', f), msg = '';
      var v = inp.value.trim();
      if (!v) msg = 'Заполните это поле, чтобы мы могли связаться';
      else if (inp.type === 'tel' && v.replace(/\D/g, '').length < 11) msg = 'Проверьте номер — не хватает цифр';
      else if (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(v)) msg = 'Проверьте адрес почты';
      if (f) f.classList.toggle('is-error', !!msg);
      inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (h) { h.textContent = msg; h.hidden = !msg; }
      if (msg && ok) { ok = false; inp.focus(); }
    });
    return ok;
  }
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-demo]'); if (!form) return;
    e.preventDefault();
    if (!validate(form)) return;
    var ev = new CustomEvent('piano:valid', { cancelable: true });
    if (form.dispatchEvent(ev)) location.href = 'thanks.html?from=' + encodeURIComponent(form.getAttribute('data-demo'));
  });
  document.addEventListener('blur', function (e) {
    var inp = e.target; if (!inp.matches || !inp.matches('.is-error input')) return;
    var f = inp.closest('form[data-demo]'); if (f) validate(f);
  }, true);

  /* Подставить модель или образец в форму контактов */
  function prefill() {
    var f = $('form[data-demo="contacts"]'); if (!f) return;
    var n = param('model'), s = param('sample'), c = $('[name="comment"]', f);
    if (n && byModel[n] && c) c.value = 'Интересует N°' + n + ' ' + fullName(byModel[n]);
    if (s && byMat[s] && c) c.value = 'Хочу заказать образец: ' + byMat[s].name;
  }

  /* ---------- Меню и появление ---------- */
  function menu() {
    var nav = $('#mnav'); if (!nav) return;
    var open = function () { nav.classList.add('is-open'); nav.hidden = false; document.body.style.overflow = 'hidden'; $('[data-menu-close]', nav).focus(); };
    var close = function () { nav.classList.remove('is-open'); nav.hidden = true; document.body.style.overflow = ''; var b = $('[data-menu-open]'); if (b) b.focus(); };
    $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', open); });
    $('[data-menu-close]', nav).addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) close(); });
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function reveal() { $$('.reveal:not(.is-in)').forEach(function (el) { if (io) io.observe(el); else el.classList.add('is-in'); }); }

  /* ---------- Запуск ---------- */
  var pages = { catalog: pageCatalog, collection: pageCollection, model: pageModel, materials: pageMaterials, favorites: pageFavorites, booking: pageBooking };
  document.addEventListener('DOMContentLoaded', function () {
    menu();
    $$('[data-page]').forEach(function (el) { var fn = pages[el.getAttribute('data-page')]; if (fn) fn(el); });
    prefill(); favs.paint(); reveal();
  });
})();
