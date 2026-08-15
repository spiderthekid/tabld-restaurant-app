// ============================================================
// TABLD — Shared Components (Renderers + Global UI)
// Navbar, Toast, Lightbox, Modal helpers
// ============================================================

window.Components = (function () {
  // ─── SVG Icons ─────────────────────────────────────────────
  const icons = {
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
    home:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    compass:`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    user:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    store:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    logout: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    star:   `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    map:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
    pin:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    clock:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    phone:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 9.79a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    link:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    check:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    x:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    chevDown: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-section-chevron"><path d="m6 9 6 6 6-6"/></svg>`,
    arrow:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    users:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    calendar:`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    lock:   `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
    image:  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    left:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`,
    right:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
    info:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning:`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    menu:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    close:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    success:`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    wheel:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
    volume: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
    globe:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    persons:`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    badge:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    list:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    chart:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    dots:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
  };

  // ─── Navbar ───────────────────────────────────────────────────
  function renderNav() {
    const user = Auth.getCurrentUser();
    const navEl = document.getElementById('nav');
    if (!navEl) return;

    const currentHash = window.location.hash;
    const isOnboarding = currentHash.startsWith('#/onboarding') || (user && user.role === 'user' && !user.onboardingCompleted);

    if (isOnboarding) {
      // Minimal layout during onboarding — user cannot skip or escape
      navEl.innerHTML = `
        <div class="nav-inner">
          <div class="nav-logo" style="cursor:default" aria-label="Tabld Logo">Tabld</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Setup Profile</div>
          <div class="nav-actions">
            <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" aria-label="Logout" style="display:flex;align-items:center;gap:var(--sp-2)">
              ${icons.logout} <span>Exit Setup</span>
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Strictly scoped nav links per role
    const _navDest = user ? (user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner' : '/home') : '/home';
    const _avatarDest = user ? (user.role === 'owner' ? '/owner' : '/profile') : '/profile';
    const links = user ? (
      user.role === 'admin' ? [
        { label: 'Admin',          hash: '#/admin', icon: icons.shield },
      ] : user.role === 'owner' ? [
        { label: 'My Restaurant',  hash: '#/owner', icon: icons.store },
      ] : [
        { label: 'Home',           hash: '#/home',  icon: icons.home },
      ]
    ) : [];

    navEl.innerHTML = `
      <div class="nav-inner">
        <div class="nav-logo" onclick="navigate('${_navDest}')" aria-label="Tabld Home">Tabld</div>
        <nav class="nav-links" role="navigation" aria-label="Main navigation">
          ${links.map(l => `
            <button class="nav-link ${currentHash === l.hash ? 'active' : ''}"
              onclick="navigate('${l.hash.replace('#','')}')"
              aria-label="${l.label}">${l.label}</button>
          `).join('')}
        </nav>
        <div class="nav-actions">
          ${user ? `
            <div class="nav-avatar" onclick="navigate('${_avatarDest}')" title="${user.name}" role="button" tabindex="0" aria-label="View profile">
              <img src="${user.avatar}" alt="${user.name}" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}'">
            </div>
            <button class="btn btn-ghost btn-sm" onclick="Auth.logout()" aria-label="Logout">${icons.logout}</button>
          ` : `
            <button class="btn btn-ghost btn-sm" onclick="navigate('/login')" id="nav-login-btn">Login</button>
            <button class="btn btn-primary btn-sm" onclick="navigate('/register')" id="nav-register-btn">Join Tabld</button>
          `}
          <button class="nav-hamburger" id="hamburger-btn" aria-label="Toggle mobile menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="mobile-menu" id="mobile-menu" role="navigation" aria-label="Mobile navigation">
        ${links.map(l => `
          <button class="nav-link ${currentHash === l.hash ? 'active' : ''}"
            onclick="navigate('${l.hash.replace('#','')}'); closeMobileMenu()">
            ${l.label}
          </button>
        `).join('')}
        ${user ? `<button class="nav-link" onclick="Auth.logout()">${icons.logout} Sign Out</button>` : ''}
      </div>
    `;

    // Hamburger toggle
    const hamburger = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', isOpen);
      });
    }

    // Scroll effect
    function handleScroll() {
      navEl.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.removeEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
  }

  window.closeMobileMenu = () => {
    const m = document.getElementById('mobile-menu');
    if (m) m.classList.remove('open');
  };

  // ─── Restaurant Card ──────────────────────────────────────────
  function restaurantCard(r, opts = {}) {
    const isOpen = DB.isOpenNow(r);
    const openBadge = `<span class="open-indicator ${isOpen ? 'is-open' : 'is-closed'}"><span class="dot"></span>${isOpen ? 'Open Now' : 'Closed'}</span>`;

    const statusBadges = [
      r.featured    ? `<span class="badge badge-featured">★ Featured</span>` : '',
      r.trending    ? `<span class="badge badge-trending">↑ Trending</span>` : '',
      r.recentlyAdded?`<span class="badge badge-new">✦ New</span>` : '',
    ].filter(Boolean).join('');

    const user = Auth.getCurrentUser();
    const isSaved = user && user.savedRestaurants && user.savedRestaurants.includes(r.id);

    return `
      <article class="restaurant-card animate-fade-up" onclick="navigate('/restaurant/${r.id}')" role="button" tabindex="0"
        onkeypress="if(event.key==='Enter')navigate('/restaurant/${r.id}')"
        aria-label="View ${r.name}">
        <div class="card-img">
          <img src="${r.coverImage}" alt="${r.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70'">
          <div class="card-img-overlay"></div>
          <div class="card-badges">
            ${statusBadges}
            ${r.matchScore ? `<span class="badge badge-approved" style="font-weight:700">★ ${r.matchScore}% Match</span>` : ''}
          </div>
          <!-- Bookmark Button -->
          <button class="bookmark-btn ${isSaved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSaveRestaurant(${r.id})"
            aria-label="${isSaved ? 'Remove bookmark' : 'Bookmark restaurant'}" title="${isSaved ? 'Remove bookmark' : 'Save to favorites'}">
            ${isSaved ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="card-body">
          ${r.explanationTag ? `
            <div style="font-size:11px;font-weight:600;color:var(--primary-light);background:var(--primary-10);padding:3px 8px;border-radius:var(--r-sm);margin-bottom:var(--sp-2);display:inline-block">
              ${r.explanationTag.replace(/✨\s*/g, '')}
            </div>
          ` : ''}
          <div class="card-meta">
            <span class="card-cuisine">${r.cuisine}</span>
            <span class="card-dot"></span>
            <span class="card-price">${r.priceRange}</span>
            <span class="card-dot"></span>
            <span class="card-rating">
              <span class="star">${icons.star}</span>
              ${r.rating} (${r.reviewCount})
            </span>
          </div>
          <h3 class="card-title">${r.name}</h3>
          <p class="card-description">${r.shortDescription}</p>
          <div class="card-vibe-tags">
            ${r.vibeTags.slice(0,3).map(t => `<span class="vibe-tag">${t}</span>`).join('')}
          </div>
          <div class="card-footer">
            <span class="card-city">${icons.pin} ${r.city} · ${r.distanceKm}km</span>
            ${openBadge}
          </div>
        </div>
      </article>
    `;
  }

  // ─── Featured Card ─────────────────────────────────────────────
  function featuredCard(r) {
    return `
      <article class="featured-card" onclick="navigate('/restaurant/${r.id}')" role="button" tabindex="0"
        aria-label="Featured: ${r.name}">
        <img src="${r.coverImage}" alt="${r.name}" class="featured-card-img" loading="eager"
          onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70'">
        <div class="featured-card-overlay"></div>
        <div class="featured-card-badges">
          <span class="badge badge-featured">★ Featured</span>
        </div>
        <div class="featured-card-body">
          <span class="section-label" style="margin-bottom:var(--sp-3)">${r.cuisine}</span>
          <h3 style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;color:var(--text);margin-bottom:var(--sp-2);line-height:1.2;">${r.name}</h3>
          <div style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap;">
            <span style="font-size:var(--text-xs);color:rgba(250,250,249,0.7)">${icons.pin} ${r.city}</span>
            <span style="font-size:var(--text-xs);color:var(--accent);font-weight:600">${r.priceRange}</span>
            <span style="font-size:var(--text-xs);color:rgba(250,250,249,0.7)">${icons.star} ${r.rating}</span>
          </div>
          <div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-3);flex-wrap:wrap;">
            ${r.vibeTags.slice(0,2).map(t => `<span class="vibe-tag" style="background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.15);color:rgba(250,250,249,0.8)">${t}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }

  // ─── Toast System ─────────────────────────────────────────────
  let _toastContainer = null;
  function _ensureToastContainer() {
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.className = 'toast-container';
      _toastContainer.id = 'toast-container';
      document.body.appendChild(_toastContainer);
    }
    return _toastContainer;
  }

  function toast(title, msg = '', type = 'info', duration = 4000) {
    const container = _ensureToastContainer();
    const id = 'toast-' + Date.now();
    const iconMap = { success: icons.success, error: icons.error, info: icons.info, warning: icons.warning };

    const el = document.createElement('div');
    el.id = id;
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${iconMap[type] || icons.info}</span>
        <div class="toast-text">
          <div class="toast-title">${title}</div>
          ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
        </div>
      </div>
      <div class="toast-progress"></div>
    `;
    container.appendChild(el);

    setTimeout(() => {
      el.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, duration);

    return id;
  }

  // ─── Modal helpers ─────────────────────────────────────────────
  function openModal(html) {
    closeModal();
    const backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = html;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const existing = document.getElementById('modal-backdrop');
    if (existing) existing.remove();
    document.body.style.overflow = '';
  }

  // ─── Lightbox ──────────────────────────────────────────────────
  let _lbImages = [];
  let _lbIndex = 0;

  function openLightbox(images, startIndex = 0) {
    _lbImages = images;
    _lbIndex = startIndex;
    _renderLightbox();
  }

  function _renderLightbox() {
    let existing = document.getElementById('lightbox');
    if (existing) existing.remove();

    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" id="lb-close" aria-label="Close">${icons.close}</button>
      <button class="lightbox-nav lightbox-prev" id="lb-prev" aria-label="Previous">${icons.left}</button>
      <img class="lightbox-img" id="lb-img" src="${_lbImages[_lbIndex]}" alt="Gallery image ${_lbIndex + 1}">
      <button class="lightbox-nav lightbox-next" id="lb-next" aria-label="Next">${icons.right}</button>
    `;
    document.body.appendChild(lb);
    document.body.style.overflow = 'hidden';

    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', () => {
      _lbIndex = (_lbIndex - 1 + _lbImages.length) % _lbImages.length;
      document.getElementById('lb-img').src = _lbImages[_lbIndex];
    });
    document.getElementById('lb-next').addEventListener('click', () => {
      _lbIndex = (_lbIndex + 1) % _lbImages.length;
      document.getElementById('lb-img').src = _lbImages[_lbIndex];
    });
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

    // Keyboard
    function keyHandler(e) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') { _lbIndex = (_lbIndex - 1 + _lbImages.length) % _lbImages.length; document.getElementById('lb-img').src = _lbImages[_lbIndex]; }
      if (e.key === 'ArrowRight') { _lbIndex = (_lbIndex + 1) % _lbImages.length; document.getElementById('lb-img').src = _lbImages[_lbIndex]; }
    }
    document.addEventListener('keydown', keyHandler);
    lb._keyHandler = keyHandler;
  }

  function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (lb) {
      if (lb._keyHandler) document.removeEventListener('keydown', lb._keyHandler);
      lb.remove();
    }
    document.body.style.overflow = '';
  }

  // ─── Footer ────────────────────────────────────────────────────
  function renderFooter() {
    return `
      <footer class="footer" role="contentinfo">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div class="nav-logo" onclick="navigate('/home')" style="cursor:pointer;display:inline-block;font-size:var(--text-3xl)">Tabld</div>
              <p>Curated restaurant discovery for the genuinely curious diner. No deals. No sponsored placements. Just places worth your evening in Chennai.</p>
            </div>
            <div>
              <div class="footer-col-title" onclick="navigate('/discover')" style="cursor:pointer">Discover</div>
              <div class="footer-links">
                <span class="footer-link" onclick="navigate('/discover')">All Restaurants</span>
                <span class="footer-link" onclick="navigate('/discover?filter=featured')">Featured</span>
                <span class="footer-link" onclick="navigate('/discover?filter=trending')">Trending</span>
                <span class="footer-link" onclick="navigate('/discover?filter=new')">Recently Added</span>
              </div>
            </div>
            <div>
              <div class="footer-col-title" onclick="navigate('/profile')" style="cursor:pointer">Account</div>
              <div class="footer-links">
                <span class="footer-link" onclick="navigate('/profile')">My Profile</span>
                <span class="footer-link" onclick="navigate('/profile')">My Reservations</span>
              </div>
            </div>
          </div>
          <div class="footer-bottom">
            <span class="footer-copy">© ${new Date().getFullYear()} Tabld. All rights reserved. Built with intention.</span>
            <div class="flex gap-4">
              <span class="footer-link" onclick="navigate('/home')" style="cursor:pointer">Privacy</span>
              <span class="footer-link" onclick="navigate('/home')" style="cursor:pointer">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // ─── Nav Update ─────────────────────────────────────────────────
  function updateNav() {
    renderNav();
  }

  // ─── Greeting ───────────────────────────────────────────────────
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ─── Price Range helper ──────────────────────────────────────────
  function priceLabel(p) {
    const map = { '₹': 'Budget', '₹₹': 'Moderate', '₹₹₹': 'Upscale', '₹₹₹₹': 'Fine Dining' };
    return map[p] || p;
  }

  // ─── Noise badge ─────────────────────────────────────────────────
  function noiseBadge(level) {
    const cls = { 'Quiet': 'noise-quiet', 'Moderate': 'noise-moderate', 'Lively': 'noise-lively', 'Loud': 'noise-loud' };
    const icon = { 'Quiet': '🔇', 'Moderate': '🔉', 'Lively': '🔊', 'Loud': '📢' };
    return `<span class="${cls[level] || ''}" style="font-size:var(--text-xs);font-weight:600">${icon[level] || ''} ${level}</span>`;
  }

  // ─── Hours rendering ─────────────────────────────────────────────
  function renderHours(hours) {
    const dayMap = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const todayKey = dayMap[new Date().getDay()];
    const days = Object.entries(hours);
    return days.map(([day, h]) => `
      <div class="hours-row ${day === todayKey ? 'hours-today' : ''}">
        <span class="hours-day">${day.charAt(0).toUpperCase() + day.slice(1,3)}</span>
        <span class="hours-time ${h.closed ? 'hours-closed' : ''}">
          ${h.closed ? 'Closed' : `${h.open} – ${h.close}${h.dinner ? ` &amp; ${h.dinner}` : ''}`}
        </span>
      </div>
    `).join('');
  }

  // ─── Menu sections renderer ──────────────────────────────────────
  function renderMenu(menu) {
    if (!menu || menu.length === 0) return '<p class="text-muted text-sm">Menu not yet available.</p>';
    return menu.map((section, idx) => `
      <div class="menu-section ${idx === 0 ? 'open' : ''}" id="menu-section-${idx}">
        <div class="menu-section-header" onclick="toggleMenuSection(${idx})">
          <span class="menu-section-title">${section.section}</span>
          ${icons.chevDown}
        </div>
        <div class="menu-section-body">
          ${section.items.map(item => `
            <div class="menu-item">
              <div class="menu-item-info">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-desc">${item.description}</div>
              </div>
              <span class="menu-item-price">${item.price}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  window.toggleMenuSection = function(idx) {
    const el = document.getElementById(`menu-section-${idx}`);
    if (el) el.classList.toggle('open');
  };

  // ─── Accessibility renderer ──────────────────────────────────────
  function renderAccessibility(acc) {
    const items = [
      { key: 'wheelchairAccess', label: 'Wheelchair Access' },
      { key: 'brailleMenu',      label: 'Braille Menu' },
      { key: 'hearingLoop',      label: 'Hearing Loop' },
      { key: 'largeText',        label: 'Large Text Menu' },
    ];
    return `
      <div class="accessibility-grid">
        ${items.map(i => `
          <div class="accessibility-item">
            <span class="${acc[i.key] ? 'check' : 'cross'}">${acc[i.key] ? icons.check : icons.x}</span>
            <span style="font-size:var(--text-sm);color:${acc[i.key] ? 'var(--text)' : 'var(--text-muted)'}">${i.label}</span>
          </div>
        `).join('')}
      </div>
      ${acc.note ? `<p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--sp-3);font-style:italic">${acc.note}</p>` : ''}
    `;
  }

  // ─── Listing Application Modal ─────────────────────────────────
  function openListingApplicationModal() {
    const user = Auth.getCurrentUser();
    if (!user) {
      toast('Sign in required', 'Please sign in to apply for a restaurant listing.', 'warning');
      navigate('/login');
      return;
    }
    if (user.role === 'owner') {
      toast('Already an Owner', 'You already own a listed restaurant! Redirecting to your portal.', 'info');
      navigate('/owner');
      return;
    }
    if (user.role === 'admin') {
      toast('Administrator Role', 'Administrators manage listings from the Admin Dashboard.', 'info');
      navigate('/admin');
      return;
    }

    openModal(`
      <div class="modal modal-lg animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="modal-apply-title">
        <button class="modal-close" onclick="Components.closeModal()" aria-label="Close modal">×</button>
        <div style="margin-bottom:var(--sp-6)">
          <h2 id="modal-apply-title" style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-2)">Apply for a Restaurant Listing</h2>
          <p style="color:var(--text-secondary);font-size:var(--text-sm)">
            Submit your restaurant details for review by the Tabld team. Once approved by our admin, your account will be upgraded to <strong>Restaurant Owner</strong> with access to the Owner portal.
          </p>
        </div>
        <form onsubmit="Components.submitListingForm(event)">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="app-name">Restaurant Name *</label>
              <input class="form-input" id="app-name" type="text" required placeholder="e.g. Saffron & Spice">
            </div>
            <div class="form-group">
              <label class="form-label" for="app-cuisine">Cuisine *</label>
              <input class="form-input" id="app-cuisine" type="text" required placeholder="e.g. Japanese, Italian, Modern Indian">
            </div>
            <div class="form-group">
              <label class="form-label" for="app-city">City *</label>
              <input class="form-input" id="app-city" type="text" required value="Chennai" placeholder="e.g. Chennai">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="app-address">Full Address *</label>
              <input class="form-input" id="app-address" type="text" required placeholder="Street address, locality, city">
            </div>
            <div class="form-group">
              <label class="form-label" for="app-phone">Phone Number *</label>
              <input class="form-input" id="app-phone" type="tel" required placeholder="+91 98765 43210">
            </div>
            <div class="form-group">
              <label class="form-label" for="app-email">Business Email *</label>
              <input class="form-input" id="app-email" type="email" required placeholder="contact@restaurant.com">
            </div>
            <div class="form-group">
              <label class="form-label" for="app-price">Price Range</label>
              <select class="form-select" id="app-price">
                <option value="₹">₹ — Casual / Budget</option>
                <option value="₹₹" selected>₹₹ — Moderate</option>
                <option value="₹₹₹">₹₹₹ — Fine Dining</option>
                <option value="₹₹₹₹">₹₹₹₹ — Luxury</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="app-cover">Cover Image URL (optional)</label>
              <input class="form-input" id="app-cover" type="url" placeholder="https://images.unsplash.com/...">
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="app-desc">Short Description *</label>
              <textarea class="form-textarea" id="app-desc" rows="3" required placeholder="Tell us about the dining experience, key dishes, and ambience…"></textarea>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:var(--sp-3);margin-top:var(--sp-6)">
            <button type="button" class="btn btn-ghost" onclick="Components.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary btn-lg" id="app-submit-btn">Submit Application</button>
          </div>
        </form>
      </div>
    `);
  }

  async function submitListingForm(e) {
    e.preventDefault();
    const user = Auth.getCurrentUser();
    if (!user) return;

    const data = {
      name: document.getElementById('app-name')?.value,
      cuisine: document.getElementById('app-cuisine')?.value,
      city: document.getElementById('app-city')?.value,
      address: document.getElementById('app-address')?.value,
      phone: document.getElementById('app-phone')?.value,
      email: document.getElementById('app-email')?.value,
      priceRange: document.getElementById('app-price')?.value,
      coverImage: document.getElementById('app-cover')?.value,
      shortDescription: document.getElementById('app-desc')?.value,
    };

    const btn = document.getElementById('app-submit-btn');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    try {
      await DB.submitListingApplication(data, user.id);
      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
      closeModal();
      toast(
        'Application Submitted! 🎉',
        'Your restaurant listing application has been sent to our admin team. You will be upgraded to Restaurant Owner upon approval.',
        'success',
        6000
      );
    } catch (err) {
      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
      toast('Submission failed', err.message || 'Please try again.', 'error');
    }
  }

  async function openCancelReservationModal(resId, role = 'owner', onComplete = null) {
    const res = await DB.getReservationById(resId);
    if (!res) return;

    openModal(`
      <div class="modal animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="modal-cancel-title">
        <button class="modal-close" onclick="Components.closeModal()" aria-label="Close modal">×</button>
        <div style="margin-bottom:var(--sp-6)">
          <div style="font-size:2.5rem;margin-bottom:var(--sp-3)">❌</div>
          <h2 id="modal-cancel-title" style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-2)">Cancel Reservation</h2>
          <p style="color:var(--text-secondary);font-size:var(--text-sm)">
            Cancelling reservation for <strong>${res.restaurantName}</strong> (${res.date} at ${res.time}, ${res.guests} guests). Please provide a reason to inform the user.
          </p>
        </div>
        <form onsubmit="Components.submitCancelReservation(event, ${resId}, '${role}')">
          <div class="form-group" style="margin-bottom:var(--sp-6)">
            <label class="form-label" for="cancel-reason-input">Reason for Cancellation *</label>
            <textarea class="form-textarea" id="cancel-reason-input" rows="3" required
              placeholder="e.g. Unable to accommodate due to kitchen maintenance, fully booked, etc."></textarea>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:var(--sp-3)">
            <button type="button" class="btn btn-ghost" onclick="Components.closeModal()">Close</button>
            <button type="submit" class="btn btn-danger btn-lg" id="cancel-modal-submit-btn">Confirm Cancellation</button>
          </div>
        </form>
      </div>
    `);
    window._resCancelCallback = onComplete;
  }

  async function submitCancelReservation(e, resId, role) {
    e.preventDefault();
    const reason = document.getElementById('cancel-reason-input')?.value?.trim();
    if (!reason) return;

    const btn = document.getElementById('cancel-modal-submit-btn');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    await DB.cancelReservation(resId, reason, role);
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
    closeModal();
    toast('Reservation Cancelled', 'The guest will see the cancellation reason in their profile.', 'error');
    if (window._resCancelCallback) window._resCancelCallback();
  }

  async function openShiftReservationModal(resId, role = 'owner', onComplete = null) {
    const res = await DB.getReservationById(resId);
    if (!res) return;

    const origTime = res.originalTime || res.time;
    const shiftOptions = DB.getShiftOptions(origTime);

    if (shiftOptions.length === 0) {
      toast('Cannot Shift', 'No available time slots within 1 hour after original time.', 'warning');
      return;
    }

    openModal(`
      <div class="modal animate-scale-up" role="dialog" aria-modal="true" aria-labelledby="modal-shift-title">
        <button class="modal-close" onclick="Components.closeModal()" aria-label="Close modal">×</button>
        <div style="margin-bottom:var(--sp-6)">
          <div style="font-size:2.5rem;margin-bottom:var(--sp-3)">🕒</div>
          <h2 id="modal-shift-title" style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-2)">Shift Reservation Time</h2>
          <p style="color:var(--text-secondary);font-size:var(--text-sm)">
            Shift booking for <strong>${res.restaurantName}</strong> (Original: ${origTime}). You can shift up to <strong>1 hour after</strong> original time.
          </p>
        </div>
        <form onsubmit="Components.submitShiftReservation(event, ${resId}, '${role}')">
          <div class="form-group" style="margin-bottom:var(--sp-4)">
            <label class="form-label" for="shift-time-select">New Time Slot (Max +1 Hour) *</label>
            <select class="form-select" id="shift-time-select" required>
              ${shiftOptions.map(t => `<option value="${t}">${t} (${t > origTime ? '+' : ''}${_calcDiff(origTime, t)} mins)</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:var(--sp-6)">
            <label class="form-label" for="shift-reason-input">Message / Explanation for Guest *</label>
            <textarea class="form-textarea" id="shift-reason-input" rows="2" required
              placeholder="e.g. Table preparation delay, moved by 30 minutes."></textarea>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:var(--sp-3)">
            <button type="button" class="btn btn-ghost" onclick="Components.closeModal()">Close</button>
            <button type="submit" class="btn btn-primary btn-lg" id="shift-modal-submit-btn">Shift &amp; Update Guest</button>
          </div>
        </form>
      </div>
    `);
    window._resShiftCallback = onComplete;
  }

  function _calcDiff(t1, t2) {
    const p1 = t1.split(':').map(Number);
    const p2 = t2.split(':').map(Number);
    return (p2[0]*60 + p2[1]) - (p1[0]*60 + p1[1]);
  }

  async function submitShiftReservation(e, resId, role) {
    e.preventDefault();
    const newTime = document.getElementById('shift-time-select')?.value;
    const reason  = document.getElementById('shift-reason-input')?.value?.trim();
    if (!newTime || !reason) return;

    const btn = document.getElementById('shift-modal-submit-btn');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    await DB.shiftReservation(resId, newTime, reason, role);
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
    closeModal();
    toast('Reservation Shifted! 🕒', `Time updated to ${newTime}. Guest will see the update in their module.`, 'success');
    if (window._resShiftCallback) window._resShiftCallback();
  }

  return {
    icons, renderNav, restaurantCard, featuredCard,
    toast, openModal, closeModal,
    openLightbox, closeLightbox,
    renderFooter, updateNav, getGreeting,
    priceLabel, noiseBadge, renderHours, renderMenu, renderAccessibility,
    openListingApplicationModal, submitListingForm,
    openCancelReservationModal, submitCancelReservation,
    openShiftReservationModal, submitShiftReservation
  };
})();

// Global helpers
window.Toast = (title, msg, type) => Components.toast(title, msg, type);
window.closeModal = () => Components.closeModal();
window.openCancelReservationModal = (id, role, cb) => Components.openCancelReservationModal(id, role, cb);
window.openShiftReservationModal = (id, role, cb) => Components.openShiftReservationModal(id, role, cb);
window.toggleSaveRestaurant = function(restaurantId) {
  const user = Auth.getCurrentUser();
  if (!user) {
    Components.toast('Sign in required', 'Please log in to save restaurants to your favorites.', 'warning');
    navigate('/login');
    return;
  }
  user.savedRestaurants = user.savedRestaurants || [];
  const isSaved = user.savedRestaurants.includes(restaurantId);
  if (isSaved) {
    Recommendations.updateTasteProfile(user.id, 'UNSAVE_RESTAURANT', { restaurantId });
    Components.toast('Removed from Saved', 'Restaurant removed from your saved list.', 'info');
  } else {
    Recommendations.updateTasteProfile(user.id, 'SAVE_RESTAURANT', { restaurantId });
    Components.toast('Saved to Favorites! ❤️', 'Added to your saved list. Your AI taste profile has been updated.', 'success');
  }
  // Re-render active page to reflect bookmark UI change
  if (window.Router) {
    const cur = Router.current();
    if (cur.route === 'home') Pages.Home.render();
    else if (cur.route === 'discover') Pages.Discover.render();
    else if (cur.route === 'restaurant') Pages.Restaurant.render(cur.param);
    else if (cur.route === 'profile') Pages.Profile.render();
  }
};

