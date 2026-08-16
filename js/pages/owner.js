// ============================================================
// TABLD — Owner Portal
// Connected with Supabase Data Layer
// ============================================================

window.Pages = window.Pages || {};
Pages.Owner = (function () {
  let _activeSection = 'profile';
  let _restaurant = null;

  async function render() {
    if (!Auth.requireRole('owner')) return;
    const user = Auth.getCurrentUser();
    _restaurant = await DB.getOwnerRestaurant(user.id);
    const reservations = _restaurant ? await DB.getRestaurantReservations(_restaurant.id) : [];

    document.getElementById('app').innerHTML = `
      <div class="dashboard-layout">

        <!-- Sidebar -->
        <aside class="sidebar" aria-label="Owner portal navigation">
          <div style="margin-bottom:var(--sp-6)">
            <div style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;color:var(--text);margin-bottom:var(--sp-1)">${user.name}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Restaurant Owner</div>
          </div>
          <nav class="sidebar-nav" role="navigation" aria-label="Owner sections">
            <button class="sidebar-item active" id="sb-profile" onclick="ownerSection('profile')" aria-label="Restaurant Profile">
              <span class="sidebar-icon">${Components.icons.store}</span> My Restaurant
            </button>
            <button class="sidebar-item" id="sb-slots" onclick="ownerSection('slots')" aria-label="Manage Availability Slots">
              <span class="sidebar-icon">${Components.icons.clock}</span> Availability Slots
            </button>
            <button class="sidebar-item" id="sb-reservations" onclick="ownerSection('reservations')" aria-label="Manage Reservations">
              <span class="sidebar-icon">${Components.icons.calendar}</span> Reservations
              <span class="badge badge-pending" id="owner-pending-badge" style="margin-left:auto;${reservations.filter(r=>r.status==='pending').length===0?'display:none':''}">${reservations.filter(r=>r.status==='pending').length}</span>
            </button>
            <button class="sidebar-item" onclick="Auth.logout()" aria-label="Sign out">
              <span class="sidebar-icon">${Components.icons.logout}</span> Sign Out
            </button>
          </nav>
        </aside>

        <!-- Main -->
        <main class="dashboard-main" id="owner-main" role="main">
          <div id="owner-content"></div>
        </main>
      </div>
    `;

    window.ownerSection = async function(section) {
      _activeSection = section;
      document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById(`sb-${section}`);
      if (btn) btn.classList.add('active');

      _restaurant = await DB.getOwnerRestaurant(user.id);
      const freshRes = _restaurant ? await DB.getRestaurantReservations(_restaurant.id) : [];
      if (section === 'profile') await renderOwnerProfile(_restaurant);
      if (section === 'slots') renderSlotManager(_restaurant);
      if (section === 'reservations') renderOwnerReservations(_restaurant, freshRes);
    };

    await ownerSection('profile');
  }

  // ─── PROFILE TAB ─────────────────────────────────────────────
  async function renderOwnerProfile(r) {
    const user = Auth.getCurrentUser();
    const pendingApp = !r ? await DB.getPendingApplicationForUser(user.id) : null;
    const contentEl = document.getElementById('owner-content');

    if (!r && pendingApp) {
      contentEl.innerHTML = `
        <div class="page-header animate-fade-up">
          <h1>My Restaurant Application</h1>
          <p>Application Status & Submitted Details</p>
        </div>
        <div style="background:var(--bg-card);border:1px solid var(--warning);border-radius:var(--r-2xl);padding:var(--sp-8);margin-bottom:var(--sp-8)" class="animate-fade-up">
          <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-4)">
            <span style="font-size:2.2rem">⏳</span>
            <div>
              <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin:0">Listing Application Pending Approval</h2>
              <div style="font-size:var(--text-xs);color:var(--warning);font-weight:700;margin-top:2px">Awaiting Admin Review</div>
            </div>
          </div>
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--sp-6);line-height:1.6">
            Your restaurant listing application for <strong>${pendingApp.name}</strong> has been received and sent to the Tabld Admin team for review & approval. Once approved by the administrator, your restaurant will be published live in Chennai.
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--sp-4);background:var(--bg-surface);padding:var(--sp-6);border-radius:var(--r-xl);font-size:var(--text-sm);border:1px solid var(--border)">
            <div><strong style="color:var(--text-muted)">Restaurant Name:</strong><br><span style="font-weight:600;color:var(--text)">${pendingApp.name}</span></div>
            <div><strong style="color:var(--text-muted)">Cuisine:</strong><br><span style="font-weight:600;color:var(--text)">${pendingApp.cuisine}</span></div>
            <div><strong style="color:var(--text-muted)">City:</strong><br><span style="font-weight:600;color:var(--text)">${pendingApp.city}</span></div>
            <div><strong style="color:var(--text-muted)">Phone:</strong><br><span style="font-weight:600;color:var(--text)">${pendingApp.phone}</span></div>
            <div><strong style="color:var(--text-muted)">Business Email:</strong><br><span style="font-weight:600;color:var(--text)">${pendingApp.email}</span></div>
            <div><strong style="color:var(--text-muted)">Address:</strong><br><span style="font-weight:600;color:var(--text)">${pendingApp.address}</span></div>
          </div>
        </div>
      `;
      return;
    }

    if (!r) {
      contentEl.innerHTML = `
        <div class="page-header">
          <h1>My Restaurant</h1>
          <p>No restaurant linked to your account yet.</p>
        </div>
        <div class="empty-state">
          <div class="empty-state-icon">🏪</div>
          <h3>No listing found</h3>
          <p>Submit your restaurant details to get your venue listed on Tabld.</p>
          <button class="btn btn-primary" onclick="Components.openListingApplicationModal()">Submit Listing Application</button>
        </div>
      `;
      return;
    }

    contentEl.innerHTML = `
      <div class="page-header animate-fade-up">
        <h1>My Restaurant</h1>
        <p>Manage your public profile, photos, hours, and menu.</p>
      </div>

      ${!r.approved ? `
        <div class="info-box" style="margin-bottom:var(--sp-6)">
          ${Components.icons.info}
          <div><strong>Pending Approval</strong> — Your restaurant listing is awaiting review by the Tabld team.</div>
        </div>
      ` : `
        <div style="display:flex;gap:var(--sp-3);align-items:center;margin-bottom:var(--sp-6)">
          <span class="badge badge-approved">✓ Approved &amp; Live</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('/restaurant/${r.id}')" aria-label="View your public listing">View Public Listing</button>
        </div>
      `}

      <!-- Cover Image Preview -->
      <div style="margin-bottom:var(--sp-8)">
        <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:var(--sp-3)">Cover Photo</div>
        <div style="position:relative;height:220px;border-radius:var(--r-xl);overflow:hidden;border:1px solid var(--border)">
          <img src="${r.coverImage}" alt="${r.name} cover" style="width:100%;height:100%;object-fit:cover" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'">
        </div>
      </div>

      <!-- Editable Fields Form -->
      <form onsubmit="saveOwnerProfile(event, ${r.id})" novalidate>
        <div class="section-label" style="margin-bottom:var(--sp-5)">Editable Information</div>

        <div class="owner-form-grid" style="margin-bottom:var(--sp-6)">
          <div class="form-group">
            <label class="form-label" for="o-name">Restaurant Name</label>
            <input class="form-input" id="o-name" type="text" value="${r.name}" required aria-required="true">
          </div>
          <div class="form-group">
            <label class="form-label" for="o-cuisine">Cuisine</label>
            <input class="form-input" id="o-cuisine" type="text" value="${r.cuisine}">
          </div>
          <div class="form-group">
            <label class="form-label" for="o-phone">Phone</label>
            <input class="form-input" id="o-phone" type="tel" value="${r.phone}">
          </div>
          <div class="form-group">
            <label class="form-label" for="o-email">Email</label>
            <input class="form-input" id="o-email" type="email" value="${r.email}">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label" for="o-address">Address</label>
            <input class="form-input" id="o-address" type="text" value="${r.address}">
          </div>
          <div class="form-group">
            <label class="form-label" for="o-website">Website</label>
            <input class="form-input" id="o-website" type="url" value="${r.website || ''}" placeholder="https://yourrestaurant.com">
          </div>
          <div class="form-group">
            <label class="form-label" for="o-price">Price Range</label>
            <select class="form-select" id="o-price" aria-label="Price range">
              <option value="₹" ${r.priceRange==='₹'?'selected':''}>₹ — Budget-friendly</option>
              <option value="₹₹" ${r.priceRange==='₹₹'?'selected':''}>₹₹ — Mid-range</option>
              <option value="₹₹₹" ${r.priceRange==='₹₹₹'?'selected':''}>₹₹₹ — Fine Dining</option>
              <option value="₹₹₹₹" ${r.priceRange==='₹₹₹₹'?'selected':''}>₹₹₹₹ — Luxury / Omakase</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label" for="o-short-desc">Short Description</label>
            <textarea class="form-textarea" id="o-short-desc" rows="2">${r.shortDescription || ''}</textarea>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label" for="o-cover-img">Cover Image URL</label>
            <input class="form-input" id="o-cover-img" type="url" value="${r.coverImage || ''}">
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg" id="save-owner-btn">Save Changes</button>
      </form>
    `;
  }

  // ─── SLOTS TAB ───────────────────────────────────────────────
  function renderSlotManager(r) {
    const contentEl = document.getElementById('owner-content');
    if (!r) {
      contentEl.innerHTML = `<div class="empty-state"><h3>No restaurant found</h3></div>`;
      return;
    }

    const allSlots = DB.getAllPossibleSlots();
    const activeSlots = r.availableSlots || [];
    const caps = r.slotCapacities || {};

    contentEl.innerHTML = `
      <div class="page-header animate-fade-up">
        <h1>Availability Slots &amp; Capacities</h1>
        <p>Enable or disable booking slots and set per-slot guest limits for ${r.name}.</p>
      </div>

      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-6);margin-bottom:var(--sp-8)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-6);flex-wrap:wrap;gap:var(--sp-4)">
          <div style="font-weight:600;color:var(--text)">Time Slots (11:00 AM – 10:30 PM)</div>
          <div style="display:flex;gap:var(--sp-2)">
            <button class="btn btn-outline btn-sm" onclick="enableAllSlots()">Enable All</button>
            <button class="btn btn-ghost btn-sm" onclick="disableAllSlots()">Disable All</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--sp-3);margin-bottom:var(--sp-6)" id="slots-checkbox-grid">
          ${allSlots.map(slot => {
            const isChecked = activeSlots.includes(slot);
            const cap = caps[slot] || r.capacity || 20;
            return `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:var(--sp-3);background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg)">
                <label style="display:flex;align-items:center;gap:var(--sp-2);cursor:pointer;font-weight:600;font-size:var(--text-sm)">
                  <input type="checkbox" class="slot-check" value="${slot}" ${isChecked ? 'checked' : ''}>
                  ${slot}
                </label>
                <div style="display:flex;align-items:center;gap:4px">
                  <span style="font-size:11px;color:var(--text-muted)">Max:</span>
                  <input type="number" min="1" max="100" value="${cap}" class="slot-cap form-input" data-slot="${slot}" style="width:60px;padding:2px 6px;height:28px;font-size:12px">
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <button class="btn btn-primary btn-lg" onclick="saveSlots(${r.id})">Save Slot Settings</button>
      </div>
    `;
  }

  // ─── RESERVATIONS TAB ────────────────────────────────────────
  function renderOwnerReservations(restaurant, reservations) {
    const contentEl = document.getElementById('owner-content');
    const pending   = reservations.filter(r => r.status === 'pending');
    const confirmed = reservations.filter(r => r.status === 'confirmed');

    const badge = document.getElementById('owner-pending-badge');
    if (badge) {
      badge.textContent = pending.length;
      badge.style.display = pending.length > 0 ? '' : 'none';
    }

    contentEl.innerHTML = `
      <div class="page-header animate-fade-up">
        <h1>Reservations</h1>
        <p>Manage incoming table bookings for ${restaurant?.name || 'your restaurant'}.</p>
      </div>

      <div class="admin-stats-grid" style="margin-bottom:var(--sp-8)">
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--warning-bg);color:var(--warning)">${Components.icons.clock}</div>
          <div class="stat-label">Pending</div>
          <div class="stat-value" style="color:var(--warning)">${pending.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--success-bg);color:var(--success)">${Components.icons.check}</div>
          <div class="stat-label">Confirmed</div>
          <div class="stat-value" style="color:var(--success)">${confirmed.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:var(--info-bg);color:var(--info)">${Components.icons.persons}</div>
          <div class="stat-label">Total Bookings</div>
          <div class="stat-value">${reservations.length}</div>
        </div>
      </div>

      ${pending.length > 0 ? `
        <div style="margin-bottom:var(--sp-8)">
          <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-5)">
            Pending Approvals <span class="badge badge-pending">${pending.length}</span>
          </h2>
          ${_reservationTable(pending)}
        </div>
      ` : ''}

      <div>
        <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-5)">All Reservations</h2>
        ${reservations.length === 0 ? `
          <div class="empty-state"><div class="empty-state-icon">📋</div><h3>No reservations yet</h3><p>Bookings will appear here when guests reserve tables.</p></div>
        ` : _reservationTable(reservations)}
      </div>
    `;
  }

  function _reservationTable(reservations) {
    return `
      <div class="data-table-wrap">
        <table class="data-table" aria-label="Reservations table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Guests</th>
              <th>Notes</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${reservations.map(res => `
              <tr>
                <td>
                  <strong>${res.date}</strong><br>
                  <span style="color:var(--primary-light);font-weight:600">${res.time}</span>
                  ${res.originalTime && res.originalTime !== res.time ? `<span style="font-size:10px;color:var(--warning);display:block;text-decoration:line-through">was ${res.originalTime}</span>` : ''}
                </td>
                <td>${res.guests} guests</td>
                <td style="font-size:var(--text-xs);max-width:200px">
                  ${res.notes ? `<div style="font-style:italic">"${res.notes}"</div>` : '—'}
                  ${res.cancelReason ? `<div style="color:var(--error)"><strong>Cancelled:</strong> "${res.cancelReason}"</div>` : ''}
                  ${res.shiftReason ? `<div style="color:var(--warning)"><strong>Shifted:</strong> "${res.shiftReason}"</div>` : ''}
                </td>
                <td><span class="badge ${_statusBadge(res.status)}">${_capitalize(res.status)}</span></td>
                <td>
                  <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap">
                    ${res.status === 'pending' ? `
                      <button class="btn btn-success btn-sm" onclick="updateResStatus(${res.id},'confirmed')">Confirm</button>
                    ` : ''}
                    ${res.status !== 'cancelled' && res.status !== 'completed' ? `
                      <button class="btn btn-outline btn-sm" onclick="openShiftReservationModal(${res.id}, 'owner', function(){ ownerSection('reservations'); })">🕒 Shift</button>
                      <button class="btn btn-danger btn-sm" onclick="openCancelReservationModal(${res.id}, 'owner', function(){ ownerSection('reservations'); })">❌ Cancel</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function _statusBadge(s) {
    return { confirmed:'badge-confirmed', pending:'badge-pending', completed:'badge-completed', cancelled:'badge-rejected' }[s] || 'badge-outline';
  }
  function _capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  window.saveOwnerProfile = async function(e, id) {
    e.preventDefault();
    const btn = document.getElementById('save-owner-btn');
    if (btn) { btn.classList.add('loading'); btn.disabled = true; }

    const updates = {
      name: document.getElementById('o-name').value.trim(),
      cuisine: document.getElementById('o-cuisine').value.trim(),
      phone: document.getElementById('o-phone').value.trim(),
      email: document.getElementById('o-email').value.trim(),
      address: document.getElementById('o-address').value.trim(),
      website: document.getElementById('o-website').value.trim(),
      priceRange: document.getElementById('o-price').value,
      shortDescription: document.getElementById('o-short-desc').value.trim(),
      coverImage: document.getElementById('o-cover-img').value.trim()
    };

    await DB.updateRestaurant(id, updates);
    if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
    Components.toast('Listing updated', 'Your restaurant details have been saved to Supabase.', 'success');
  };

  window.enableAllSlots = function() {
    document.querySelectorAll('.slot-check').forEach(c => c.checked = true);
  };
  window.disableAllSlots = function() {
    document.querySelectorAll('.slot-check').forEach(c => c.checked = false);
  };

  window.saveSlots = async function(id) {
    const slots = [];
    const caps = {};
    document.querySelectorAll('.slot-check:checked').forEach(c => {
      slots.push(c.value);
    });
    document.querySelectorAll('.slot-cap').forEach(inp => {
      if (inp.value) caps[inp.dataset.slot] = Number(inp.value);
    });

    await DB.updateRestaurant(id, { availableSlots: slots, slotCapacities: caps });
    Components.toast('Slots saved', 'Booking availability updated.', 'success');
  };

  window.updateResStatus = async function(id, status) {
    await DB.updateReservationStatus(id, status);
    Components.toast('Updated', `Reservation ${status}.`, status === 'confirmed' ? 'success' : 'error');
    if (window.ownerSection) ownerSection('reservations');
  };

  return { render };
})();
