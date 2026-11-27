/* 绿野 Luye · 主题交互脚本
 * 移动端导航 / 官方搜索组件 / 滚动显现 / 返回顶部 / 导航高亮 / 阅读时间
 */
(function () {
  'use strict';

  // ---------- 配色方案 ----------
  var COLOR_SCHEME_KEY = 'luye-color-scheme';
  var COLOR_SCHEMES = ['dark', 'light', 'system'];
  var root = document.documentElement;
  var themeToggle = document.querySelector('[data-theme-toggle]');
  var themeColorMeta = document.getElementById('theme-color-meta');
  var systemSchemeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function readColorScheme() {
    try {
      var value = window.localStorage.getItem(COLOR_SCHEME_KEY);
      return COLOR_SCHEMES.indexOf(value) !== -1 ? value : null;
    } catch (e) {
      return null;
    }
  }

  function storeColorScheme(value) {
    try {
      window.localStorage.setItem(COLOR_SCHEME_KEY, value);
    } catch (e) { /* 存储不可用（隐私模式等）：仅本次会话有效 */ }
  }

  function resolveColorScheme(mode) {
    if (mode === 'light') { return 'light'; }
    if (mode === 'system') {
      return systemSchemeQuery && systemSchemeQuery.matches ? 'light' : 'dark';
    }
    return 'dark';
  }

  function updateThemeToggle(scheme) {
    if (!themeToggle) { return; }
    var next = scheme === 'dark' ? '浅色' : '深色';
    var label = '切换到' + next + '主题';
    themeToggle.hidden = false;
    themeToggle.setAttribute('aria-label', label);
    themeToggle.setAttribute('title', label);
  }

  function updateThemeColor(scheme) {
    if (!themeColorMeta) { return; }
    var color = scheme === 'light' ? '#F6FAF6' : '#0E1F17';
    if (window.getComputedStyle) {
      var token = window.getComputedStyle(root).getPropertyValue('--bg-top').trim();
      if (token) { color = token; }
    }
    themeColorMeta.setAttribute('content', color);
  }

  function applyColorScheme(scheme, persist) {
    if (scheme !== 'dark' && scheme !== 'light') { scheme = 'dark'; }
    root.setAttribute('data-color-scheme', scheme);
    root.style.colorScheme = scheme;
    updateThemeToggle(scheme);
    updateThemeColor(scheme);
    if (persist) { storeColorScheme(scheme); }
    if (typeof CustomEvent === 'function') {
      document.dispatchEvent(new CustomEvent('luye:colorschemechange', {
        detail: { colorScheme: scheme }
      }));
    }
  }

  var configuredColorScheme = root.getAttribute('data-theme-mode') || 'dark';
  if (COLOR_SCHEMES.indexOf(configuredColorScheme) === -1) { configuredColorScheme = 'dark'; }
  applyColorScheme(resolveColorScheme(readColorScheme() || configuredColorScheme), false);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = root.getAttribute('data-color-scheme') === 'light' ? 'light' : 'dark';
      applyColorScheme(current === 'light' ? 'dark' : 'light', true);
    });
  }

  function onSystemSchemeChange() {
    var stored = readColorScheme();
    if (!stored || stored === 'system') {
      applyColorScheme(resolveColorScheme(stored || configuredColorScheme), false);
    }
  }
  if (systemSchemeQuery) {
    if (systemSchemeQuery.addEventListener) { systemSchemeQuery.addEventListener('change', onSystemSchemeChange); }
    else if (systemSchemeQuery.addListener) { systemSchemeQuery.addListener(onSystemSchemeChange); }
  }

  // ---------- 移动端导航 ----------
  var toggle = document.getElementById('nav-toggle');
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    if (toggle) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    }
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setNav(!document.body.classList.contains('nav-open'));
    });
    // 点击菜单项后收起
    var links = document.querySelectorAll('.nav-center a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () { setNav(false); });
    }
    // Esc 关闭并把焦点交还按钮
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && document.body.classList.contains('nav-open')) {
        setNav(false);
        toggle.focus();
      }
    });
  }

  // ---------- 官方搜索组件 ----------
  // 模板仅在 PluginSearchWidget 可用时渲染此按钮；API 加载失败时隐藏死按钮。
  var searchWidgetButton = document.querySelector('.search-btn[data-search-widget]');
  if (searchWidgetButton) {
    if (window.SearchWidget && typeof window.SearchWidget.open === 'function') {
      searchWidgetButton.addEventListener('click', function () {
        window.SearchWidget.open();
      });
    } else {
      searchWidgetButton.hidden = true;
    }
  }

  // ---------- 返回顶部 ----------
  var toTop = document.getElementById('to-top');
  if (toTop) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          toTop.classList.toggle('show', window.scrollY > window.innerHeight * 0.6);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    toTop.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  // ---------- 滚动显现（尊重 prefers-reduced-motion，CSS 侧亦有兜底） ----------
  // 仅在脚本执行到这里后启用隐藏初始状态，脚本失败时内容仍保持可见。
  document.documentElement.classList.add('reveal-ready');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.10 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // ---------- 导航高亮（按路径匹配） ----------
  try {
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    document.querySelectorAll('.nav-center a').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') { return; }
      var url;
      try { url = new URL(href, window.location.origin); } catch (e) { return; }
      var ap = url.pathname.replace(/\/+$/, '') || '/';
      if (url.origin === window.location.origin && ap === path) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  } catch (e) { /* 忽略 */ }

  // ---------- 阅读时间 ----------
  var postContent = document.querySelector('.post-content');
  var readingTimeEl = document.querySelector('.reading-time');
  if (postContent && readingTimeEl) {
    var text = postContent.textContent || postContent.innerText || '';
    text = text.replace(/\s+/g, '');
    var cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
    var nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ');
    var words = nonCjk.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
    var minutes = Math.ceil(cjk / 400 + words / 200);
    if (minutes < 1) minutes = 1;
    var textEl = readingTimeEl.querySelector('.reading-time-text');
    if (textEl) textEl.textContent = minutes + ' 分钟阅读';
    readingTimeEl.removeAttribute('hidden');
  }
})();
