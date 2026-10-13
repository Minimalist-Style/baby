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

  // 10. WhatsApp Checkout Link Generator
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

      // Build Message Text
      let text = `Здравствуйте! Хочу сделать заказ в Baby Bee (г. Шемонаиха) 🐝:\n\n`;
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

      // Open WhatsApp
      window.open(waUrl, '_blank');
    });
  }
});
