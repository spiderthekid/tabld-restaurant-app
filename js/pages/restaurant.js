// ============================================================
// TABLD — Restaurant Detail Page
// Connected with Supabase Data Layer
// ============================================================

window.Pages = window.Pages || {};
Pages.Restaurant = (function () {

  async function render(idOrSlug) {
    if (!idOrSlug) { navigate('/discover'); return; }

    const isNumeric = !isNaN(Number(idOrSlug));
    const r = isNumeric
      ? (await DB.getRestaurantById(idOrSlug))
      : (await DB.getRestaurantBySlug(idOrSlug));

    if (!r || !r.approved) {
      document.getElementById('app').innerHTML = `
        <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--sp-8);text-align:center;padding-top:calc(var(--nav-height)+var(--sp-8))">
          <div style="font-size:4rem;margin-bottom:var(--sp-6)">🍽️</div>
          <h2 style="font-family:var(--font-display);font-size:var(--text-3xl);color:var(--text);margin-bottom:var(--sp-4)">Restaurant not found</h2>
          <p style="color:var(--text-secondary);margin-bottom:var(--sp-8)">This restaurant may have been removed or is not yet approved.</p>
          <button class="btn btn-primary btn-lg" onclick="navigate('/discover')">Back to Discover</button>
        </div>
      `;
      return;
    }

    const user = Auth.getCurrentUser();
    if (user && window.Recommendations) {
      Recommendations.updateTasteProfile(user.id, 'VIEW_RESTAURANT', { restaurantId: r.id });
    }

    const reviews = await DB.getReviews(r.id);
    const isOpen = DB.isOpenNow(r);
    const statusBadges = [
      r.featured     ? `<span class="badge badge-featured">★ Featured</span>` : '',
      r.trending     ? `<span class="badge badge-trending">↑ Trending</span>` : '',
      r.recentlyAdded? `<span class="badge badge-new">✦ New</span>` : '',
    ].filter(Boolean).join('');

    const isSaved = user && user.savedRestaurants && user.savedRestaurants.includes(r.id);

    document.getElementById('app').innerHTML = `
      <div class="restaurant-page page-enter" id="restaurant-page">

        <!-- HERO -->
        <header class="restaurant-hero" role="banner">
          <img src="${r.coverImage}" alt="${r.name}" class="restaurant-hero-img" loading="eager"
            onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=70'">
          <div class="restaurant-hero-overlay"></div>
          <div class="restaurant-hero-badges">${statusBadges}</div>
          <div class="restaurant-hero-content">
            <div style="margin-bottom:var(--sp-3)">
              <span style="font-size:var(--text-xs);font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--primary-light)">${r.cuisine}</span>
            </div>
            <h1 class="restaurant-name-hero">${r.name}</h1>
            <div class="restaurant-meta-hero">
              <span style="font-size:var(--text-sm);color:rgba(250,250,249,0.75);display:flex;align-items:center;gap:4px">${Components.icons.pin} ${r.address || r.city}</span>
              <span style="font-size:var(--text-sm);font-weight:700;color:var(--accent)">${r.priceRange}</span>
              <span style="font-size:var(--text-sm);color:rgba(250,250,249,0.75);display:flex;align-items:center;gap:4px">
                <span style="color:var(--accent)">${Components.icons.star}</span>
                ${r.rating} <span style="opacity:0.5">(${r.reviewCount || reviews.length} reviews)</span>
              </span>
              <span class="open-indicator ${isOpen ? 'is-open' : 'is-closed'}">
                <span class="dot"></span>${isOpen ? 'Open Now' : 'Closed'}
              </span>
              <button class="btn btn-secondary btn-sm" id="save-fav-btn" onclick="toggleSaveRestaurant(${r.id})" style="gap:6px;background:rgba(9,9,11,0.7);backdrop-filter:blur(10px)">
                ${isSaved ? '❤️ Saved' : '🤍 Save to Favorites'}
              </button>
            </div>
          </div>
        </header>

        <!-- BREADCRUMB + NAV -->
        <div class="container" style="padding-top:var(--sp-6)">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <span class="breadcrumb-item" onclick="navigate('/home')" role="link" tabindex="0">Home</span>
            <span class="breadcrumb-sep" aria-hidden="true">/</span>
            <span class="breadcrumb-item" onclick="navigate('/discover')" role="link" tabindex="0">Discover</span>
            <span class="breadcrumb-sep" aria-hidden="true">/</span>
            <span class="breadcrumb-current" aria-current="page">${r.name}</span>
          </nav>
        </div>

        <!-- MAIN LAYOUT -->
        <div class="restaurant-detail-layout">

          <!-- LEFT: Main Content -->
          <div>
            <!-- TABS -->
            <div class="tabs" role="tablist" aria-label="Restaurant information">
              <button class="tab active" role="tab" aria-selected="true" id="tab-overview" onclick="switchTab('overview')">Overview</button>
              <button class="tab" role="tab" aria-selected="false" id="tab-menu" onclick="switchTab('menu')">Menu</button>
              <button class="tab" role="tab" aria-selected="false" id="tab-gallery" onclick="switchTab('gallery')">Gallery</button>
              <button class="tab" role="tab" aria-selected="false" id="tab-reviews" onclick="switchTab('reviews')">Reviews (${reviews.length})</button>
              <button class="tab" role="tab" aria-selected="false" id="tab-info" onclick="switchTab('info')">Info & Accessibility</button>
            </div>

            <!-- TAB: Overview -->
            <div class="tab-content active" id="content-overview" role="tabpanel" aria-labelledby="tab-overview">
              <div style="margin-bottom:var(--sp-8)">
                <div class="section-label" style="margin-bottom:var(--sp-4)">The Tabld Take</div>
                <p style="font-size:var(--text-lg);color:var(--text-secondary);line-height:1.8;font-style:italic;border-left:3px solid var(--primary);padding-left:var(--sp-5)">
                  "${r.editorialDescription || r.shortDescription || 'A curated dining venue in Chennai.'}"
                </p>
              </div>

              <!-- Best Dishes -->
              <div style="margin-bottom:var(--sp-8)">
                <div class="section-label" style="margin-bottom:var(--sp-4)">Must-Order</div>
                <h3 style="font-family:var(--font-display);font-size:var(--text-2xl);margin-bottom:var(--sp-5);color:var(--text)">Best Dishes</h3>
                <div class="best-dishes-list">
                  ${r.bestDishes && r.bestDishes.length > 0 ? r.bestDishes.map(d => `
                    <div class="best-dish-item">
                      <span class="best-dish-star">★</span>
                      <span>${d}</span>
                    </div>
                  `).join('') : '<p class="text-muted text-sm">Best dishes coming soon.</p>'}
                </div>
              </div>

              <!-- Vibe Tags -->
              <div style="margin-bottom:var(--sp-8)">
                <div class="section-label" style="margin-bottom:var(--sp-4)">Vibe</div>
                <div class="tags-wrap">
                  ${(r.vibeTags || []).map(t => `<span class="vibe-tag">${t}</span>`).join('')}
                </div>
              </div>

              <!-- Noise level -->
              <div style="margin-bottom:var(--sp-6)">
                <div class="section-label" style="margin-bottom:var(--sp-3)">Atmosphere</div>
                <div style="display:flex;align-items:center;gap:var(--sp-4);flex-wrap:wrap">
                  <span style="font-size:var(--text-sm);color:var(--text-secondary);display:flex;align-items:center;gap:var(--sp-2)">
                    ${Components.icons.volume} Noise Level: ${Components.noiseBadge(r.noiseLevel)}
                  </span>
                  <span style="font-size:var(--text-sm);color:var(--text-secondary)">Ambience: <strong style="color:var(--text)">${r.ambience}</strong></span>
                </div>
              </div>

              <!-- Mobile booking CTA -->
              <div style="display:none;position:fixed;bottom:0;left:0;right:0;padding:var(--sp-4) var(--sp-4) calc(var(--sp-4) + env(safe-area-inset-bottom));background:rgba(9,9,11,0.95);border-top:1px solid var(--border);backdrop-filter:blur(20px);z-index:60" id="mobile-book-bar">
                <button class="btn btn-primary btn-xl btn-w-full" onclick="openReservationModal(${r.id})" id="mobile-book-btn">Book a Table</button>
              </div>
            </div>

            <!-- TAB: Menu -->
            <div class="tab-content" id="content-menu" role="tabpanel" aria-labelledby="tab-menu">
              <h3 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-6)">Menu</h3>
              ${Components.renderMenu(r.menu)}
            </div>

            <!-- TAB: Gallery -->
            <div class="tab-content" id="content-gallery" role="tabpanel" aria-labelledby="tab-gallery">
              <h3 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-6)">Photo Gallery</h3>
              <div class="gallery-grid" role="list" aria-label="Restaurant photos">
                ${(r.gallery || []).map((img, idx) => `
                  <div class="gallery-item" onclick="Components.openLightbox(${JSON.stringify(r.gallery)}, ${idx})"
                    role="button" tabindex="0" aria-label="View photo ${idx+1}">
                    <img src="${img}" alt="Gallery photo ${idx+1}" loading="lazy"
                      onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=60'">
                    <div class="gallery-item-overlay">${Components.icons.image}</div>
                  </div>
                `).join('')}
              </div>
              ${(!r.gallery || r.gallery.length === 0) ? '<p class="text-muted text-sm">Photos coming soon.</p>' : ''}
            </div>

            <!-- TAB: Reviews -->
            <div class="tab-content" id="content-reviews" role="tabpanel" aria-labelledby="tab-reviews">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-6);flex-wrap:wrap;gap:var(--sp-4)">
                <div>
                  <h3 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin:0">Verified Reviews</h3>
                  <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">Community feedback for ${r.name}</p>
                </div>
                ${user && user.role === 'user' ? `
                  <button class="btn btn-outline btn-sm" id="write-review-btn" onclick="showReviewForm()">✏️ Write a Review</button>
                ` : user && (user.role === 'owner' || user.role === 'admin') ? `
                  <span style="font-size:var(--text-xs);color:var(--text-muted);font-style:italic">Only diners can post reviews</span>
                ` : `
                  <button class="btn btn-outline btn-sm" onclick="navigate('/login')">Sign in to Review</button>
                `}
              </div>

              <!-- New Review Form -->
              <div id="new-review-box" style="display:none;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-6);margin-bottom:var(--sp-6);animation:fadeUp 0.2s ease">
                <h4 style="font-family:var(--font-display);font-size:var(--text-xl);margin-bottom:var(--sp-5);color:var(--text)">Share Your Experience</h4>

                <!-- Star picker -->
                <div class="form-group" style="margin-bottom:var(--sp-5)">
                  <label class="form-label">Your Rating</label>
                  <div class="rev-stars" id="rev-star-picker" role="radiogroup" aria-label="Star rating">
                    ${[1,2,3,4,5].map(n => `
                      <button class="rev-star" data-val="${n}" onclick="revSetStar(${n})" aria-label="${n} star${n>1?'s':''}" type="button">★</button>
                    `).join('')}
                  </div>
                  <input type="hidden" id="rev-rating" value="5">
                  <div id="rev-star-label" style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--sp-1)">Exceptional</div>
                </div>

                <div class="form-group" style="margin-bottom:var(--sp-4)">
                  <label class="form-label" for="rev-comment">Your Review <span style="color:#ef4444">*</span></label>
                  <textarea class="form-textarea" id="rev-comment" rows="4" placeholder="How was the food, service, and atmosphere? Your honest feedback helps other diners." style="resize:vertical"></textarea>
                </div>

                <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap">
                  <button class="btn btn-primary" id="rev-submit-btn" onclick="submitReview(${r.id})">Post Review</button>
                  <button class="btn btn-ghost" onclick="hideReviewForm()">Cancel</button>
                </div>
              </div>

              <div id="reviews-list" style="display:flex;flex-direction:column;gap:var(--sp-4)">
                ${reviews.length === 0 ? `
                  <div class="empty-state" style="padding:var(--sp-8)">
                    <div class="empty-state-icon">💬</div>
                    <h3>No reviews yet</h3>
                    <p>Be the first diner to leave a review after your visit!</p>
                  </div>
                ` : reviews.map(rev => `
                  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-5)">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-3)">
                      <div style="display:flex;align-items:center;gap:var(--sp-3)">
                        <img src="${rev.userAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(rev.userName || 'Diner')}"
                          style="width:36px;height:36px;border-radius:50%;object-fit:cover" alt="${rev.userName}">
                        <div>
                          <div style="font-weight:600;color:var(--text);font-size:var(--text-sm)">${rev.userName || 'Tabld Diner'}</div>
                          <div style="font-size:11px;color:var(--text-muted)">${new Date(rev.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}</div>
                        </div>
                      </div>
                      <div style="color:var(--accent);font-size:var(--text-sm)">
                        ${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}
                      </div>
                    </div>
                    <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin:0">${rev.comment || 'No comment written.'}</p>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- TAB: Info & Accessibility -->
            <div class="tab-content" id="content-info" role="tabpanel" aria-labelledby="tab-info">
              <div style="display:flex;flex-direction:column;gap:var(--sp-8)">
                <div>
                  <div class="section-label" style="margin-bottom:var(--sp-4)">Opening Hours</div>
                  <div class="hours-table" role="table" aria-label="Opening hours">
                    ${Components.renderHours(r.hours)}
                  </div>
                </div>

                <div>
                  <div class="section-label" style="margin-bottom:var(--sp-4)">Contact</div>
                  <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
                    ${r.phone ? `<a href="tel:${r.phone}" class="map-btn" aria-label="Call ${r.name}"><span class="map-btn-icon">${Components.icons.phone}</span>${r.phone}</a>` : ''}
                    ${r.email ? `<a href="mailto:${r.email}" class="map-btn" aria-label="Email ${r.name}"><span class="map-btn-icon">${Components.icons.mail}</span>${r.email}</a>` : ''}
                    ${r.website ? `<a href="${r.website}" target="_blank" rel="noopener" class="map-btn" aria-label="Visit ${r.name} website"><span class="map-btn-icon">${Components.icons.link}</span>${r.website}</a>` : ''}
                  </div>
                </div>

                <div>
                  <div class="section-label" style="margin-bottom:var(--sp-4)">Accessibility</div>
                  ${Components.renderAccessibility(r.accessibility)}
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Booking Widget & Hours -->
          <aside class="booking-widget-sticky">
            <div class="booking-widget" role="complementary" aria-label="Reservation booking">
              <h2 class="booking-widget-title">Book a Table</h2>
              <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-5)">
                ${r.capacity} covers · Reserve your spot
              </p>

              <div class="booking-form" id="booking-form-widget">
                <!-- Date -->
                <div class="form-group">
                  <label class="form-label" for="widget-date">${Components.icons.calendar} Date</label>
                  <input class="form-input" id="widget-date" type="date" min="${new Date().toISOString().split('T')[0]}"
                    value="${_getDefaultDate()}" aria-label="Reservation date">
                </div>

                <!-- Guests -->
                <div class="form-group">
                  <label class="form-label">${Components.icons.persons} Guests</label>
                  <div class="guest-selector">
                    <button class="guest-btn" onclick="changeGuests(-1)" aria-label="Decrease guests">−</button>
                    <span class="guest-count" id="guest-count">2</span>
                    <button class="guest-btn" onclick="changeGuests(1)" aria-label="Increase guests">+</button>
                  </div>
                  <div id="guest-cap-note" style="font-size:11px;color:var(--text-muted);margin-top:var(--sp-1)"></div>
                </div>

                <!-- Time Slots -->
                <div class="form-group">
                  <label class="form-label">${Components.icons.clock} Select Time</label>
                  <div id="time-slots-grid" style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
                    ${_renderTimeSlots(r)}
                  </div>
                  ${(!r.availableSlots || r.availableSlots.length === 0) ? `<p style="font-size:var(--text-xs);color:var(--error);margin-top:var(--sp-2)">No slots configured.</p>` : ''}
                </div>

                <!-- Notes -->
                <div class="form-group">
                  <label class="form-label" for="widget-notes">Special requests (optional)</label>
                  <textarea class="form-textarea" id="widget-notes" rows="2"
                    placeholder="Allergies, celebrations, seating preference…" aria-label="Special requests"></textarea>
                </div>

                ${_isUserRoleRestricted() ? `
                  <div class="warning-box" style="margin-top:var(--sp-3)">
                    ${Components.icons.lock}
                    <div style="font-size:var(--text-xs)">
                      <strong>Reservations Restricted</strong><br>
                      You are signed in as a <strong>${_getUserRoleTitle()}</strong>. Only regular diner accounts can book reservations.
                    </div>
                  </div>
                  <button class="btn btn-secondary btn-xl btn-w-full" disabled style="margin-top:var(--sp-3);opacity:0.6;cursor:not-allowed">
                    Diners Only
                  </button>
                ` : `
                  <button class="btn btn-primary btn-xl btn-w-full" id="book-now-btn" onclick="submitReservation(${r.id},'${r.name.replace(/'/g, "\\'")}')">
                    Confirm Reservation ${Components.icons.arrow}
                  </button>
                `}
              </div>
            </div>
          </aside>

        </div>

        ${Components.renderFooter()}
      </div>
    `;

    _initPage(r);
  }

  function _initPage(r) {
    const mobileBar = document.getElementById('mobile-book-bar');
    if (mobileBar) {
      function toggleMobileBar() {
        const shouldShow = window.innerWidth < 1100;
        mobileBar.style.display = shouldShow ? 'block' : 'none';
      }
      toggleMobileBar();
      window.addEventListener('resize', toggleMobileBar);
    }
  }

  function _getDefaultDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  function _renderTimeSlots(r) {
    const ownerSlots = r.availableSlots || [];
    const allPossible = DB.getAllPossibleSlots();
    const slotsToShow = ownerSlots.length > 0 ? ownerSlots : allPossible.slice(0, 8);
    const enabledSet  = new Set(slotsToShow);
    const caps        = r.slotCapacities || {};
    const defaultCap  = r.capacity || 20;

    let firstEnabled = null;
    const html = slotsToShow.map(t => {
      const isEnabled = enabledSet.has(t);
      if (isEnabled && !firstEnabled) firstEnabled = t;
      const slotCap = caps[t] !== undefined ? Number(caps[t]) : defaultCap;
      return `<button class="time-slot${firstEnabled === t ? ' selected' : ''}" onclick="selectTimeSlot(this,'${t}',${slotCap})" aria-label="Select ${t}, max ${slotCap} guests" data-time="${t}" data-cap="${slotCap}">
        <span>${t}</span>
        <span style="display:block;font-size:10px;opacity:0.7;margin-top:1px">max ${slotCap}</span>
      </button>`;
    }).join('');

    _selectedTime = firstEnabled || (slotsToShow[0] || '12:00');
    const initCap = caps[_selectedTime] !== undefined ? Number(caps[_selectedTime]) : defaultCap;
    _slotCap = initCap;
    _guests  = Math.min(_guests, _slotCap);
    return html;
  }

  window.switchTab = function(name) {
    document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const tabEl = document.getElementById(`tab-${name}`);
    const contentEl = document.getElementById(`content-${name}`);
    if (tabEl) { tabEl.classList.add('active'); tabEl.setAttribute('aria-selected','true'); }
    if (contentEl) contentEl.classList.add('active');
  };

  let _guests  = 2;
  let _slotCap = 20;
  window.changeGuests = function(delta) {
    _guests = Math.max(1, Math.min(_slotCap, _guests + delta));
    const el = document.getElementById('guest-count');
    if (el) el.textContent = _guests;
    const capNote = document.getElementById('guest-cap-note');
    if (capNote) capNote.textContent = `Max ${_slotCap} for this slot`;
  };

  let _selectedTime = '12:00';
  window.selectTimeSlot = function(btn, time, cap) {
    if (btn.disabled) return;
    document.querySelectorAll('#time-slots-grid .time-slot').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    _selectedTime = time;
    _slotCap = cap || 20;
    _guests  = Math.min(_guests, _slotCap);
    const countEl = document.getElementById('guest-count');
    if (countEl) countEl.textContent = _guests;
    const capNote = document.getElementById('guest-cap-note');
    if (capNote) capNote.textContent = `Max ${_slotCap} for this slot`;
  };

  function _isUserRoleRestricted() {
    const user = Auth.getCurrentUser();
    return user && (user.role === 'owner' || user.role === 'admin');
  }

  function _getUserRoleTitle() {
    const user = Auth.getCurrentUser();
    if (!user) return '';
    return user.role === 'admin' ? 'Administrator' : 'Restaurant Owner';
  }

  window.submitReservation = async function(restaurantId, restaurantName) {
    const user = Auth.getCurrentUser();
    if (!user) {
      Components.toast('Please sign in', 'You need to be logged in to make a reservation.', 'error');
      navigate('/login');
      return;
    }

    if (user.role === 'owner' || user.role === 'admin') {
      Components.toast('Restricted Action', 'Restaurant owners and administrators cannot make reservations.', 'error');
      return;
    }

    const date  = document.getElementById('widget-date')?.value;
    const notes = document.getElementById('widget-notes')?.value || '';
    const btn   = document.getElementById('book-now-btn');

    if (!date) { Components.toast('Select a date', 'Please choose your reservation date.', 'error'); return; }

    if (_guests > _slotCap) {
      Components.toast('Too many guests', `This time slot has a maximum capacity of ${_slotCap} guests.`, 'error');
      return;
    }

    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    try {
      const reservation = await DB.addReservation({
        userId: user.id,
        restaurantId,
        restaurantName,
        date,
        time: _selectedTime,
        guests: _guests,
        notes
      });

      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

      if (!reservation) {
        Components.toast('Booking failed', 'Could not save reservation. Please try again.', 'error');
        return;
      }

      const formEl = document.getElementById('booking-form-widget');
      if (formEl) {
        formEl.innerHTML = `
          <div style="text-align:center;padding:var(--sp-6) 0">
            <div style="font-size:3rem;margin-bottom:var(--sp-4)">🎉</div>
            <h3 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--success);margin-bottom:var(--sp-3)">Reservation Confirmed!</h3>
            <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-4)">
              <strong>${restaurantName}</strong><br>
              ${date} at ${_selectedTime} · ${_guests} guest${_guests !== 1 ? 's' : ''}
            </p>
            ${notes ? `<p style="font-size:var(--text-xs);color:var(--text-muted);font-style:italic;margin-bottom:var(--sp-4)">"${notes}"</p>` : ''}
            <div style="display:flex;flex-direction:column;gap:var(--sp-3);margin-top:var(--sp-6)">
              <button class="btn btn-primary btn-w-full" onclick="navigate('/profile')">View My Reservations</button>
              <button class="btn btn-secondary btn-w-full" onclick="navigate('/discover')">Discover More</button>
            </div>
          </div>
        `;
      }
      Components.toast('Table booked!', `${restaurantName} on ${date} at ${_selectedTime}`, 'success');
    } catch (err) {
      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
      Components.toast('Booking error', err.message || 'An error occurred.', 'error');
    }
  };

  window.toggleSaveRestaurant = async function(restaurantId) {
    const user = Auth.getCurrentUser();
    if (!user) {
      Components.toast('Sign in required', 'Please sign in to save restaurants.', 'info');
      navigate('/login');
      return;
    }
    const updated = await DB.toggleSavedRestaurant(user.id, restaurantId);
    user.savedRestaurants = updated;
    const isSaved = updated.includes(Number(restaurantId));
    const btn = document.getElementById('save-fav-btn');
    if (btn) btn.textContent = isSaved ? '❤️ Saved' : '🤍 Save to Favorites';
    Components.toast(isSaved ? 'Saved to Favorites' : 'Removed from Favorites', '', 'success');
  };

  window.showReviewForm = function() {
    const box = document.getElementById('new-review-box');
    if (box) {
      box.style.display = 'block';
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // initialise stars to 5
      revSetStar(5);
      // hide the trigger button
      const btn = document.getElementById('write-review-btn');
      if (btn) btn.style.display = 'none';
    }
  };
  window.hideReviewForm = function() {
    const box = document.getElementById('new-review-box');
    if (box) box.style.display = 'none';
    const btn = document.getElementById('write-review-btn');
    if (btn) btn.style.display = '';
    // reset
    const comment = document.getElementById('rev-comment');
    if (comment) comment.value = '';
    revSetStar(5);
  };

  window.revSetStar = function(val) {
    const hidden = document.getElementById('rev-rating');
    if (hidden) hidden.value = val;
    const labels = { 1: 'Poor', 2: 'Below Average', 3: 'Average', 4: 'Very Good', 5: 'Exceptional' };
    const labelEl = document.getElementById('rev-star-label');
    if (labelEl) labelEl.textContent = labels[val] || '';
    document.querySelectorAll('#rev-star-picker .rev-star').forEach((btn, idx) => {
      btn.classList.toggle('active', idx < val);
    });
  };

  window.submitReview = async function(restaurantId) {
    const user = Auth.getCurrentUser();
    if (!user) { navigate('/login'); return; }
    const rating  = Number(document.getElementById('rev-rating')?.value) || 5;
    const comment = document.getElementById('rev-comment')?.value?.trim() || '';

    if (!comment) {
      Components.toast('Review required', 'Please share a few words about your experience.', 'error');
      return;
    }

    const btn = document.getElementById('rev-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Posting…'; }

    const created = await DB.addReview({
      userId:     user.id,
      restaurantId,
      userName:   user.name || 'Diner',
      userAvatar: user.avatar,
      rating,
      comment
    });

    if (created) {
      Components.toast('Review posted! 🌟', 'Thank you for sharing your feedback.', 'success');
      render(restaurantId);
    } else {
      if (btn) { btn.disabled = false; btn.textContent = 'Post Review'; }
      Components.toast('Error', 'Could not post review. Please try again.', 'error');
    }
  };

  window.openReservationModal = function(restaurantId) {
    document.querySelector('.booking-widget')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return { render };
})();
