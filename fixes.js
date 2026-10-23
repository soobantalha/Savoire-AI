/* fixes.js — small behaviour fixes for the mobile tab bar and drawer (load after app.js) */
(function () {
  'use strict';
  var dock = document.getElementById('svDock');
  var panel = document.getElementById('leftPanel');
  var backdrop = document.getElementById('sbBackdrop');

  // 1) Tabs that open the sidebar/modals are actions, not pages: return the highlight to "Create"
  //    when they close, instead of leaving "Menu" or "Theme" stuck on.
  function resetDock() {
    if (window._svDockGo && !(panel && panel.classList.contains('mobile-open'))) window._svDockGo('create');
  }

  // 2) Mirror drawer state on <body> so CSS can hide the tab bar and lock background scroll.
  function syncDrawer() {
    var open = !!(panel && panel.classList.contains('mobile-open'));
    document.body.classList.toggle('sv-sidebar-open', open);
    document.documentElement.style.overscrollBehavior = open ? 'none' : '';
    if (!open) resetDock();
  }
  if (panel && window.MutationObserver) {
    new MutationObserver(syncDrawer).observe(panel, { attributes: true, attributeFilter: ['class'] });
  }

  // 3) Escape closes the drawer; leaving mobile width never leaves it stuck open.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel && panel.classList.contains('mobile-open') && window._app && window._app._closeSidebar) window._app._closeSidebar();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1024 && panel) { panel.classList.remove('mobile-open'); if (backdrop) backdrop.classList.remove('visible'); syncDrawer(); }
  });

  // 4) Re-place the tab-bar orb after fonts/orientation changes (it measured too early before).
  function replace() {
    var on = dock && dock.querySelector('button.on');
    if (on && window._svDockGo) window._svDockGo(on.getAttribute('data-dock'));
  }
  window.addEventListener('orientationchange', function () { setTimeout(replace, 250); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(replace);
})();
