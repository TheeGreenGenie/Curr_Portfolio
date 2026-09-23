/* ============================================================
   PORTFOLIO — main.js
   Sections run only when their target elements exist so this
   file loads safely on every page via base.html.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ----------------------------------------------------------
     1. AOS — Animate On Scroll
     ---------------------------------------------------------- */
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 720,
      once: true,
      offset: 72,
      easing: 'ease-out-cubic',
    });
  }

  /* ----------------------------------------------------------
     2. Theme toggle (desktop + mobile buttons share state)
     ---------------------------------------------------------- */
  var html      = document.documentElement;
  var toggleBtn = document.getElementById('theme-toggle');
  var toggleMob = document.getElementById('theme-toggle-mobile');
  var iconSun   = document.getElementById('icon-sun');
  var iconMoon  = document.getElementById('icon-moon');

  function applyTheme(isDark) {
    if (isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
    if (iconSun && iconMoon) {
      iconSun.classList.toggle('hidden', !isDark);
      iconMoon.classList.toggle('hidden', isDark);
    }
  }

  // Sync icon state with current theme on load
  applyTheme(html.classList.contains('dark'));

  function handleThemeToggle() {
    applyTheme(!html.classList.contains('dark'));
  }

  if (toggleBtn) toggleBtn.addEventListener('click', handleThemeToggle);
  if (toggleMob) toggleMob.addEventListener('click', handleThemeToggle);

  /* ----------------------------------------------------------
     3. Mobile menu
     ---------------------------------------------------------- */
  var menuBtn    = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
  var hamLines   = menuBtn ? menuBtn.querySelectorAll('.hamburger-line') : [];

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var isOpen = !mobileMenu.classList.contains('hidden');

      mobileMenu.classList.toggle('hidden');
      menuBtn.setAttribute('aria-expanded', String(!isOpen));

      // Animate hamburger lines to X shape
      if (!isOpen) {
        if (hamLines[0]) hamLines[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
        if (hamLines[1]) hamLines[1].style.opacity   = '0';
        if (hamLines[2]) {
          hamLines[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
          hamLines[2].style.width = '20px';
        }
      } else {
        if (hamLines[0]) hamLines[0].style.transform = '';
        if (hamLines[1]) hamLines[1].style.opacity   = '';
        if (hamLines[2]) {
          hamLines[2].style.transform = '';
          hamLines[2].style.width = '';
        }
      }
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
        if (hamLines[0]) hamLines[0].style.transform = '';
        if (hamLines[1]) hamLines[1].style.opacity   = '';
        if (hamLines[2]) { hamLines[2].style.transform = ''; hamLines[2].style.width = ''; }
      });
    });
  }

  /* ----------------------------------------------------------
     4. Poetry tabs (only runs on /poetry page)
     Tab buttons carry data-poetry-tab; sections have id="poetry-tab-{slug}"
     ---------------------------------------------------------- */
  var poetryTabBtns = document.querySelectorAll('[data-poetry-tab]');
  var poetrySections = document.querySelectorAll('.poetry-section');

  if (poetryTabBtns.length && poetrySections.length) {
    poetryTabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.poetryTab;

        // Update active button
        poetryTabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        // Fade out all sections, then show the target
        poetrySections.forEach(function (sec) {
          if (!sec.classList.contains('hidden')) {
            if (typeof anime !== 'undefined') {
              anime({
                targets: sec,
                opacity: [1, 0],
                duration: 180,
                easing: 'easeInQuad',
                complete: function () { sec.classList.add('hidden'); showSection(target); }
              });
            } else {
              sec.classList.add('hidden');
              showSection(target);
            }
          }
        });
      });
    });

    function showSection(slug) {
      var sec = document.getElementById('poetry-tab-' + slug);
      if (!sec) return;
      sec.classList.remove('hidden');
      sec.style.opacity = 0;
      if (typeof anime !== 'undefined') {
        anime({ targets: sec, opacity: [0, 1], duration: 320, easing: 'easeOutQuad' });
        // Stagger cards inside
        var cards = sec.querySelectorAll('.poem-grid-card');
        if (cards.length) {
          anime({
            targets: cards,
            opacity: [0, 1],
            translateY: [16, 0],
            delay: anime.stagger(55),
            duration: 380,
            easing: 'easeOutQuad',
          });
        }
      } else {
        sec.style.opacity = 1;
      }
    }
  }

  /* ----------------------------------------------------------
     5. Project filter (only runs on /projects page)
     ---------------------------------------------------------- */
  var categoryBtns = document.querySelectorAll('#filter-tabs .filter-btn');
  var typeBtns     = document.querySelectorAll('#type-tabs .filter-btn');
  var projectCards = document.querySelectorAll('.project-card');
  var noMatches    = document.getElementById('no-matches');

  if (projectCards.length && (categoryBtns.length || typeBtns.length)) {
    var activeCategory = 'all';
    var activeType     = 'all';

    function cardMatches(card) {
      var catOk = activeCategory === 'all' || card.dataset.category === activeCategory;
      var typeOk = activeType === 'all' ||
        (activeType === 'award'
          ? card.dataset.award === 'yes'
          : card.dataset.type === activeType);
      return catOk && typeOk;
    }

    function applyFilters() {
      var matching = [];
      var hiding   = [];

      projectCards.forEach(function (card) {
        (cardMatches(card) ? matching : hiding).push(card);
      });

      if (noMatches) noMatches.classList.toggle('hidden', matching.length > 0);

      if (typeof anime === 'undefined') {
        hiding.forEach(function (c) { c.style.display = 'none'; });
        matching.forEach(function (c) { c.style.display = ''; c.style.opacity = ''; });
        return;
      }

      if (hiding.length) {
        anime({
          targets: hiding,
          opacity: [1, 0],
          scale:   [1, 0.94],
          duration: 220,
          easing: 'easeInQuad',
          complete: function () {
            hiding.forEach(function (c) { c.style.display = 'none'; });
          }
        });
      }

      matching.forEach(function (c) {
        c.style.display = '';
        c.style.opacity = '0';
      });
      anime({
        targets: matching,
        opacity: [0, 1],
        scale:   [0.94, 1],
        delay:   anime.stagger(55),
        duration: 380,
        easing: 'easeOutQuad',
      });
    }

    function wireRow(btns, onPick) {
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          onPick(btn);
          applyFilters();
        });
      });
    }

    // Category and type filters combine — both must match
    wireRow(categoryBtns, function (btn) { activeCategory = btn.dataset.category; });
    wireRow(typeBtns,     function (btn) { activeType     = btn.dataset.type; });
  }

  /* ----------------------------------------------------------
     5. Gallery lightbox (project detail pages)
     ---------------------------------------------------------- */
  var lightbox     = document.getElementById('lightbox');
  var lightboxImg  = document.getElementById('lightbox-img');
  var lightboxPrev = document.getElementById('lightbox-prev');
  var lightboxNext = document.getElementById('lightbox-next');
  var lightboxNum  = document.getElementById('lightbox-counter');
  var galleryImgs  = document.querySelectorAll('.gallery-trigger');

  if (lightbox && lightboxImg && galleryImgs.length) {
    var group   = [];   // the images belonging to the gallery that was opened
    var current = 0;

    function render() {
      var img = group[current];
      if (!img) return;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || 'Enlarged view';
      if (lightboxNum) {
        lightboxNum.textContent = group.length > 1
          ? (current + 1) + ' / ' + group.length
          : '';
      }
      var many = group.length > 1;
      if (lightboxPrev) lightboxPrev.classList.toggle('hidden', !many);
      if (lightboxNext) lightboxNext.classList.toggle('hidden', !many);
    }

    // Wraps around at both ends
    function step(delta) {
      if (group.length < 2) return;
      current = (current + delta + group.length) % group.length;
      render();
    }

    function close() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    galleryImgs.forEach(function (img) {
      img.addEventListener('click', function () {
        // Navigate within the gallery this image belongs to
        var container = img.closest('[data-gallery]');
        group = container
          ? Array.prototype.slice.call(container.querySelectorAll('.gallery-trigger'))
          : [img];
        current = group.indexOf(img);
        if (current < 0) current = 0;

        render();
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    // Clicking the backdrop closes; clicking the arrows or the image doesn't
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });
    if (lightboxImg) lightboxImg.addEventListener('click', function (e) { e.stopPropagation(); });

    if (lightboxPrev) lightboxPrev.addEventListener('click', function (e) {
      e.stopPropagation(); step(-1);
    });
    if (lightboxNext) lightboxNext.addEventListener('click', function (e) {
      e.stopPropagation(); step(1);
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape')     { close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
    });
  }

  /* ----------------------------------------------------------
     5b. Gallery strip arrows (horizontal scroller)
     ---------------------------------------------------------- */
  document.querySelectorAll('.gallery-scroller').forEach(function (scroller) {
    var strip = scroller.querySelector('.gallery-scroll');
    if (!strip) return;

    var navs = scroller.querySelectorAll('[data-scroll]');

    function updateNavs() {
      var atStart = strip.scrollLeft <= 2;
      var atEnd   = strip.scrollLeft >= strip.scrollWidth - strip.clientWidth - 2;
      var fits    = strip.scrollWidth <= strip.clientWidth + 2;
      navs.forEach(function (btn) {
        var forward = btn.dataset.scroll === '1';
        btn.classList.toggle('is-disabled', fits || (forward ? atEnd : atStart));
      });
    }

    navs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Advance by one image, falling back to most of the visible width
        var first = strip.querySelector('img');
        var stepPx = first
          ? first.getBoundingClientRect().width + 16   // + gap
          : strip.clientWidth * 0.8;
        strip.scrollBy({ left: stepPx * Number(btn.dataset.scroll), behavior: 'smooth' });
      });
    });

    strip.addEventListener('scroll', updateNavs);
    window.addEventListener('resize', updateNavs);
    window.addEventListener('load', updateNavs);
    updateNavs();
  });

  /* ----------------------------------------------------------
     6a. Collapsibles (profile photo dropdown, mobile)
     Card = [data-collapsible], its bar/face = [data-collapse-toggle].
     Closed by default; click toggles open, click again closes.
     ---------------------------------------------------------- */
  document.querySelectorAll('[data-collapse-toggle]').forEach(function (toggle) {
    var card = toggle.closest('[data-collapsible]');
    if (!card) return;

    toggle.addEventListener('click', function () {
      var willOpen = !card.classList.contains('is-open');
      card.classList.toggle('is-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
      // Section height just changed — page snap stops need rebuilding
      window.dispatchEvent(new Event('layoutchange'));
    });
  });

  /* ----------------------------------------------------------
     6b. Specialty cards — one shared detail modal, populated per
     click. Living outside every card keeps it a fixed-position
     overlay clamped to the real viewport (never part of page
     flow), so opening one can never grow the page or spill off
     screen, on mobile or desktop, no matter how many are opened
     in a row.
     ---------------------------------------------------------- */
  var specialtyModal = document.getElementById('specialty-modal');
  var specialtyBackdrop = document.getElementById('specialty-backdrop');

  if (specialtyModal && specialtyBackdrop) {
    var modalTitle = document.getElementById('specialty-modal-title');
    var modalDesc = document.getElementById('specialty-modal-desc');
    var modalClose = document.getElementById('specialty-modal-close');
    var activeCard = null;

    function openSpecialty(card) {
      activeCard = card;
      modalTitle.textContent = card.dataset.specialtyTitle || '';
      modalDesc.textContent = card.dataset.specialtyDesc || '';
      specialtyModal.classList.add('is-open');
      specialtyBackdrop.classList.add('is-visible');
      card.setAttribute('aria-expanded', 'true');
    }

    function closeSpecialty() {
      if (activeCard) activeCard.setAttribute('aria-expanded', 'false');
      activeCard = null;
      specialtyModal.classList.remove('is-open');
      specialtyBackdrop.classList.remove('is-visible');
    }

    document.querySelectorAll('.specialty-card').forEach(function (card) {
      card.addEventListener('click', function () {
        if (activeCard === card) { closeSpecialty(); }
        else { openSpecialty(card); }
      });
    });

    modalClose.addEventListener('click', closeSpecialty);
    specialtyBackdrop.addEventListener('click', closeSpecialty);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeCard) closeSpecialty();
    });
  }

  /* ----------------------------------------------------------
     7. Keyboard page snapping
     Up/Down (and PageUp/PageDown) step between full-screen
     sections. Stops are measured from the live layout, so they
     follow the current screen width and height.
     ---------------------------------------------------------- */
  (function () {
    var NAV_H = 64;          // fixed nav height (pt-16 / 4rem)
    var stops = [];
    var pendingTarget = null;
    var pendingUntil  = 0;

    function snapSections() {
      var els = document.querySelectorAll('main [data-snap]');
      if (!els.length) els = document.querySelectorAll('main section');
      if (!els.length) els = document.querySelectorAll('main > *');
      return els;
    }

    function buildStops() {
      var maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      var pageH     = Math.max(240, window.innerHeight - NAV_H);
      var raw       = [0];

      snapSections().forEach(function (el) {
        if (!el.offsetHeight) return;                       // hidden / filtered out
        var top = el.getBoundingClientRect().top + window.pageYOffset - NAV_H;
        raw.push(top);
        // A section taller than the screen gets intermediate stops so
        // nothing gets skipped over on the way down.
        for (var y = pageH; y < el.offsetHeight - 48; y += pageH) raw.push(top + y);
      });

      raw.push(maxScroll);
      raw = raw
        .map(function (v) { return Math.round(Math.min(Math.max(v, 0), maxScroll)); })
        .sort(function (a, b) { return a - b; });

      // Drop near-duplicates
      stops = raw.filter(function (v, i) { return i === 0 || v - raw[i - 1] > 24; });
    }

    function isTypingTarget(el) {
      if (!el) return false;
      if (el.isContentEditable) return true;
      return /^(input|textarea|select)$/i.test(el.tagName);
    }

    function nextStop(dir) {
      // While a smooth scroll is still running, step from where we're
      // headed rather than from the current mid-animation position.
      var from = (pendingTarget !== null && Date.now() < pendingUntil)
        ? pendingTarget
        : window.pageYOffset;

      var i;
      if (dir > 0) {
        for (i = 0; i < stops.length; i++) if (stops[i] > from + 8) return stops[i];
      } else {
        for (i = stops.length - 1; i >= 0; i--) if (stops[i] < from - 8) return stops[i];
      }
      return null;
    }

    function overlayOwnsInput() {
      var lightbox = document.getElementById('lightbox');
      if (lightbox && lightbox.classList.contains('open')) return true;
      var menu = document.getElementById('mobile-menu');
      if (menu && !menu.classList.contains('hidden')) return true;
      var specialty = document.getElementById('specialty-modal');
      if (specialty && specialty.classList.contains('is-open')) return true;
      return false;
    }

    function goToStop(target) {
      var now = Date.now();
      pendingTarget = target;
      pendingUntil  = now + 700;
      window.scrollTo({ top: target, behavior: 'smooth' });
      return now + 700;
    }

    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      if (overlayOwnsInput()) return;

      var dir = 0;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1;
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1;
      else return;

      if (stops.length < 2) buildStops();

      var target = nextStop(dir);
      if (target === null) return;      // at the end — let the browser handle it

      e.preventDefault();
      goToStop(target);
    });

    // Only wire up wheel/touch snapping on pages that actually have
    // full-screen snap sections (the home page).
    var hasSnapPages = document.querySelectorAll('main [data-snap]').length > 0;

    if (hasSnapPages) {
      var busyUntil = 0;

      // Mouse wheel / trackpad — one notch/swipe steps one stop, then
      // swallows further wheel events until the smooth scroll settles.
      window.addEventListener('wheel', function (e) {
        if (e.ctrlKey) return;               // pinch-zoom
        if (overlayOwnsInput()) return;

        var now = Date.now();
        if (now < busyUntil) { e.preventDefault(); return; }
        if (Math.abs(e.deltaY) < 4) return;

        if (stops.length < 2) buildStops();
        var dir = e.deltaY > 0 ? 1 : -1;
        var target = nextStop(dir);
        if (target === null) return;         // at the end — allow native scroll

        e.preventDefault();
        busyUntil = goToStop(target);
      }, { passive: false });

      // Touch swipe — same one-swipe-one-stop behavior as wheel, reusing
      // the same intermediate stops for sections taller than the screen.
      var touchStartY = null;
      var touchHandled = false;

      window.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1 || overlayOwnsInput()) { touchStartY = null; return; }
        // Let taps on buttons/links/collapsibles behave normally — only
        // hijack swipes that start on plain page background.
        if (e.target.closest('button, a, input, textarea, select, [data-collapse-toggle], #specialty-modal')) {
          touchStartY = null;
          return;
        }
        touchStartY = e.touches[0].clientY;
        touchHandled = false;
      }, { passive: true });

      window.addEventListener('touchmove', function (e) {
        if (touchStartY === null || touchHandled) return;
        if (overlayOwnsInput()) { touchStartY = null; return; }

        var now = Date.now();
        if (now < busyUntil) { e.preventDefault(); return; }

        var dy = touchStartY - e.touches[0].clientY;
        if (Math.abs(dy) < 30) return;

        if (stops.length < 2) buildStops();
        var dir = dy > 0 ? 1 : -1;
        var target = nextStop(dir);
        touchHandled = true;
        if (target === null) return;         // at the end — allow native scroll

        e.preventDefault();
        busyUntil = goToStop(target);
      }, { passive: false });

      window.addEventListener('touchend', function () {
        touchStartY = null;
        touchHandled = false;
      });
    }

    // Keep stops in sync with the real layout
    var rebuildTimer;
    function scheduleRebuild() {
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(buildStops, 120);
    }

    buildStops();
    window.addEventListener('resize', scheduleRebuild);
    window.addEventListener('orientationchange', scheduleRebuild);
    window.addEventListener('load', scheduleRebuild);
    window.addEventListener('layoutchange', scheduleRebuild);

    // Images finishing, cards opening, filters running — all shift the layout
    if (typeof ResizeObserver !== 'undefined') {
      var main = document.querySelector('main');
      if (main) new ResizeObserver(scheduleRebuild).observe(main);
    }
  })();

  /* ----------------------------------------------------------
     8. Smooth reveal for hero text (home page only)
     ---------------------------------------------------------- */
  var heroName = document.getElementById('hero-name');
  if (heroName && typeof anime !== 'undefined') {
    anime({
      targets: '#hero-name',
      opacity: [0, 1],
      translateY: [24, 0],
      duration: 900,
      easing: 'easeOutExpo',
      delay: 200,
    });
  }

});
