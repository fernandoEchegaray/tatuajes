(function () {
  'use strict';

  document.documentElement.classList.add('js');

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;

  const header = $('#header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const burger = $('#burger');
  const nav = $('#nav');

  const closeMenu = () => {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('menu-open');
  };

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', isOpen);
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('menu-open', isOpen);
    });

    $$('.nav__link').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });
  }

  const revealItems = $$('[data-reveal]');
  if (revealItems.length) {
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add('is-in'));
    }
  }

  const counters = $$('.stat__num');

  const showFinalValue = (el) => {
    const target = parseFloat(el.dataset.target || '0');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    el.textContent = (decimals ? target.toFixed(decimals) : Math.round(target).toLocaleString('es-ES')) + suffix;
  };

  const animateCounter = (el) => {
    if (prefersReduced) {
      showFinalValue(el);
      return;
    }

    const target = parseFloat(el.dataset.target || '0');
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    let startTime = null;

    const tick = (time) => {
      if (startTime === null) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('es-ES')) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    };

    window.requestAnimationFrame(tick);
  };

  if (counters.length) {
    if ('IntersectionObserver' in window && !prefersReduced) {
      const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });

      counters.forEach((counter) => counterObserver.observe(counter));
    } else {
      counters.forEach(showFinalValue);
    }
  }

  const filters = $$('.filter');
  const tiles = $$('.tile');

  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      filters.forEach((button) => {
        const active = button === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      const category = filter.dataset.filter;
      tiles.forEach((tile) => {
        const visible = category === 'all' || tile.dataset.cat === category;
        tile.classList.toggle('is-hidden', !visible);
      });
    });
  });

  const lightbox = $('#lightbox');
  const lightboxArt = $('#lightboxArt');
  const lightboxTitle = $('#lightboxTitle');
  const lightboxStyle = $('#lightboxStyle');
  const lightboxClose = $('#lightboxClose');
  const lightboxPrev = $('#lightboxPrev');
  const lightboxNext = $('#lightboxNext');
  const lightboxBackdrop = $('.lightbox__backdrop');

  let visibleTiles = [];
  let currentIndex = 0;
  let lastFocused = null;

  const renderLightbox = () => {
    const tile = visibleTiles[currentIndex];
    if (!tile || !lightboxArt) return;

    const art = tile.querySelector('.tile__art');
    const styles = window.getComputedStyle(tile);

    lightboxArt.innerHTML = art ? art.innerHTML : '';
    lightboxArt.style.backgroundColor = styles.backgroundColor;
    lightboxArt.style.color = styles.color;
    if (lightboxTitle) lightboxTitle.textContent = tile.dataset.title || '';
    if (lightboxStyle) lightboxStyle.textContent = tile.dataset.style || '';
    if (lightboxPrev) lightboxPrev.disabled = visibleTiles.length < 2;
    if (lightboxNext) lightboxNext.disabled = visibleTiles.length < 2;
  };

  const openLightbox = (tile) => {
    if (!lightbox) return;
    lastFocused = tile;
    visibleTiles = tiles.filter((item) => !item.classList.contains('is-hidden'));
    currentIndex = Math.max(0, visibleTiles.indexOf(tile));
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    if (lightboxClose) lightboxClose.focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    if (lastFocused) lastFocused.focus();
  };

  const stepLightbox = (direction) => {
    if (visibleTiles.length < 2) return;
    currentIndex = (currentIndex + direction + visibleTiles.length) % visibleTiles.length;
    renderLightbox();
  };

  if (lightbox) {
    tiles.forEach((tile) => {
      tile.addEventListener('click', () => openLightbox(tile));
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', () => stepLightbox(-1));
    if (lightboxNext) lightboxNext.addEventListener('click', () => stepLightbox(1));

    document.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      if (event.key === 'ArrowRight') stepLightbox(1);
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const form = $('#bookingForm');
  const success = $('#bookingSuccess');
  const resetForm = $('#resetForm');
  const dateInput = $('#date');

  if (dateInput) {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    dateInput.min = local.toISOString().split('T')[0];
  }

  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const setInvalid = (input, invalid) => {
      const field = input.closest('.field');
      if (field) field.classList.toggle('is-invalid', invalid);
      input.setAttribute('aria-invalid', String(invalid));
      return !invalid;
    };

    const validate = () => {
      const name = $('#name', form);
      const email = $('#email', form);
      const style = $('#style', form);
      const idea = $('#idea', form);
      let firstInvalid = null;

      const checks = [
        [name, name.value.trim().length >= 2],
        [email, emailPattern.test(email.value.trim())],
        [style, style.value !== ''],
        [idea, idea.value.trim().length >= 10]
      ];

      checks.forEach(([input, valid]) => {
        if (!setInvalid(input, !valid) && !firstInvalid) {
          firstInvalid = input;
        }
      });

      return firstInvalid;
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const firstInvalid = validate();

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      if (!submitBtn) return;

      const original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Enviando…</span>';

      window.setTimeout(() => {
        form.hidden = true;
        if (success) success.hidden = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
        form.reset();
      }, 1000);
    });

    $$('input, select, textarea', form).forEach((input) => {
      const clear = () => {
        const field = input.closest('.field');
        if (field) field.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
      };
      input.addEventListener('input', clear);
      input.addEventListener('change', clear);
    });
  }

  if (resetForm && form && success) {
    resetForm.addEventListener('click', () => {
      success.hidden = true;
      form.hidden = false;
      form.reset();
      $$('.field', form).forEach((field) => field.classList.remove('is-invalid'));
      const name = $('#name', form);
      if (name) name.focus();
    });
  }

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  if (finePointer && !prefersReduced) {
    const cursor = $('.cursor');

    if (cursor) {
      document.body.classList.add('has-cursor');
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let x = targetX;
      let y = targetY;

      cursor.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) translate(-50%, -50%)';

      const loop = () => {
        x += (targetX - x) * 0.2;
        y += (targetY - y) * 0.2;
        cursor.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) translate(-50%, -50%)';
        window.requestAnimationFrame(loop);
      };
      window.requestAnimationFrame(loop);

      window.addEventListener('pointermove', (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
      }, { passive: true });

      const hoverSelector = 'a, button, input, textarea, select, .tile, .magnetic';

      document.addEventListener('pointerover', (event) => {
        const target = event.target;
        if (target && target.closest && target.closest(hoverSelector)) {
          cursor.classList.add('is-hover');
        }
      });

      document.addEventListener('pointerout', (event) => {
        const related = event.relatedTarget;
        if (!related || !related.closest || !related.closest(hoverSelector)) {
          cursor.classList.remove('is-hover');
        }
      });
    }

    $$('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const moveX = (event.clientX - rect.left - rect.width / 2) * 0.15;
        const moveY = (event.clientY - rect.top - rect.height / 2) * 0.25;
        element.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px)';
      });

      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    });

    const hero = $('.hero');
    if (hero) {
      hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        const moveX = (event.clientX - rect.left) / rect.width - 0.5;
        const moveY = (event.clientY - rect.top) / rect.height - 0.5;
        hero.style.setProperty('--mx', moveX.toFixed(3));
        hero.style.setProperty('--my', moveY.toFixed(3));
      });

      hero.addEventListener('pointerleave', () => {
        hero.style.setProperty('--mx', '0');
        hero.style.setProperty('--my', '0');
      });
    }
  }
})();
