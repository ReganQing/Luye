/* 绿野 Luye · 文章大纲导航
 * 由正文 h2/h3 构建大纲：宽屏 sticky 侧栏、窄屏浮动按钮 + 抽屉。
 * 渐进增强：标题不足两个或脚本未执行时整块不显示（html.toc-ready 门控）。
 */
(function () {
  'use strict';

  var content = document.querySelector('.post-content');
  var col = document.getElementById('toc-col');
  var panel = document.getElementById('toc-panel');
  var list = document.getElementById('toc-list');
  var fab = document.getElementById('toc-fab');
  var closeBtn = document.getElementById('toc-close');
  var backdrop = document.getElementById('toc-backdrop');
  if (!content || !col || !panel || !list) { return; }

  var heads = [].slice.call(content.querySelectorAll('h2, h3'));
  if (heads.length < 2) {
    if (col.parentNode) { col.parentNode.removeChild(col); }
    return;
  }

  // ---------- 标题锚点：缺失时补唯一 id ----------
  var used = {};
  heads.forEach(function (h, i) {
    if (!h.id) {
      var base = 'toc-h-' + (i + 1);
      var id = base;
      var n = 2;
      while (used[id] || document.getElementById(id)) { id = base + '-' + n; n++; }
      h.id = id;
    }
    used[h.id] = true;
  });

  // ---------- 构建大纲列表 ----------
  heads.forEach(function (h) {
    var li = document.createElement('li');
    li.className = h.tagName === 'H3' ? 'lvl-3' : 'lvl-2';
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = (h.textContent || '').replace(/\s+/g, ' ').trim();
    a.title = a.textContent;
    li.appendChild(a);
    list.appendChild(li);
  });
  document.documentElement.classList.add('toc-ready');

  var links = [].slice.call(list.querySelectorAll('a'));
  var narrow = function () {
    return window.matchMedia && window.matchMedia('(max-width: 1199px)').matches;
  };

  // ---------- 滚动高亮 ----------
  function keepActiveVisible(act) {
    var sc = (getComputedStyle(list).overflowY === 'auto') ? list : panel;
    if (sc.scrollHeight <= sc.clientHeight) { return; }
    var ar = act.getBoundingClientRect();
    var sr = sc.getBoundingClientRect();
    if (ar.top < sr.top + 8) { sc.scrollTop += ar.top - sr.top - 8; }
    else if (ar.bottom > sr.bottom - 8) { sc.scrollTop += ar.bottom - sr.bottom + 8; }
  }
  function setActive(id) {
    var act = null;
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('active', on);
      if (on) { act = a; }
    });
    if (act) { keepActiveVisible(act); }
  }
  function spy() {
    var pad = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10);
    if (isNaN(pad)) { pad = 88; }
    var line = pad + 24;
    var cur = heads[0];
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top <= line) { cur = heads[i]; } else { break; }
    }
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    if (window.innerHeight + y >= document.body.scrollHeight - 4) { cur = heads[heads.length - 1]; }
    setActive(cur.id);
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(function () { spy(); ticking = false; });
    }
  }, { passive: true });
  spy();

  // ---------- 窄屏抽屉 ----------
  function setToc(open) {
    document.body.classList.toggle('toc-open', open);
    if (fab) {
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      fab.setAttribute('aria-label', open ? '关闭文章大纲' : '打开文章大纲');
    }
    if (open) {
      var first = list.querySelector('a');
      if (first) { first.focus(); }
    } else if (fab && narrow()) {
      fab.focus();
    }
  }
  if (fab) {
    fab.addEventListener('click', function () {
      setToc(!document.body.classList.contains('toc-open'));
    });
  }
  if (closeBtn) { closeBtn.addEventListener('click', function () { setToc(false); }); }
  if (backdrop) { backdrop.addEventListener('click', function () { setToc(false); }); }
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && document.body.classList.contains('toc-open')) {
      setToc(false);
    }
  });
  // 点击大纲条目：窄屏收起抽屉（不抢焦点，保留锚点跳转后的阅读位置）
  links.forEach(function (a) {
    a.addEventListener('click', function () {
      if (narrow() && document.body.classList.contains('toc-open')) {
        document.body.classList.remove('toc-open');
        if (fab) {
          fab.setAttribute('aria-expanded', 'false');
          fab.setAttribute('aria-label', '打开文章大纲');
        }
      }
      setActive(a.getAttribute('href').slice(1));
    });
  });
})();