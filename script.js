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
      msg.textContent = '// e-mail inválido — tente novamente';
      msg.classList.add('err');
      input.focus();
      return;
    }

    msg.textContent = '// inscrição confirmada — bem-vindo ao VØID';
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
   SHOPPING CART SYSTEM
   ══════════════════════════════════════════════════════════════ */
(function initCart() {
  const cart = [];

  // Elements
  const cartBtn = document.getElementById('cartBtn');
  const cartCount = document.getElementById('cartCount');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');
  const cartItems = document.getElementById('cartItems');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotalValue = document.getElementById('cartTotalValue');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // Add to cart buttons
  document.querySelectorAll('[data-action="add-to-cart"]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const card = this.closest('.card');
      const item = {
        id: card.dataset.id,
        name: card.dataset.name,
        category: card.dataset.category,
        price: parseFloat(card.dataset.price),
        image: card.querySelector('img')?.src || ''
      };

      addToCart(item);

      // Visual feedback
      const original = this.textContent;
      this.textContent = '✓';
      this.style.borderColor = '#4caf50';
      this.style.color = '#4caf50';
      setTimeout(() => {
        this.textContent = original;
        this.style.borderColor = '';
        this.style.color = '';
      }, 1200);
    });
  });

  function addToCart(item) {
    // Check if item already exists
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      item.quantity = 1;
      cart.push(item);
    }
    updateCart();
    showCartFeedback();
  }

  function removeFromCart(id) {
    const index = cart.findIndex(i => i.id === id);
    if (index > -1) {
      cart.splice(index, 1);
      updateCart();
    }
  }

  function updateCart() {
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCount.textContent = totalItems;

    // Update cart display
    if (cart.length === 0) {
      cartEmpty.style.display = 'flex';
      cartFooter.style.display = 'none';
      cartItems.innerHTML = '';
      cartItems.appendChild(cartEmpty);
    } else {
      cartEmpty.style.display = 'none';
      cartFooter.style.display = 'block';
      renderCartItems();
    }

    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    cartTotalValue.textContent = `R$ ${total.toFixed(0)}`;
  }

  function renderCartItems() {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-cat">${item.category}</p>
          <p class="cart-item-price">R$ ${item.price.toFixed(0)} ${item.quantity > 1 ? `x ${item.quantity}` : ''}</p>
          <button class="cart-item-remove" data-id="${item.id}">Remover</button>
        </div>
      </div>
    `).join('');

    // Add remove event listeners
    cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
  }

  function showCartFeedback() {
    cartBtn.style.transform = 'scale(1.1)';
    setTimeout(() => {
      cartBtn.style.transform = '';
    }, 200);
  }

  function openCart() {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Event listeners
  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  checkoutBtn.addEventListener('click', () => {
    closeCart();
    openCheckout();
  });

  // Checkout functionality
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutBackdrop = document.getElementById('checkoutBackdrop');
  const checkoutClose = document.getElementById('checkoutClose');
  const checkoutCancelBtn = document.getElementById('checkoutCancelBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutSubtotal = document.getElementById('checkoutSubtotal');
  const checkoutShipping = document.getElementById('checkoutShipping');
  const checkoutTotal = document.getElementById('checkoutTotal');
  const checkoutBody = document.getElementById('checkoutBody');

  // Card number formatting
  const cardNumberInput = document.getElementById('cardNumber');
  cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
  });

  // Expiry formatting
  const cardExpiryInput = document.getElementById('cardExpiry');
  cardExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
  });

  // CVV only numbers
  const cardCVVInput = document.getElementById('cardCVV');
  cardCVVInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  function openCheckout() {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const shipping = subtotal >= 350 ? 0 : 30;
    const total = subtotal + shipping;

    checkoutSubtotal.textContent = `R$ ${subtotal.toFixed(0)}`;
    checkoutShipping.textContent = shipping === 0 ? 'GRÁTIS' : `R$ ${shipping.toFixed(0)}`;
    checkoutTotal.textContent = `R$ ${total.toFixed(0)}`;

    checkoutModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckout() {
    checkoutModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  checkoutClose.addEventListener('click', closeCheckout);
  checkoutCancelBtn.addEventListener('click', closeCheckout);
  checkoutBackdrop.addEventListener('click', closeCheckout);

  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Simulate payment processing
    const submitBtn = checkoutForm.querySelector('.checkout-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando...';

    setTimeout(() => {
      // Show success message
      checkoutBody.innerHTML = `
        <div class="checkout-success">
          <div class="checkout-success-icon">✓</div>
          <h4>Pagamento Confirmado!</h4>
          <p>Seu pedido foi realizado com sucesso. Você receberá um e-mail de confirmação em breve.</p>
          <button class="btn btn--primary" id="successClose">Fechar</button>
        </div>
      `;

      document.getElementById('successClose').addEventListener('click', () => {
        closeCheckout();
        // Clear cart
        cart.length = 0;
        updateCart();

        // Reset form
        setTimeout(() => {
          checkoutForm.reset();
          checkoutBody.innerHTML = checkoutBody.innerHTML; // Reset to original
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirmar Pagamento';
        }, 500);
      });
    }, 2000);
  });

  // Initialize
  updateCart();
})();
