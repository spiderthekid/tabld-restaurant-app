// ============================================================
// TABLD — Discover Page (AI Natural Language Search & Filters)
// Connected with Supabase Data Layer
// ============================================================

window.Pages = window.Pages || {};
Pages.Discover = (function () {
  let _query = '';
  let _filters = { cuisine: 'all', budget: 'all', ambience: 'all', noiseLevel: 'all', accessibility: false };
  let _filterOpen = false;
  let _sortValue = 'default';
  let _aiParsedIntent = null;

  const BUDGETS      = ['₹', '₹₹', '₹₹₹', '₹₹₹₹'];
  const AMBIENCEOPTS = ['Intimate', 'Casual', 'Vibrant', 'Trendy', 'Romantic', 'Serene', 'Lively', 'Moody'];
  const NOISELEVELS  = ['Quiet', 'Moderate', 'Lively', 'Loud'];

  async function render() {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    _query = params.get('q') || '';
    const filterParam  = params.get('filter') || '';
    const cuisineParam = params.get('cuisine') || '';
    if (cuisineParam) _filters.cuisine = decodeURIComponent(cuisineParam);
    else if (!cuisineParam && !filterParam) _filters.cuisine = 'all';
    _sortValue = 'default';
    _aiParsedIntent = null;

    const cuisines   = await DB.getCuisines();
    const aiActive   = window.AI && AI.isEnabled();

    document.getElementById('app').innerHTML = `
      <div class="discover-page page-enter" id="discover-page">
        <div class="container">

          <!-- Header -->
          <div class="discover-header">
            <nav class="breadcrumb" aria-label="Breadcrumb">
              <span class="breadcrumb-item" onclick="navigate('/home')">Home</span>
              <span class="breadcrumb-sep">/</span>
              <span class="breadcrumb-current">Discover</span>
            </nav>
            <h1 class="discover-title" id="discover-heading">
              ${_query ? `Results for "<em style="color:var(--primary-light)">${_query}</em>"`
                : filterParam ? `${_capitalize(filterParam)} Restaurants`
                : _filters.cuisine !== 'all' ? `${_filters.cuisine} Restaurants`
                : 'Discover Restaurants'}
            </h1>
            <p style="color:var(--text-secondary);font-size:var(--text-base);margin-top:var(--sp-2)">
              Curated hidden gems and niche dining experiences.
            </p>
          </div>

          <!-- Search + Filter Toggle Row -->
          <div style="display:flex;gap:var(--sp-4);align-items:center;margin-bottom:var(--sp-6);flex-wrap:wrap">
            <div class="search-bar" style="flex:1;min-width:260px" role="search">
              <span class="search-bar-icon" aria-hidden="true">${aiActive ? '✨' : Components.icons.search}</span>
              <input id="discover-search" type="search"
                placeholder="${aiActive ? 'Try AI Search: "Quiet romantic place under ₹1500"' : 'Search by name, cuisine, or vibe…'}"
                value="${_query}" aria-label="Search restaurants" autocomplete="off">
            </div>
            <button class="filter-toggle-btn" id="filter-toggle-btn" onclick="toggleFilterPanel()"
              aria-label="Open filters" aria-expanded="false">
              ${Components.icons.filter} Filters
              <span id="filter-dot" class="badge badge-trending" style="padding:2px 6px;font-size:10px;margin-left:4px;${_hasActiveFilters() ? '' : 'display:none'}">●</span>
            </button>
          </div>

          <!-- Prompt Chips for Quick AI Searching -->
          <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-6);flex-wrap:wrap">
            <span style="font-size:var(--text-xs);color:var(--text-muted);align-self:center">Try prompts:</span>
            <button class="tag" onclick="setQuickSearchPrompt('Quiet café to study with good coffee')">☕ Quiet study café</button>
            <button class="tag" onclick="setQuickSearchPrompt('Romantic dinner under ₹1500')">🌹 Romantic dinner</button>
            <button class="tag" onclick="setQuickSearchPrompt('Rooftop restaurant for a birthday')">🎉 Birthday rooftop</button>
            <button class="tag" onclick="setQuickSearchPrompt('Authentic Japanese Omakase')">🍣 Japanese Omakase</button>
          </div>

          <!-- AI Intent Parsed Banner Container -->
          <div id="ai-intent-banner-wrap" style="margin-bottom:var(--sp-6)"></div>

          <!-- Active filter tags -->
          <div class="active-filters" id="active-filters">${_renderActiveFilters()}</div>

          <!-- Layout -->
          <div class="discover-layout">

            <!-- Filter Panel -->
            <aside class="filter-panel" id="filter-panel" aria-label="Restaurant filters">
              <div class="filter-panel-title">
                Filters
                <button class="btn btn-ghost btn-sm" id="clear-all-btn" onclick="clearAllFilters()"
                  aria-label="Clear all filters" style="${_hasActiveFilters() ? '' : 'visibility:hidden'}">Clear all</button>
              </div>

              <!-- Cuisine -->
              <div class="filter-section">
                <div class="filter-section-label">Cuisine</div>
                <div class="filter-options" id="cuisine-options">
                  <button class="filter-option ${_filters.cuisine === 'all' ? 'selected' : ''}"
                    onclick="setFilter('cuisine','all')" data-value="all">🍽️ All Cuisines</button>
                  ${cuisines.map(c => `
                    <button class="filter-option ${_filters.cuisine === c ? 'selected' : ''}"
                      onclick="setFilter('cuisine','${c}')" data-value="${c}">${c}</button>
                  `).join('')}
                </div>
              </div>

              <!-- Budget -->
              <div class="filter-section">
                <div class="filter-section-label">Budget</div>
                <div class="filter-options" id="budget-options">
                  <button class="filter-option ${_filters.budget === 'all' ? 'selected' : ''}"
                    onclick="setFilter('budget','all')" data-value="all">Any Budget</button>
                  ${BUDGETS.map(b => `
                    <button class="filter-option ${_filters.budget === b ? 'selected' : ''}"
                      onclick="setFilter('budget','${b}')" data-value="${b}">${b} — ${Components.priceLabel(b)}</button>
                  `).join('')}
                </div>
              </div>

              <!-- Ambience -->
              <div class="filter-section">
                <div class="filter-section-label">Ambience</div>
                <div class="filter-options" id="ambience-options">
                  <button class="filter-option ${_filters.ambience === 'all' ? 'selected' : ''}"
                    onclick="setFilter('ambience','all')" data-value="all">Any Ambience</button>
                  ${AMBIENCEOPTS.map(a => `
                    <button class="filter-option ${_filters.ambience === a ? 'selected' : ''}"
                      onclick="setFilter('ambience','${a}')" data-value="${a}">${a}</button>
                  `).join('')}
                </div>
              </div>

              <!-- Noise Level -->
              <div class="filter-section">
                <div class="filter-section-label">Noise Level</div>
                <div class="filter-options" id="noise-options">
                  <button class="filter-option ${_filters.noiseLevel === 'all' ? 'selected' : ''}"
                    onclick="setFilter('noiseLevel','all')" data-value="all">Any Noise Level</button>
                  ${NOISELEVELS.map(n => `
                    <button class="filter-option ${_filters.noiseLevel === n ? 'selected' : ''}"
                      onclick="setFilter('noiseLevel','${n}')" data-value="${n}">${n}</button>
                  `).join('')}
                </div>
              </div>

              <!-- Accessibility -->
              <div class="filter-section">
                <div class="filter-section-label">Accessibility</div>
                <div class="filter-options">
                  <button class="filter-option ${_filters.accessibility ? 'selected' : ''}"
                    onclick="toggleAccessibility()" id="filter-wheelchair">♿ Wheelchair Accessible</button>
                </div>
              </div>
            </aside>

            <!-- Results Grid -->
            <div>
              <div class="results-count" id="results-count-bar">
                <span>Showing <strong id="results-count-num">…</strong> restaurants</span>
                <div style="display:flex;align-items:center;gap:var(--sp-2)">
                  <label for="sort-select" style="font-size:var(--text-xs);color:var(--text-muted)">Sort:</label>
                  <select class="form-select" id="sort-select" onchange="sortResults(this.value)"
                    style="width:auto;font-size:var(--text-xs);padding:var(--sp-1) var(--sp-3)" aria-label="Sort options">
                    <option value="default">Recommended</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </div>
              </div>

              <div class="card-grid" id="results-grid" role="list" aria-label="Restaurant results">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>
        </div>
        ${Components.renderFooter()}
      </div>
    `;

    _bindEvents();
    await _executeSearch();
  }

  async function _executeSearch() {
    const grid    = document.getElementById('results-grid');
    const countEl = document.getElementById('results-count-num');
    const banner  = document.getElementById('ai-intent-banner-wrap');
    const user    = Auth.getCurrentUser();

    if (_query && _query.length > 2 && window.AI && AI.isEnabled()) {
      if (banner) {
        banner.innerHTML = `
          <div class="info-box" style="border-color:var(--primary-light);background:var(--primary-10)">
            <span class="toast-icon">✨</span>
            <div><strong>Gemini AI Interpreting Intent…</strong> Analyzing your prompt: "<em>${_query}</em>"</div>
          </div>
        `;
      }

      try {
        _aiParsedIntent = await AI.parseNaturalLanguageIntent(_query);

        if (banner) {
          banner.innerHTML = `
            <div style="background:var(--bg-card);border:1px solid var(--primary-light);border-radius:var(--r-xl);padding:var(--sp-5);box-shadow:var(--shadow-md)">
              <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-2)">
                <span class="badge badge-trending">✨ AI Intent Parsed</span>
                <span style="font-size:var(--text-xs);color:var(--text-muted)">Querying Tabld Database</span>
              </div>
              <p style="font-weight:600;color:var(--text);font-size:var(--text-sm);margin-bottom:var(--sp-3)">
                "${_aiParsedIntent.userIntentSummary || _query}"
              </p>
              <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2);font-size:var(--text-xs)">
                ${_aiParsedIntent.cuisines.length > 0 ? `<span class="tag">Cuisines: ${_aiParsedIntent.cuisines.join(', ')}</span>` : ''}
                ${_aiParsedIntent.budget !== 'all' ? `<span class="tag">Price: ${_aiParsedIntent.budget}</span>` : ''}
                ${_aiParsedIntent.noiseLevel !== 'all' ? `<span class="tag">Noise: ${_aiParsedIntent.noiseLevel}</span>` : ''}
                ${_aiParsedIntent.ambience !== 'all' ? `<span class="tag">Ambience: ${_aiParsedIntent.ambience}</span>` : ''}
                ${_aiParsedIntent.occasion ? `<span class="tag">Occasion: ${_aiParsedIntent.occasion}</span>` : ''}
              </div>
            </div>
          `;
        }

        const allApproved = await DB.getAllApproved();
        const results = Recommendations.searchWithAiIntent(_aiParsedIntent, user, allApproved);
        if (grid) grid.innerHTML = _renderResults(results);
        if (countEl) countEl.textContent = results.length;
        return;
      } catch(e) {
        if (banner) banner.innerHTML = '';
      }
    } else {
      if (banner) banner.innerHTML = '';
    }

    // Standard Search via Supabase
    const results = await DB.searchRestaurants(_query, _filters);
    if (grid) grid.innerHTML = _renderResults(results);
    if (countEl) countEl.textContent = results.length;
  }

  function _renderResults(results) {
    if (results.length === 0) return `
      <div class="no-results" style="grid-column:1/-1">
        <div style="font-size:3rem">🔍</div>
        <h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text-secondary)">No restaurants found</h3>
        <p style="color:var(--text-muted);font-size:var(--text-sm)">Try adjusting your search or removing some filters.</p>
        <button class="btn btn-outline" onclick="clearAllFilters()">Clear all filters</button>
      </div>
    `;
    return results.map(r => Components.restaurantCard(r)).join('');
  }

  function _renderActiveFilters() {
    const tags = [];
    if (_query) tags.push(`<button class="active-filter-tag" onclick="clearQuery()" aria-label="Remove search filter">"${_query}" ×</button>`);
    if (_filters.cuisine !== 'all') tags.push(`<button class="active-filter-tag" onclick="setFilter('cuisine','all')" aria-label="Remove cuisine filter">${_filters.cuisine} ×</button>`);
    if (_filters.budget !== 'all')  tags.push(`<button class="active-filter-tag" onclick="setFilter('budget','all')" aria-label="Remove budget filter">${_filters.budget} ×</button>`);
    if (_filters.ambience !== 'all')tags.push(`<button class="active-filter-tag" onclick="setFilter('ambience','all')" aria-label="Remove ambience filter">${_filters.ambience} ×</button>`);
    if (_filters.noiseLevel !== 'all') tags.push(`<button class="active-filter-tag" onclick="setFilter('noiseLevel','all')" aria-label="Remove noise filter">${_filters.noiseLevel} ×</button>`);
    if (_filters.accessibility) tags.push(`<button class="active-filter-tag" onclick="toggleAccessibility()" aria-label="Remove accessibility filter">♿ Accessible ×</button>`);
    return tags.join('');
  }

  function _hasActiveFilters() {
    return !!(_query || _filters.cuisine !== 'all' || _filters.budget !== 'all' ||
      _filters.ambience !== 'all' || _filters.noiseLevel !== 'all' || _filters.accessibility);
  }

  function _bindEvents() {
    let debounceTimer;
    const searchInput = document.getElementById('discover-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          _query = e.target.value.trim();
          _executeSearch();
        }, 400);
      });
    }
  }

  function _capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  window.setQuickSearchPrompt = function(promptText) {
    _query = promptText;
    const input = document.getElementById('discover-search');
    if (input) input.value = promptText;
    _executeSearch();
  };

  const GROUP_MAP = { cuisine: 'cuisine-options', budget: 'budget-options', ambience: 'ambience-options', noiseLevel: 'noise-options' };

  window.setFilter = function(group, value) {
    _filters[group] = value;
    const containerId = GROUP_MAP[group];
    if (containerId) {
      document.querySelectorAll(`#${containerId} .filter-option`).forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.value === value);
      });
    }
    _updateUi();
    _executeSearch();
  };

  window.toggleAccessibility = function() {
    _filters.accessibility = !_filters.accessibility;
    const btn = document.getElementById('filter-wheelchair');
    if (btn) btn.classList.toggle('selected', _filters.accessibility);
    _updateUi();
    _executeSearch();
  };

  window.clearQuery = function() {
    _query = '';
    const input = document.getElementById('discover-search');
    if (input) input.value = '';
    _updateUi();
    _executeSearch();
  };

  window.clearAllFilters = function() {
    _filters = { cuisine: 'all', budget: 'all', ambience: 'all', noiseLevel: 'all', accessibility: false };
    _query = '';
    const input = document.getElementById('discover-search');
    if (input) input.value = '';
    document.querySelectorAll('.filter-option').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.value === 'all');
    });
    const wc = document.getElementById('filter-wheelchair');
    if (wc) wc.classList.remove('selected');
    _updateUi();
    _executeSearch();
  };

  window.sortResults = function(val) {
    _sortValue = val;
    _executeSearch();
  };

  window.toggleFilterPanel = function() {
    _filterOpen = !_filterOpen;
    const panel = document.getElementById('filter-panel');
    const btn   = document.getElementById('filter-toggle-btn');
    if (panel) panel.classList.toggle('open', _filterOpen);
    if (btn) btn.setAttribute('aria-expanded', String(_filterOpen));
  };

  function _updateUi() {
    const active = document.getElementById('active-filters');
    if (active) active.innerHTML = _renderActiveFilters();
    const dot = document.getElementById('filter-dot');
    if (dot) dot.style.display = _hasActiveFilters() ? 'inline' : 'none';
    const clearBtn = document.getElementById('clear-all-btn');
    if (clearBtn) clearBtn.style.visibility = _hasActiveFilters() ? 'visible' : 'hidden';
  }

  return { render };
})();
