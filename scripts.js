(function () {
  'use strict';

  /* ── Шапка: прячется при скролле вниз, возвращается при скролле вверх ── */
  function initHeader() {
    var nav = document.querySelector('.nav--sticky');
    if (!nav) return;

    // Компенсируем высоту фиксированной шапки отступом body
    function setOffset() {
      document.body.style.paddingTop = nav.offsetHeight + 'px';
    }
    setOffset();
    window.addEventListener('resize', setOffset);

    var lastY = window.pageYOffset;
    var threshold = nav.offsetHeight;
    var ticking = false;
    var stopTimer = null;

    function update() {
      var y = window.pageYOffset;
      if (y > lastY && y > threshold) {
        nav.classList.add('nav--hidden');    // вниз — прячем
      } else {
        nav.classList.remove('nav--hidden');  // вверх — показываем
      }
      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
      // Как только прокрутка остановилась — возвращаем шапку
      if (stopTimer) clearTimeout(stopTimer);
      stopTimer = setTimeout(function () {
        nav.classList.remove('nav--hidden');
      }, 150);
    }, { passive: true });
  }

  /* ── Сворачивание текста услуг с кнопкой «Посмотреть полностью» ── */
  function initPackages() {
    var packages = document.querySelectorAll('.package');
    if (!packages.length) return;
    var bodies = [];

    packages.forEach(function (card) {
      var price = card.querySelector('.package__price');
      if (!price) { bodies.push(null); return; }
      var body = document.createElement('div');
      body.className = 'package__body';
      var node = price.nextElementSibling;
      while (node) {
        var next = node.nextElementSibling;
        body.appendChild(node);
        node = next;
      }
      card.appendChild(body);
      bodies.push(body);
    });

    // Эталон высоты — самый короткий текстовый блок среди услуг
    var target = Infinity;
    bodies.forEach(function (body) {
      if (body) target = Math.min(target, body.offsetHeight);
    });
    if (!isFinite(target)) return;

    packages.forEach(function (card, i) {
      var body = bodies[i];
      if (!body) return;
      if (body.offsetHeight > target + 8) {
        body.style.maxHeight = target + 'px';
        body.classList.add('is-collapsed');

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'package__toggle';
        btn.textContent = 'Посмотреть полностью';
        btn.addEventListener('click', function () {
          if (body.classList.contains('is-collapsed')) {
            body.classList.remove('is-collapsed');
            body.style.maxHeight = 'none';
            btn.textContent = 'Свернуть';
          } else {
            body.classList.add('is-collapsed');
            body.style.maxHeight = target + 'px';
            btn.textContent = 'Посмотреть полностью';
          }
        });
        card.appendChild(btn);
      }
    });
  }

  /* ── Мобильное меню: бургер справа, соцыконки слева ── */
  function initMobileNav() {
    var nav = document.querySelector('.nav');
    if (!nav || nav.querySelector('.nav__burger')) return;

    // помечаем существующие пункты меню
    Array.prototype.forEach.call(nav.children, function (el) {
      if (el.tagName === 'A') el.classList.add('nav__link');
    });

    // соцыконки слева
    var social = document.createElement('div');
    social.className = 'nav__social';
    social.innerHTML =
      '<a href="https://vk.com/id74523601" aria-label="ВКонтакте"><img class="soc-ico" src="assets/vk.png" alt="ВКонтакте"></a>' +
      '<a href="https://max.ru/u/f9LHodD0cOKt04_KlVTNni_kAMa0kJ7R0f7LP7a6eLaRUk1p-munOzeRiMU" aria-label="MAX"><img class="soc-ico" src="assets/max.png" alt="MAX"></a>';
    nav.insertBefore(social, nav.firstChild);

    // бургер справа
    var burger = document.createElement('button');
    burger.type = 'button';
    burger.className = 'nav__burger';
    burger.setAttribute('aria-label', 'Меню');
    burger.innerHTML = '<span></span><span></span><span></span>';
    burger.addEventListener('click', function () { nav.classList.toggle('is-open'); });
    nav.appendChild(burger);

    // закрывать меню при выборе пункта
    Array.prototype.forEach.call(nav.querySelectorAll('.nav__link'), function (a) {
      a.addEventListener('click', function () { nav.classList.remove('is-open'); });
    });
  }

  /* ── Лента-карусель: прокрутка стрелками ── */
  function initCarousels() {
    document.querySelectorAll('.carousel').forEach(function (car) {
      var track = car.querySelector('.carousel__track');
      var prev = car.querySelector('.carousel__btn--prev');
      var next = car.querySelector('.carousel__btn--next');
      if (!track) return;
      var mqMobile = window.matchMedia('(max-width: 800px)');
      function gap() { return parseFloat(getComputedStyle(track).columnGap) || 0; }
      function itemStep() {
        var img = track.querySelector('img');
        return img ? img.getBoundingClientRect().width + gap() : track.clientWidth;
      }
      // На мобильном — ровно один файл за прокрутку, на ПК — как было
      function step() { return mqMobile.matches ? itemStep() : track.clientWidth * 0.8; }
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });

      // Прячем стрелку у края ленты (визуально скрывается только на мобильном — см. CSS)
      function updateEnds() {
        var atStart = track.scrollLeft <= 2;
        var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
        car.classList.toggle('is-at-start', atStart);
        car.classList.toggle('is-at-end', atEnd);
      }
      updateEnds();
      track.addEventListener('scroll', function () { window.requestAnimationFrame(updateEnds); }, { passive: true });
      window.addEventListener('resize', updateEnds);
    });
  }

  /* ── Лайтбокс: клик по картинке — увеличить ── */
  function initLightbox() {
    var zoomables = document.querySelectorAll('.project__gallery img, .carousel__track img');
    if (!zoomables.length) return;

    var box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<button class="lightbox__close" aria-label="Закрыть">&times;</button><img alt="">';
    document.body.appendChild(box);
    var big = box.querySelector('img');

    function open(src, alt) {
      big.src = src; big.alt = alt || '';
      box.classList.add('is-open');
    }
    function close() { box.classList.remove('is-open'); big.src = ''; }

    zoomables.forEach(function (img) {
      img.addEventListener('click', function () { open(img.src, img.alt); });
    });
    box.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ── Плавное появление блоков при прокрутке ── */
  function initReveal() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;
    var sels = [
      '.about', '.service', '.divider', '.cta',
      '.package', '.work', '.project__desc',
      '.project__gallery img', '.docs', '.extras', '.stages',
      '.contacts-page', '.page-head'
    ];
    var els = document.querySelectorAll(sels.join(','));
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    els.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  /* ── Приветственный подъём hero-блока ── */
  function initHeroLift() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    setTimeout(function () { hero.classList.add('is-lifted'); }, 1000);
  }

  function init() {
    initMobileNav();
    initHeader();
    initPackages();
    initCarousels();
    initLightbox();
    initHeroLift();
  }

  // появление — сразу, чтобы не было моргания контента
  initReveal();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(init);
  } else {
    window.addEventListener('load', init);
  }
})();
