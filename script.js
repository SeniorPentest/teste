/* ── VØID — script.js ── */
'use strict';

/* ══════════════════════════════════════════════════════════════
   NAV — scroll behaviour + mobile toggle
   ══════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav     = document.getElementById('nav');
  const burger  = document.getElementById('burger');
  const links   = document.getElementById('navLinks');

  // Scroll — add/remove .scrolled class
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // Burger menu
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    links.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on link click
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      links.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();


/* ══════════════════════════════════════════════════════════════
   CAROUSEL
   ══════════════════════════════════════════════════════════════ */
(function initCarousel() {
  const track     = document.getElementById('carouselTrack');
  const prevBtn   = document.getElementById('prevBtn');
  const nextBtn   = document.getElementById('nextBtn');
  const dotsWrap  = document.getElementById('dots');
  const carousel  = document.getElementById('carousel');

  if (!track) return;

  const cards       = Array.from(track.children);
  const totalCards  = cards.length;
  let current       = 0;
  let isDragging    = false;
  let dragStartX    = 0;
  let dragDelta     = 0;

  // How many cards visible at once (CSS-driven, we read it)
  function getVisible() {
    const cw = carousel.offsetWidth;
    if (cw >= 1024) return 4;
    if (cw >= 640)  return 3;
    return 1;
  }

  function maxIndex() {
    return Math.max(0, totalCards - getVisible());
  }

  // ── Build dots ──
  function buildDots() {
    dotsWrap.innerHTML = '';
    const count = maxIndex() + 1;
    for (let i = 0; i < count; i++) {
      const btn = document.createElement('button');
      btn.className = 'carousel__dot' + (i === current ? ' active' : '');
      btn.setAttribute('aria-label', `Ir para produto ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(btn);
    }
  }

  function updateDots() {
    const dotBtns = dotsWrap.querySelectorAll('.carousel__dot');
    dotBtns.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  // ── Slide ──
  function getGap() {
    // Read actual computed column-gap so it always matches CSS
    return parseFloat(getComputedStyle(track).columnGap) || 0;
  }

  function goTo(index) {
    current = Math.max(0, Math.min(index, maxIndex()));
    const cardWidth = cards[0].getBoundingClientRect().width;
    track.style.transform = `translateX(-${current * (cardWidth + getGap())}px)`;
    updateDots();
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === maxIndex();
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Keyboard navigation
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
    if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
  });

  // ── Touch / drag ──
  function dragStart(x) {
    isDragging = true;
    dragStartX  = x;
    dragDelta   = 0;
    track.style.transition = 'none';
  }
  function dragMove(x) {
    if (!isDragging) return;
    dragDelta = x - dragStartX;
  }
  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = '';
    const threshold = 60;
    if (dragDelta < -threshold) goTo(current + 1);
    else if (dragDelta > threshold) goTo(current - 1);
    else goTo(current); // snap back
  }

  // Mouse drag
  carousel.addEventListener('mousedown',  e => dragStart(e.clientX));
  window.addEventListener('mousemove',    e => dragMove(e.clientX));
  window.addEventListener('mouseup',      () => dragEnd());

  // Touch
  carousel.addEventListener('touchstart', e => dragStart(e.touches[0].clientX), { passive: true });
  carousel.addEventListener('touchmove',  e => dragMove(e.touches[0].clientX),  { passive: true });
  carousel.addEventListener('touchend',   () => dragEnd());

  // ── Auto-play ──
  let autoTimer = setInterval(() => goTo(current + 1 > maxIndex() ? 0 : current + 1), 4500);
  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1 > maxIndex() ? 0 : current + 1), 4500);
  }
  [prevBtn, nextBtn, carousel].forEach(el => el.addEventListener('click', resetAuto));

  // ── Resize ──
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(Math.min(current, maxIndex()));
    }, 200);
  });

  // ── Init ──
  buildDots();
  goTo(0);
})();


/* ══════════════════════════════════════════════════════════════
   STATS — animated counter
   ══════════════════════════════════════════════════════════════ */
(function initStats() {
  const nums = document.querySelectorAll('.stat-num');
  if (!nums.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1600;
      const start  = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        // ease-out
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => observer.observe(n));
})();


/* ══════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════════════════════════════ */
(function initReveal() {
  // Add .reveal to sections that should animate in
  const targets = document.querySelectorAll(
    '.statsbar, .colecao, .features, .sobre, .lookbook, .newsletter'
  );
  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  targets.forEach(el => observer.observe(el));
})();


/* ══════════════════════════════════════════════════════════════
   NEWSLETTER FORM
   ══════════════════════════════════════════════════════════════ */
(function initNewsletter() {
  const form  = document.getElementById('newsletterForm');
  const input = document.getElementById('emailInput');
  const msg   = document.getElementById('formMsg');

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = input.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    msg.className = 'newsletter__note mono';

    if (!valid) {
      msg.textContent = 'E-mail inválido — tente novamente.';
      msg.classList.add('err');
      input.focus();
      return;
    }

    msg.textContent = 'Inscrição confirmada — obrigado por se juntar ao VØID.';
    msg.classList.add('ok');
    input.value = '';
    form.querySelector('button').disabled = true;
    setTimeout(() => {
      msg.textContent = '';
      form.querySelector('button').disabled = false;
    }, 5000);
  });
})();


/* ══════════════════════════════════════════════════════════════
   CART — itens + checkout simulado
   ══════════════════════════════════════════════════════════════ */
(function initCart() {
  const cartBtn = document.getElementById('cartBtn');
  const cart = document.getElementById('cart');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmpty = cart?.querySelector('.cart__empty');
  const cartCount = document.getElementById('cartCount');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');
  const cartShipping = document.getElementById('cartShipping');
  const shippingSelect = document.getElementById('shippingSelect');
  const paymentRadios = cart ? cart.querySelectorAll('input[name="payment"]') : [];
  const cardFields = document.getElementById('cardFields');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutMsg = document.getElementById('checkoutMsg');
  const closeButtons = cart ? cart.querySelectorAll('[data-action="close-cart"]') : [];

  if (!cartBtn || !cart || !cartItemsEl) return;

  const items = new Map();

  const formatPrice = value => value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const updateCount = () => {
    const count = Array.from(items.values()).reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = count;
    cartCount.classList.toggle('is-empty', count === 0);
  };

  const getShipping = () => Number(shippingSelect?.value || 0);

  const updateTotals = () => {
    const subtotal = Array.from(items.values()).reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = getShipping();
    cartSubtotal.textContent = formatPrice(subtotal);
    cartShipping.textContent = formatPrice(shipping);
    cartTotal.textContent = formatPrice(subtotal + shipping);
  };

  const renderItems = () => {
    cartItemsEl.innerHTML = '';
    if (!items.size) {
      if (cartEmpty) cartEmpty.style.display = 'block';
    } else {
      if (cartEmpty) cartEmpty.style.display = 'none';
      items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cart__item';
        li.dataset.id = item.id;
        li.innerHTML = `
          <div class="cart__item-main">
            <div>
              <p class="cart__item-name">${item.name}</p>
              <p class="cart__item-meta">${item.category} · ${formatPrice(item.price)}</p>
            </div>
            <div class="cart__item-price">${formatPrice(item.price * item.qty)}</div>
          </div>
          <div class="cart__item-controls">
            <div class="cart__qty">
              <button type="button" data-action="decrease" aria-label="Diminuir quantidade">-</button>
              <span>${item.qty}</span>
              <button type="button" data-action="increase" aria-label="Aumentar quantidade">+</button>
            </div>
            <button type="button" class="cart__remove" data-action="remove">Remover</button>
          </div>
        `;
        cartItemsEl.appendChild(li);
      });
    }
    updateCount();
    updateTotals();
  };

  const openCart = () => {
    cart.classList.add('open');
    cart.setAttribute('aria-hidden', 'false');
    cartBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    const burger = document.getElementById('burger');
    const links = document.getElementById('navLinks');
    burger?.classList.remove('open');
    links?.classList.remove('open');
  };

  const closeCart = () => {
    cart.classList.remove('open');
    cart.setAttribute('aria-hidden', 'true');
    cartBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const updatePaymentFields = () => {
    const selected = cart.querySelector('input[name="payment"]:checked')?.value;
    const showCard = selected === 'card';
    if (cardFields) {
      cardFields.hidden = !showCard;
      cardFields.querySelectorAll('input, select').forEach(field => {
        field.disabled = !showCard;
      });
    }
  };

  cartBtn.addEventListener('click', openCart);
  closeButtons.forEach(btn => btn.addEventListener('click', closeCart));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && cart.classList.contains('open')) closeCart();
  });

  shippingSelect?.addEventListener('change', updateTotals);
  paymentRadios.forEach(radio => radio.addEventListener('change', updatePaymentFields));
  updatePaymentFields();
  renderItems();

  cartItemsEl.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const itemEl = button.closest('.cart__item');
    const id = itemEl?.dataset.id;
    if (!id || !items.has(id)) return;
    const item = items.get(id);
    const action = button.dataset.action;

    if (action === 'increase') item.qty += 1;
    if (action === 'decrease') item.qty -= 1;
    if (action === 'remove' || item.qty <= 0) items.delete(id);

    renderItems();
  });

  if (checkoutForm && checkoutMsg) {
    checkoutForm.addEventListener('submit', event => {
      event.preventDefault();
      checkoutMsg.className = 'cart__note';

      if (!items.size) {
        checkoutMsg.textContent = 'Adicione itens ao carrinho para continuar.';
        checkoutMsg.classList.add('cart__note--warn');
        return;
      }

      checkoutMsg.textContent = 'Pedido simulado! Em breve você poderá finalizar por aqui.';
      checkoutMsg.classList.add('cart__note--ok');
      items.clear();
      renderItems();
    });
  }

  document.querySelectorAll('[data-action="add-to-cart"]').forEach(btn => {
    btn.addEventListener('click', function () {
      const card = this.closest('.card');
      const name = card?.dataset.name || card?.querySelector('.card__name')?.textContent?.trim();
      const category = card?.dataset.category || card?.querySelector('.card__cat')?.textContent?.trim();
      const price = Number(card?.dataset.price || 0) || 0;
      const id = card?.dataset.sku || name;

      if (!id || !name) return;
      if (items.has(id)) {
        items.get(id).qty += 1;
      } else {
        items.set(id, { id, name, category, price, qty: 1 });
      }

      renderItems();

      const original = this.textContent;
      this.textContent = '✓';
      this.style.borderColor = '#7aa081';
      this.style.color = '#7aa081';
      setTimeout(() => {
        this.textContent = original;
        this.style.borderColor = '';
        this.style.color = '';
      }, 1200);
    });
  });
})();
