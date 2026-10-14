/**
 * Baby Bee Shemonaikha — Interactive E-Commerce Catalog
 * Phone / WhatsApp: +7 (777) 980-56-39
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    products: [],
    category: 'all',
    brand: 'all',
    search: '',
    selectedSizes: {}, // productId -> sizeIndex
    cart: []           // Array of { id, name, brand, image, price, spec, qty }
  };

  // DOM Elements
  const productsGrid = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const brandPills = document.querySelectorAll('.brand-pill');
  
  // Cart DOM Elements
  const cartBtn = document.getElementById('cartBtn');
  const floatingCartBtn = document.getElementById('floatingCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartTotalPrice = document.getElementById('cartTotalPrice');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const drawerItemsCount = document.getElementById('drawerItemsCount');
  const floatingBadge = document.getElementById('floatingBadge');
  const floatingTotal = document.getElementById('floatingTotal');
  const checkoutWhatsAppBtn = document.getElementById('checkoutWhatsAppBtn');

  // Input Fields in Cart
  const orderName = document.getElementById('orderName');
  const orderAddress = document.getElementById('orderAddress');
  const orderPayment = document.getElementById('orderPayment');

  // Category counts
  const countAll = document.getElementById('countAll');
  const countDiapers = document.getElementById('countDiapers');
  const countCare = document.getElementById('countCare');
  const countWipes = document.getElementById('countWipes');

  // Load saved cart from localStorage
  const savedCart = localStorage.getItem('babybee_cart');
  if (savedCart) {
    try {
      state.cart = JSON.parse(savedCart);
    } catch (e) {
      console.error('Error parsing cart from storage', e);
    }
  }

  // Load saved user info
  const savedName = localStorage.getItem('babybee_name');
  if (savedName && orderName) orderName.value = savedName;
  const savedAddress = localStorage.getItem('babybee_address');
  if (savedAddress && orderAddress) orderAddress.value = savedAddress;

  // 1. Fetch Products
  fetch('data/products.json')
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(data => {
      state.products = data;
      // Initialize default selected size (first size) for products that have sizes
      data.forEach(p => {
        if (p.sizes && p.sizes.length > 0) {
          state.selectedSizes[p.id] = 0;
        }
      });
      updateCategoryCounts();
      renderProducts();
      updateCartUI();
    })
    .catch(err => {
      console.error('Failed to load products.json', err);
      productsGrid.innerHTML = `
        <div class="empty-state">
          <p>Не удалось загрузить каталог товаров. Пожалуйста, обновите страницу.</p>
        </div>
      `;
    });

  // 2. Format Price Helper
  function formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
  }

  // 3. Update Category Badge Counts
  function updateCategoryCounts() {
    if (!countAll) return;
    countAll.textContent = state.products.length;
    countDiapers.textContent = state.products.filter(p => p.category === 'diapers').length;
    countCare.textContent = state.products.filter(p => p.category === 'care').length;
    countWipes.textContent = state.products.filter(p => p.category === 'wipes').length;
  }

  // 4. Render Products
  function renderProducts() {
    const filtered = state.products.filter(p => {
      const matchCat = state.category === 'all' || p.category === state.category;
      const matchBrand = state.brand === 'all' || p.brand.toLowerCase() === state.brand.toLowerCase();
      const matchSearch = state.search === '' ||
        p.name.toLowerCase().includes(state.search) ||
        p.brand.toLowerCase().includes(state.search) ||
        (p.description && p.description.toLowerCase().includes(state.search));
      return matchCat && matchBrand && matchSearch;
    });

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
          <h3>Товары не найдены</h3>
          <p style="color: var(--ink-500); margin-top: 6px;">Попробуйте выбрать другую категорию или сбросить поисковый запрос</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered.map(product => {
      // Sizes logic for diapers
      let sizeMarkup = '';
      if (product.sizes && product.sizes.length > 0) {
        const activeIdx = state.selectedSizes[product.id] || 0;
        const currentSize = product.sizes[activeIdx];
        
        const pills = product.sizes.map((s, idx) => `
          <button class="size-pill ${idx === activeIdx ? 'active' : ''}" data-product-id="${product.id}" data-size-idx="${idx}">
            ${s.size}
          </button>
        `).join('');

        sizeMarkup = `
          <div class="size-selector">
            <span class="size-selector__label">Выберите размер:</span>
            <div class="size-pills">
              ${pills}
            </div>
            <div class="size-meta-info" id="meta-${product.id}">
              ${currentSize.weight} • ${currentSize.count} шт
            </div>
          </div>
        `;
      } else if (product.volume) {
        sizeMarkup = `<div class="spec-info">Объем: ${product.volume}</div>`;
      } else if (product.count) {
        sizeMarkup = `<div class="spec-info">В пачке: ${product.count}</div>`;
      }

      return `
        <article class="product-card" id="card-${product.id}">
          ${product.badge ? `<span class="product-card__badge">${product.badge}</span>` : ''}
          <div class="product-card__img-wrap">
            <img src="${product.image}" alt="${product.name}" class="product-card__img" loading="lazy">
          </div>
          <div class="product-card__body">
            <span class="product-card__brand">${product.brand}</span>
            <h3 class="product-card__title">${product.name}</h3>
            <p class="product-card__desc">${product.description || ''}</p>
            ${sizeMarkup}
            <div class="product-card__footer">
              <span class="product-card__price">${formatPrice(product.price)}</span>
              <button class="btn-add-cart" data-add-id="${product.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>В корзину</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach Size Pill Listeners
    document.querySelectorAll('.size-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const prodId = e.currentTarget.dataset.productId;
        const sizeIdx = parseInt(e.currentTarget.dataset.sizeIdx, 10);
        state.selectedSizes[prodId] = sizeIdx;
        
        // Update DOM for this card only
        const card = document.getElementById(`card-${prodId}`);
        if (card) {
          card.querySelectorAll('.size-pill').forEach((p, idx) => {
            p.classList.toggle('active', idx === sizeIdx);
          });
          const product = state.products.find(p => p.id === prodId);
          if (product && product.sizes) {
            const meta = card.querySelector(`#meta-${prodId}`);
            if (meta) {
              const current = product.sizes[sizeIdx];
              meta.textContent = `${current.weight} • ${current.count} шт`;
            }
          }
        }
      });
    });

    // Attach Add to Cart Listeners
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = e.currentTarget.dataset.addId;
        addToCart(prodId, e.currentTarget);
      });
    });

    // Initialize 3D Card Tilt Parallax
    initProductCardTilt();
  }

  // 5. Add to Cart Logic
  function addToCart(productId, buttonElement) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    let specText = '';
    if (product.sizes && product.sizes.length > 0) {
      const activeIdx = state.selectedSizes[productId] || 0;
      const sizeObj = product.sizes[activeIdx];
      specText = `Размер ${sizeObj.size} (${sizeObj.weight}, ${sizeObj.count} шт)`;
    } else if (product.volume) {
      specText = product.volume;
    } else if (product.count) {
      specText = product.count;
    }

    // Check if item with this exact spec is already in cart
    const existingIndex = state.cart.findIndex(item => item.id === product.id && item.spec === specText);
    if (existingIndex > -1) {
      state.cart[existingIndex].qty += 1;
    } else {
      state.cart.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.price,
        spec: specText,
        qty: 1
      });
    }

    saveCart();
    updateCartUI();

    // Tactile Feedback on Button
    if (buttonElement) {
      buttonElement.classList.add('added');
      const originalContent = buttonElement.innerHTML;
      buttonElement.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Добавлено!</span>
      `;
      setTimeout(() => {
        buttonElement.classList.remove('added');
        buttonElement.innerHTML = originalContent;
      }, 1200);
    }
  }

  // 6. Save Cart to LocalStorage
  function saveCart() {
    localStorage.setItem('babybee_cart', JSON.stringify(state.cart));
  }

  // 7. Update Cart UI & Drawers
  function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Badges & Labels
    if (cartCountBadge) cartCountBadge.textContent = totalItems;
    if (drawerItemsCount) drawerItemsCount.textContent = totalItems;
    if (floatingBadge) floatingBadge.textContent = totalItems;
    if (floatingTotal) floatingTotal.textContent = formatPrice(totalPrice);
    if (cartTotalPrice) cartTotalPrice.textContent = formatPrice(totalPrice);

    // Sticky Floating Order Bar Sync
    const stickyOrderBar = document.getElementById('stickyOrderBar');
    const stickyBarCount = document.getElementById('stickyBarCount');
    const stickyBarTotal = document.getElementById('stickyBarTotal');
    if (stickyBarCount) {
      stickyBarCount.textContent = `${totalItems} ${totalItems === 1 ? 'товар' : (totalItems < 5 ? 'товара' : 'товаров')}`;
    }
    if (stickyBarTotal) {
      stickyBarTotal.textContent = formatPrice(totalPrice);
    }
    if (stickyOrderBar) {
      if (totalItems > 0) {
        stickyOrderBar.classList.add('visible');
      } else {
        stickyOrderBar.classList.remove('visible');
      }
    }

    // Render Items in Drawer
    if (!cartItemsList) return;

    if (state.cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="empty-cart-msg">
          <div class="icon-empty">🛒</div>
          <h4>Ваша корзина пуста</h4>
          <p>Выберите подгузники или эко-товары из каталога</p>
        </div>
      `;
      if (checkoutWhatsAppBtn) checkoutWhatsAppBtn.disabled = true;
      return;
    }

    if (checkoutWhatsAppBtn) checkoutWhatsAppBtn.disabled = false;

    cartItemsList.innerHTML = state.cart.map((item, idx) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item__img">
        <div>
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__spec">${item.spec}</div>
          <div class="cart-item__price">${formatPrice(item.price)}</div>
        </div>
        <div class="cart-item__controls">
          <button class="qty-btn" data-cart-action="dec" data-idx="${idx}">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-cart-action="inc" data-idx="${idx}">+</button>
        </div>
      </div>
    `).join('');

    // Cart control button listeners
    cartItemsList.querySelectorAll('[data-cart-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.cartAction;
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        if (action === 'inc') {
          state.cart[idx].qty += 1;
        } else if (action === 'dec') {
          state.cart[idx].qty -= 1;
          if (state.cart[idx].qty <= 0) {
            state.cart.splice(idx, 1);
          }
        }
        saveCart();
        updateCartUI();
      });
    });
  }

  // 8. Drawer Open / Close Logic
  function openCart() {
    cartDrawer.classList.add('open');
    cartBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.remove('open');
    cartBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (floatingCartBtn) floatingCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer.classList.contains('open')) {
      closeCart();
    }
  });

  // 9. Filters Handling
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.category = btn.dataset.category;
      renderProducts();
    });
  });

  brandPills.forEach(pill => {
    pill.addEventListener('click', () => {
      brandPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.brand = pill.dataset.brand;
      renderProducts();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value.trim().toLowerCase();
      renderProducts();
    });
  }

  // Initialize Celebration Modal & WOW effects
  const celebrationModalController = initCelebrationModal();
  initHeroMeshCanvas();
  initConfettiSystem();

  // 10. WhatsApp Checkout Link Generator with Celebratory Modal
  if (checkoutWhatsAppBtn) {
    checkoutWhatsAppBtn.addEventListener('click', () => {
      if (state.cart.length === 0) {
        alert('Пожалуйста, добавьте товары в корзину');
        return;
      }

      const clientName = (orderName ? orderName.value.trim() : '') || 'Не указано';
      const clientAddress = (orderAddress ? orderAddress.value.trim() : '') || 'г. Шемонаиха (уточню в чате)';
      const paymentMethod = (orderPayment ? orderPayment.value : 'Kaspi QR / Kaspi Gold');

      // Save client details for next time
      if (orderName) localStorage.setItem('babybee_name', orderName.value);
      if (orderAddress) localStorage.setItem('babybee_address', orderAddress.value);

      // Generate Unique Order Code
      const orderCode = `#BB-${Math.floor(10000 + Math.random() * 90000)}`;

      // Build Message Text
      let text = `Здравствуйте! Хочу сделать заказ в Baby Bee (г. Шемонаиха) 🐝:\n`;
      text += `📦 *Заказ:* ${orderCode}\n\n`;
      text += `🛒 *Состав заказа:*\n`;

      let total = 0;
      state.cart.forEach((item, index) => {
        const itemSum = item.price * item.qty;
        total += itemSum;
        text += `${index + 1}. *${item.name}*\n   [${item.spec}] × ${item.qty} шт = ${formatPrice(itemSum)}\n`;
      });

      text += `\n💰 *Итого к оплате:* ${formatPrice(total)}\n`;
      text += `📍 *Адрес доставки:* ${clientAddress}\n`;
      text += `💳 *Оплата:* ${paymentMethod}\n`;
      text += `👤 *Имя:* ${clientName}\n\n`;
      text += `Пожалуйста, подтвердите наличие и время доставки! 🙏`;

      const encodedText = encodeURIComponent(text);
      const waUrl = `https://wa.me/77779805639?text=${encodedText}`;

      // 1. Close cart drawer
      closeCart();

      // 2. Open celebratory modal & fire confetti
      if (celebrationModalController) {
        celebrationModalController.open(orderCode, total, clientAddress, waUrl);
      }
    });
  }

  // =========================================================================
  // 11. Hero Interactive Canvas Wave Mesh
  // =========================================================================
  function initHeroMeshCanvas() {
    const canvas = document.getElementById('heroMeshCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;
    let cols = 12;
    let rows = 7;
    let points = [];
    let mouse = { x: -1000, y: -1000, active: false };
    let animFrame = null;
    let isVisible = true;
    let time = 0;

    function resize() {
      const rect = heroSection.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Create grid of points
      points = [];
      const colStep = width / (cols - 1);
      const rowStep = height / (rows - 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const originX = c * colStep;
          const originY = r * rowStep;
          points.push({
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
            col: c,
            row: r
          });
        }
      }
    }

    window.addEventListener('resize', resize);
    resize();

    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    heroSection.addEventListener('mouseleave', () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible && !animFrame) {
            animFrame = requestAnimationFrame(renderMesh);
          }
        });
      }, { threshold: 0.05 });
      observer.observe(heroSection);
    }

    function renderMesh() {
      if (!isVisible) {
        animFrame = null;
        return;
      }

      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      // Update points with wave + mouse repulsion physics
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const waveX = Math.sin(time + p.row * 0.45) * 4;
        const waveY = Math.cos(time + p.col * 0.45) * 6;
        const targetX = p.originX + waveX;
        const targetY = p.originY + waveY;

        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180;
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 35;
            p.vx -= (dx / dist) * force * 0.2;
            p.vy -= (dy / dist) * force * 0.2;
          }
        }

        p.vx += (targetX - p.x) * 0.08;
        p.vy += (targetY - p.y) * 0.08;
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
      }

      // Draw horizontal lines
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        for (let c = 0; c < cols; c++) {
          const p = points[r * cols + c];
          if (c === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(245, 166, 35, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw vertical lines
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        for (let r = 0; r < rows; r++) {
          const p = points[r * cols + c];
          if (r === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(13, 162, 231, 0.07)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw subtle glowing honey dots
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 166, 35, 0.35)';
        ctx.fill();
      }

      animFrame = requestAnimationFrame(renderMesh);
    }

    animFrame = requestAnimationFrame(renderMesh);
  }

  // =========================================================================
  // 12. 3D Card Tilt & Specular Parallax
  // =========================================================================
  function initProductCardTilt() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      if (card.dataset.tiltInitialized) return;
      card.dataset.tiltInitialized = 'true';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = -((y - centerY) / centerY) * 6.5;
        const rotateY = ((x - centerX) / centerX) * 6.5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
        card.style.removeProperty('--mouse-x');
        card.style.removeProperty('--mouse-y');
      });
    });
  }

  // =========================================================================
  // 13. Confetti Cannon Particle System
  // =========================================================================
  function initConfettiSystem() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const colors = ['#F59E0B', '#FBBF24', '#10B981', '#34D399', '#FDE68A', '#0284C7', '#FFFFFF', '#EC4899'];

    fireCelebrationConfetti = function() {
      resize();
      particles = [];
      const count = 90;
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight * 0.45;

      for (let i = 0; i < count; i++) {
        const angle = Math.PI * 2 * Math.random();
        const speed = 4 + Math.random() * 12;
        particles.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 6 + Math.random() * 8,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 12,
          gravity: 0.32,
          drag: 0.98,
          opacity: 1,
          shape: Math.random() > 0.4 ? 'rect' : 'circle'
        });
      }

      if (!animId) {
        animId = requestAnimationFrame(updateConfetti);
      }
    };

    function updateConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.007;

        if (p.opacity > 0 && p.y < canvas.height + 20) {
          aliveCount++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animId = requestAnimationFrame(updateConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animId = null;
      }
    }
  }

  // =========================================================================
  // 14. Stitch-Inspired Celebration Modal Logic
  // =========================================================================
  function initCelebrationModal() {
    const celebrationBackdrop = document.getElementById('celebrationBackdrop');
    const closeCelebrationBtn = document.getElementById('closeCelebrationBtn');
    const continueShoppingBtn = document.getElementById('continueShoppingBtn');
    const copyCelebrationOrderBtn = document.getElementById('copyCelebrationOrderBtn');
    const celebrationOrderId = document.getElementById('celebrationOrderId');
    const celebrationAddressVal = document.getElementById('celebrationAddressVal');
    const celebrationTotalVal = document.getElementById('celebrationTotalVal');
    const celebrationWhatsAppLink = document.getElementById('celebrationWhatsAppLink');

    if (!celebrationBackdrop) return null;

    function openCelebrationModal(orderCode, total, address, waUrl) {
      if (celebrationOrderId) celebrationOrderId.textContent = orderCode;
      if (celebrationTotalVal) celebrationTotalVal.textContent = formatPrice(total);
      if (celebrationAddressVal) celebrationAddressVal.textContent = address;
      if (celebrationWhatsAppLink) celebrationWhatsAppLink.href = waUrl;

      celebrationBackdrop.classList.add('open');
      celebrationBackdrop.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Launch golden confetti celebration!
      if (typeof fireCelebrationConfetti === 'function') {
        fireCelebrationConfetti();
      }
    }

    function closeCelebrationModal() {
      celebrationBackdrop.classList.remove('open');
      celebrationBackdrop.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (closeCelebrationBtn) closeCelebrationBtn.addEventListener('click', closeCelebrationModal);
    if (continueShoppingBtn) continueShoppingBtn.addEventListener('click', closeCelebrationModal);
    celebrationBackdrop.addEventListener('click', (e) => {
      if (e.target === celebrationBackdrop) closeCelebrationModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && celebrationBackdrop.classList.contains('open')) {
        closeCelebrationModal();
      }
    });

    if (copyCelebrationOrderBtn && celebrationOrderId) {
      copyCelebrationOrderBtn.addEventListener('click', () => {
        const text = celebrationOrderId.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const originalHTML = copyCelebrationOrderBtn.innerHTML;
          copyCelebrationOrderBtn.innerHTML = `<span style="color:#10B981; font-weight:800; font-size:12px;">✓</span>`;
          setTimeout(() => {
            copyCelebrationOrderBtn.innerHTML = originalHTML;
          }, 2000);
        });
      });
    }

    return { open: openCelebrationModal, close: closeCelebrationModal };
  }

  // 11. Stitch Storefront: Smart Size Finder by Baby Weight
  function initSmartSizeFinder() {
    const weightSlider = document.getElementById('weightSlider');
    const currentWeightVal = document.getElementById('currentWeightVal');
    const recSizeName = document.getElementById('recSizeName');
    const recSizeDesc = document.getElementById('recSizeDesc');
    const applySizeFilterBtn = document.getElementById('applySizeFilterBtn');
    const pills = document.querySelectorAll('#weightPillsContainer .weight-pill');

    if (!weightSlider || !currentWeightVal) return;

    const sizeTiers = [
      { max: 5.0, sizeName: 'Размер 1 (NB / 3–5 кг)', desc: 'Идеально для новорожденных. Ультрамягкий слой с вырезом для пупочной ранки.' },
      { max: 7.9, sizeName: 'Размер 2 (Mini / 4–8 кг)', desc: 'Для первых месяцев. Мгновенно впитывает жидкий стул и бережет кожу от опрелостей.' },
      { max: 11.9, sizeName: 'Размер 3 (Midi / 6–11 кг)', desc: 'Оптимально на вес 6–11 кг. Мягкий анатомический поясок не сдавливает животик после еды.' },
      { max: 14.9, sizeName: 'Размер 4 (Maxi / 9–14 кг)', desc: 'Свобода движений для активных ползунков. Двойные бортики надёжно защищают от боковых протеканий.' },
      { max: 17.9, sizeName: 'Размер 5 (Junior / 12–18 кг)', desc: 'Повышенная вместимость для подросших малышей. До 12 часов сухого спокойного сна.' },
      { max: 99.0, sizeName: 'Размер 6/7 (Extra / 15–25 кг)', desc: 'Максимальный комфорт для самых рослых малышей и приучения к горшку.' }
    ];

    function updateRecommendation(weight) {
      currentWeightVal.textContent = weight.toFixed(1);
      const tier = sizeTiers.find(t => weight <= t.max) || sizeTiers[sizeTiers.length - 1];
      if (recSizeName) recSizeName.textContent = tier.sizeName;
      if (recSizeDesc) recSizeDesc.textContent = tier.desc;

      // Update active pill
      pills.forEach(pill => {
        const pillWeight = parseFloat(pill.getAttribute('data-weight'));
        if (Math.abs(pillWeight - weight) < 1.5) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
    }

    weightSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      updateRecommendation(val);
    });

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const val = parseFloat(pill.getAttribute('data-weight'));
        weightSlider.value = val;
        updateRecommendation(val);
      });
    });

    if (applySizeFilterBtn) {
      applySizeFilterBtn.addEventListener('click', () => {
        // Switch category to diapers
        state.category = 'diapers';
        filterBtns.forEach(btn => {
          if (btn.getAttribute('data-category') === 'diapers') {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
        renderProducts();

        // Scroll to catalog smoothly
        const catalogEl = document.getElementById('catalog');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Initial run
    updateRecommendation(parseFloat(weightSlider.value || 7.5));
  }

  // 12. Stitch Storefront: Value Bundles / Combos
  function initCombosSection() {
    const addComboBtns = document.querySelectorAll('.btn--add-combo');
    addComboBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-combo-id');
        const name = btn.getAttribute('data-combo-name');
        const price = parseInt(btn.getAttribute('data-combo-price'), 10);
        const image = btn.getAttribute('data-combo-img');

        const existing = state.cart.find(i => i.id === id);
        if (existing) {
          existing.qty += 1;
        } else {
          state.cart.push({
            id: id,
            name: name,
            brand: 'Baby Bee Набор',
            image: image,
            price: price,
            spec: 'Выгодный комплект (акция)',
            qty: 1
          });
        }

        saveCart();
        updateCartUI();

        // Tactile feedback
        const origHTML = btn.innerHTML;
        btn.innerHTML = `<span>✓ Добавлено!</span>`;
        btn.style.background = '#10B981';
        btn.style.color = '#FFFFFF';
        setTimeout(() => {
          btn.innerHTML = origHTML;
          btn.style.background = '';
          btn.style.color = '';
        }, 1500);
      });
    });
  }

  // Sticky Bar Checkout Button Trigger
  const stickyCheckoutBtn = document.getElementById('stickyCheckoutBtn');
  if (stickyCheckoutBtn && cartDrawer && cartBackdrop) {
    stickyCheckoutBtn.addEventListener('click', () => {
      cartDrawer.classList.add('open');
      cartBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  // Initialize new storefront modules
  initSmartSizeFinder();
  initCombosSection();
});
