// ============================================================
// TABLD — Home Page (All-in-One Restaurant Discovery)
// Search + Filters + Personalized Recommendations on One Page
// Connected with Supabase Data Layer
// ============================================================

window.Pages = window.Pages || {};

Pages.Home = (function () {
  let _query = '';
  let _filters = { cuisine: 'all', budget: 'all', ambience: 'all', noiseLevel: 'all', accessibility: false };
  let _sortValue = 'default';

  const CATEGORIES = [
    { emoji: '🍛', label: 'Indian', filter: 'Indian' },
    { emoji: '🍜', label: 'Japanese', filter: 'Japanese' },
    { emoji: '🍝', label: 'Italian', filter: 'Italian' },
    { emoji: '🥙', label: 'Mediterranean', filter: 'Mediterranean' },
    { emoji: '🥩', label: 'American', filter: 'American' },
    { emoji: '🥘', label: 'Spanish', filter: 'Spanish' },
    { emoji: '🥗', label: 'Continental', filter: 'Continental' },
    { emoji: '🦞', label: 'Seafood', filter: 'Seafood' },
    { emoji: '🥢', label: 'Korean', filter: 'Korean' },
    { emoji: '🥐', label: 'French', filter: 'French' },
  ];

  const BUDGETS      = ['₹', '₹₹', '₹₹₹', '₹₹₹₹'];
  const AMBIENCEOPTS = ['Intimate', 'Casual', 'Vibrant', 'Trendy', 'Romantic', 'Serene', 'Lively', 'Moody'];
  const NOISELEVELS  = ['Quiet', 'Moderate', 'Lively', 'Loud'];

  function _renderUpcomingReservationsHtml(upcoming) {
    if (!upcoming || upcoming.length === 0) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fmt = (dateStr) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const daysUntil = (dateStr) => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
      if (diff === 0) return '🔴 Today';
      if (diff === 1) return '🟡 Tomorrow';
      return `in ${diff} days`;
    };

    const soonest = upcoming[0];
    const isShifted = soonest.originalTime && soonest.originalTime !== soonest.time;

    return `
      <div id="home-reservation-banner" style="
        background: linear-gradient(135deg, rgba(232,115,42,0.12) 0%, rgba(212,168,50,0.08) 100%);
        border: 1px solid rgba(232,115,42,0.3);
        border-radius: var(--r-2xl);
        padding: var(--sp-4) var(--sp-6);
        margin-bottom: var(--sp-6);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-4);
        flex-wrap: wrap;
        animation: fadeInDown 0.4s ease;
      ">
        <div style="display:flex;align-items:center;gap:var(--sp-4);flex:1;min-width:0">
          <div style="
            width:44px;height:44px;border-radius:var(--r-lg);
            background:var(--primary-10);border:1px solid var(--border-accent);
            display:flex;align-items:center;justify-content:center;
            font-size:1.3rem;flex-shrink:0
          ">🗓️</div>
          <div style="min-width:0">
            <div style="font-size:var(--text-xs);color:var(--primary-light);font-weight:700;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:2px">
              Upcoming Reservation ${upcoming.length > 1 ? `· ${upcoming.length} total` : ''} ${isShifted ? '· 🕒 Time Shifted' : ''}
            </div>
            <div style="font-family:var(--font-display);font-weight:600;color:var(--text);font-size:var(--text-base);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${soonest.restaurantName}
            </div>
            <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:2px">
              ${fmt(soonest.date)} · ${soonest.time} ${isShifted ? `<span style="text-decoration:line-through;opacity:0.65">(${soonest.originalTime})</span>` : ''} · ${soonest.guests} guest${soonest.guests > 1 ? 's' : ''}
              ${soonest.shiftReason ? `<span style="color:var(--warning);display:block;margin-top:1px">Note: "${soonest.shiftReason}"</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--sp-3);flex-shrink:0">
          <span style="
            font-size:var(--text-xs);font-weight:700;
            color:${soonest.status === 'confirmed' ? 'var(--success)' : 'var(--warning)'};
            background:${soonest.status === 'confirmed' ? 'var(--success-bg)' : 'var(--warning-bg)'};
            border:1px solid ${soonest.status === 'confirmed' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'};
            padding:2px 10px;border-radius:999px;
          ">${daysUntil(soonest.date)} · ${soonest.status === 'confirmed' ? 'Confirmed' : 'Pending'}</span>
          <button class="btn btn-outline btn-sm" onclick="navigate('/profile')" style="font-size:var(--text-xs);padding:6px 14px">
            View all
          </button>
        </div>
      </div>
    `;
  }

  async function render() {
    const user = Auth.getCurrentUser();
    const greeting  = Components.getGreeting();
    const firstName = user ? (user.name ? user.name.split(' ')[0] : 'there') : 'there';

    // Parse URL params if navigated with query
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    _query = params.get('q') || '';
    const cuisineParam = params.get('cuisine') || '';
    if (cuisineParam) _filters.cuisine = decodeURIComponent(cuisineParam);

    let upcomingHtml = '';
    if (user && user.role === 'user') {
      try {
        const userRes = await DB.getUserReservations(user.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = userRes
          .filter(r => r.status !== 'completed' && r.status !== 'cancelled')
          .filter(r => {
            const d = new Date(r.date);
            d.setHours(0, 0, 0, 0);
            return d >= today;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        upcomingHtml = _renderUpcomingReservationsHtml(upcoming);
      } catch (e) {}
    }

    const weatherData = Recommendations.getWeatherAwareRecommendations(user, 3);

    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="home-page page-enter" style="padding-top:calc(var(--nav-height) + var(--sp-4))">
        <div class="container">

          <!-- UPCOMING RESERVATION BANNER -->
          <div id="home-reservation-banner-wrap">${upcomingHtml}</div>

          <!-- TOP SEARCH HEADER -->
          <div style="margin-bottom:var(--sp-6)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4);flex-wrap:wrap;gap:var(--sp-2)">
              <div style="display:flex;align-items:center;gap:var(--sp-3)">
                <h1 style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;color:var(--text);margin:0">
                  ${greeting}, ${firstName} 👋
                </h1>
                <span class="badge badge-approved" style="font-size:11px">
                  ${weatherData.weather.icon} ${weatherData.weather.condition} · ${weatherData.weather.temp}
                </span>
              </div>
            </div>

            <!-- SEARCH BAR -->
            <div class="search-bar" role="search" style="box-shadow:var(--shadow-md)">
              <span class="search-bar-icon" aria-hidden="true">${Components.icons.search}</span>
              <input id="home-search-input" type="search" value="${_query}"
                placeholder="Search by what you feel: e.g. 'Quiet café to study', 'Romantic date night', 'Rooftop place'…"
                autocomplete="off" aria-label="Search restaurants">
            </div>
          </div>

          <!-- CUISINE PILL STRIP -->
          <nav class="category-strip" style="margin-bottom:var(--sp-6)" aria-label="Browse by cuisine">
            <div class="category-strip-inner" id="home-cuisine-strip">
              <button class="category-pill ${_filters.cuisine === 'all' ? 'active' : ''}" onclick="setHomeFilter('cuisine','all')">
                <span class="category-pill-emoji">🍽️</span> All Cuisines
              </button>
              ${CATEGORIES.map(c => `
                <button class="category-pill ${_filters.cuisine === c.filter ? 'active' : ''}" onclick="setHomeFilter('cuisine','${c.filter}')">
                  <span class="category-pill-emoji">${c.emoji}</span> ${c.label}
                </button>
              `).join('')}
            </div>
          </nav>

          <!-- QUICK FILTER CONTROLS ROW -->
          <div style="display:flex;gap:var(--sp-3);align-items:center;margin-bottom:var(--sp-6);flex-wrap:wrap">
            <!-- Budget filter select -->
            <select class="form-select" style="width:auto;font-size:var(--text-xs);padding:var(--sp-2) var(--sp-4)"
              onchange="setHomeFilter('budget', this.value)" aria-label="Budget filter">
              <option value="all" ${_filters.budget==='all'?'selected':''}>Any Budget</option>
              ${BUDGETS.map(b => `<option value="${b}" ${_filters.budget===b?'selected':''}>${b} — ${Components.priceLabel(b)}</option>`).join('')}
            </select>

            <!-- Ambience select -->
            <select class="form-select" style="width:auto;font-size:var(--text-xs);padding:var(--sp-2) var(--sp-4)"
              onchange="setHomeFilter('ambience', this.value)" aria-label="Ambience filter">
              <option value="all" ${_filters.ambience==='all'?'selected':''}>Any Ambience</option>
              ${AMBIENCEOPTS.map(a => `<option value="${a}" ${_filters.ambience===a?'selected':''}>${a}</option>`).join('')}
            </select>

            <!-- Noise level select -->
            <select class="form-select" style="width:auto;font-size:var(--text-xs);padding:var(--sp-2) var(--sp-4)"
              onchange="setHomeFilter('noiseLevel', this.value)" aria-label="Noise filter">
              <option value="all" ${_filters.noiseLevel==='all'?'selected':''}>Any Noise Level</option>
              ${NOISELEVELS.map(n => `<option value="${n}" ${_filters.noiseLevel===n?'selected':''}>${n} Noise</option>`).join('')}
            </select>

            <!-- Wheelchair checkbox toggle -->
            <button class="filter-option ${_filters.accessibility ? 'selected' : ''}" style="font-size:var(--text-xs)"
              onclick="toggleHomeAccessibility()">♿ Wheelchair Access</button>

            <!-- Sort selector -->
            <div style="margin-left:auto;display:flex;align-items:center;gap:var(--sp-2)">
              <select class="form-select" style="width:auto;font-size:var(--text-xs);padding:var(--sp-2) var(--sp-4)"
                onchange="sortHomeResults(this.value)" aria-label="Sort restaurants">
                <option value="default">Sort: Recommended</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low–High</option>
                <option value="price-high">Price: High–Low</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>

          <!-- ACTIVE FILTER TAGS -->
          <div class="active-filters" id="home-active-filters" style="margin-bottom:var(--sp-6)">
            ${_renderActiveFilters()}
          </div>

          <!-- MAIN RESTAURANTS GRID SECTION -->
          <div style="margin-bottom:var(--sp-12)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-4)">
              <h2 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text);margin:0" id="home-results-heading">
                ${_hasActiveFilters() ? 'Search Results' : 'Recommended For You'}
              </h2>
              <span style="font-size:var(--text-sm);color:var(--text-muted)">
                Showing <strong id="home-results-count" style="color:var(--text)">...</strong> tables
              </span>
            </div>

            <div class="card-grid" id="home-results-grid" role="list" aria-label="Restaurants">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- WEATHER-AWARE RECOMMENDATIONS SECTION -->
          ${!_hasActiveFilters() && weatherData.items.length > 0 ? `
            <section class="home-section section-gradient-amber" aria-labelledby="weather-heading" style="border-radius:var(--r-2xl);padding:var(--sp-8);margin-bottom:var(--sp-12)">
              <div class="section-header">
                <div>
                  <div class="section-label">${weatherData.weather.icon} Real-Time Context</div>
                  <h2 class="section-title" id="weather-heading">${weatherData.weather.condition} Picks</h2>
                  <p class="section-subtitle">Curated for right now — ${weatherData.weather.vibe} (${weatherData.weather.temp}).</p>
                </div>
              </div>
              <div class="card-grid" role="list" aria-label="Weather recommendations">
                ${weatherData.items.map(r => Components.restaurantCard(r)).join('')}
              </div>
            </section>
          ` : ''}

          <!-- CTA BAND FOR OWNERS -->
          <section style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-2xl);padding:var(--sp-8);text-align:center;margin-bottom:var(--sp-12)">
            <div class="section-label" style="justify-content:center;margin-bottom:var(--sp-3)">For Restaurant Owners</div>
            <h2 class="section-title" style="margin-bottom:var(--sp-3);font-size:var(--text-2xl)">Is Your Restaurant on Tabld?</h2>
            <p class="section-subtitle" style="max-width:480px;margin:0 auto var(--sp-6)">
              We list only the restaurants worth discovering. Apply for a listing review.
            </p>
            <button class="btn btn-outline" onclick="Components.openListingApplicationModal()">Apply for a Listing ${Components.icons.arrow}</button>
          </section>

        </div>
        ${Components.renderFooter()}
      </div>
    `;

    _bindHomeEvents();
    await _updateHomeResults();
  }

  // ─── Results Query & Rendering ────────────────────────────────
  let _intentSummary = '';

  async function _getHomeResults() {
    const user = Auth.getCurrentUser();
    const allApproved = await DB.getAllApproved();
    const hasQuery = _query && _query.trim().length > 1;
    const hasUiFilters = _filters.cuisine !== 'all' || _filters.budget !== 'all' ||
      _filters.ambience !== 'all' || _filters.noiseLevel !== 'all' || _filters.accessibility;

    let intent = {
      cuisines: _filters.cuisine !== 'all' ? [_filters.cuisine] : [],
      budget: _filters.budget,
      ambience: _filters.ambience,
      noiseLevel: _filters.noiseLevel,
      accessibility: _filters.accessibility,
      maxPriceLevel: 4,
      vibeTags: [],
      queryKeywords: []
    };
    _intentSummary = '';

    if (hasQuery) {
      try {
        const parsed = await AI.parseNaturalLanguageIntent(_query.trim());
        intent.cuisines   = _filters.cuisine !== 'all' ? [_filters.cuisine] : (parsed.cuisines || []);
        intent.budget     = _filters.budget !== 'all'  ? _filters.budget     : (parsed.budget || 'all');
        intent.noiseLevel = _filters.noiseLevel !== 'all' ? _filters.noiseLevel : (parsed.noiseLevel || 'all');
        intent.ambience   = _filters.ambience !== 'all'   ? _filters.ambience   : (parsed.ambience || 'all');
        intent.maxPriceLevel = parsed.maxPriceLevel || 4;
        intent.vibeTags      = parsed.vibeTags      || [];
        intent.queryKeywords = parsed.queryKeywords || _query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        _intentSummary = parsed.userIntentSummary || '';
      } catch (e) {
        intent.queryKeywords = _query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      }

      let results = Recommendations.searchWithAiIntent(intent, user, allApproved);
      if (_sortValue === 'rating')     results.sort((a,b) => b.rating - a.rating);
      if (_sortValue === 'price-low')  results.sort((a,b) => a.priceLevel - b.priceLevel);
      if (_sortValue === 'price-high') results.sort((a,b) => b.priceLevel - a.priceLevel);
      if (_sortValue === 'name')       results.sort((a,b) => a.name.localeCompare(b.name));
      return results;
    }

    if (hasUiFilters) {
      let results = Recommendations.searchWithAiIntent(intent, user, allApproved);
      if (_sortValue === 'rating')     results.sort((a,b) => b.rating - a.rating);
      if (_sortValue === 'price-low')  results.sort((a,b) => a.priceLevel - b.priceLevel);
      if (_sortValue === 'price-high') results.sort((a,b) => b.priceLevel - a.priceLevel);
      if (_sortValue === 'name')       results.sort((a,b) => a.name.localeCompare(b.name));
      return results;
    }

    let results = Recommendations.getPersonalizedRecommendations(user, 12, allApproved);
    if (_sortValue === 'rating')     results.sort((a,b) => b.rating - a.rating);
    if (_sortValue === 'price-low')  results.sort((a,b) => a.priceLevel - b.priceLevel);
    if (_sortValue === 'price-high') results.sort((a,b) => b.priceLevel - a.priceLevel);
    if (_sortValue === 'name')       results.sort((a,b) => a.name.localeCompare(b.name));
    return results;
  }

  function _showGridLoading() {
    const grid = document.getElementById('home-results-grid');
    const heading = document.getElementById('home-results-heading');
    const countEl = document.getElementById('home-results-count');
    if (heading) heading.textContent = 'Finding matches…';
    if (countEl) countEl.textContent = '…';
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;padding:var(--sp-12);text-align:center">
          <div style="display:inline-block;width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--primary-light);border-radius:50%;animation:spin 0.7s linear infinite;margin-bottom:var(--sp-4)"></div>
          <p style="color:var(--text-muted);font-size:var(--text-sm)">Looking for the best tables…</p>
        </div>
      `;
    }
  }

  async function _updateHomeResults() {
    const grid    = document.getElementById('home-results-grid');
    const countEl = document.getElementById('home-results-count');
    const heading = document.getElementById('home-results-heading');
    const active  = document.getElementById('home-active-filters');

    if (_query && _query.trim().length > 1) _showGridLoading();

    const results = await _getHomeResults();

    if (heading) {
      if (_query && _intentSummary) {
        heading.textContent = _intentSummary;
      } else if (_hasActiveFilters()) {
        heading.textContent = 'Search Results';
      } else {
        heading.textContent = 'Recommended For You';
      }
    }
    if (countEl) countEl.textContent = results.length;
    if (active) active.innerHTML = _renderActiveFilters();

    if (grid) {
      if (results.length === 0) {
        grid.innerHTML = `
          <div class="no-results" style="grid-column:1/-1;padding:var(--sp-12);text-align:center">
            <div style="font-size:3rem;margin-bottom:var(--sp-4)">🍽️</div>
            <h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text-secondary)">No restaurants found</h3>
            <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--sp-6)">New restaurants are being added. Check back soon or apply to list your venue!</p>
            <button class="btn btn-outline" onclick="clearHomeFilters()">Clear filters</button>
          </div>
        `;
      } else {
        grid.innerHTML = results.map(r => Components.restaurantCard(r)).join('');
      }
    }
  }

  function _renderActiveFilters() {
    const tags = [];
    if (_query) tags.push(`<button class="active-filter-tag" onclick="clearHomeQuery()">"${_query}" ×</button>`);
    if (_filters.cuisine !== 'all') tags.push(`<button class="active-filter-tag" onclick="setHomeFilter('cuisine','all')">${_filters.cuisine} ×</button>`);
    if (_filters.budget !== 'all')  tags.push(`<button class="active-filter-tag" onclick="setHomeFilter('budget','all')">${_filters.budget} ×</button>`);
    if (_filters.ambience !== 'all')tags.push(`<button class="active-filter-tag" onclick="setHomeFilter('ambience','all')">${_filters.ambience} ×</button>`);
    if (_filters.noiseLevel !== 'all') tags.push(`<button class="active-filter-tag" onclick="setHomeFilter('noiseLevel','all')">${_filters.noiseLevel} ×</button>`);
    if (_filters.accessibility) tags.push(`<button class="active-filter-tag" onclick="toggleHomeAccessibility()">♿ Wheelchair ×</button>`);
    return tags.join('');
  }

  function _hasActiveFilters() {
    return !!(_query || _filters.cuisine !== 'all' || _filters.budget !== 'all' ||
      _filters.ambience !== 'all' || _filters.noiseLevel !== 'all' || _filters.accessibility);
  }

  function _bindHomeEvents() {
    let debounceTimer;
    const input = document.getElementById('home-search-input');
    if (input) {
      input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const typed = e.target.value.trim();
        if (typed.length > 1) _showGridLoading();
        debounceTimer = setTimeout(() => {
          _query = typed;
          _updateHomeResults();
        }, 500);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(debounceTimer);
          _query = input.value.trim();
          _updateHomeResults();
        }
      });
    }
  }

  window.setHomeFilter = function(key, value) {
    _filters[key] = value;
    if (key === 'cuisine') {
      document.querySelectorAll('#home-cuisine-strip .category-pill').forEach(btn => {
        const isMatch = (value === 'all' && btn.textContent.includes('All')) || btn.textContent.includes(value);
        btn.classList.toggle('active', isMatch);
      });
    }
    _updateHomeResults();
  };

  window.toggleHomeAccessibility = function() {
    _filters.accessibility = !_filters.accessibility;
    _updateHomeResults();
  };

  window.sortHomeResults = function(val) {
    _sortValue = val;
    _updateHomeResults();
  };

  window.clearHomeQuery = function() {
    _query = '';
    const input = document.getElementById('home-search-input');
    if (input) input.value = '';
    _updateHomeResults();
  };

  window.clearHomeFilters = function() {
    _query = '';
    _filters = { cuisine: 'all', budget: 'all', ambience: 'all', noiseLevel: 'all', accessibility: false };
    _sortValue = 'default';
    const input = document.getElementById('home-search-input');
    if (input) input.value = '';
    document.querySelectorAll('#home-cuisine-strip .category-pill').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === 0);
    });
    _updateHomeResults();
  };

  return { render };
})();
