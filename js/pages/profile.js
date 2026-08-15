// ============================================================
// TABLD — User Profile Page
// Connected with Supabase Data Layer
// ============================================================

window.Pages = window.Pages || {};
Pages.Profile = (function () {

  async function render() {
    if (!Auth.requireAuth()) return;
    const user = Auth.getCurrentUser();
    const isAdmin = user.role === 'admin';

    if (isAdmin) {
      document.getElementById('app').innerHTML = `
        <div class="profile-page page-enter">
          <div class="container" style="max-width:800px">
            <div class="page-header" style="margin-bottom:var(--sp-6)">
              <div style="display:flex;align-items:center;gap:var(--sp-3)">
                <h1>Admin Profile</h1>
                <span class="badge badge-pending" style="font-size:11px">ADMINISTRATOR</span>
              </div>
              <p>Manage and update your administrator credentials and account profile.</p>
            </div>

            <!-- Profile Overview Header -->
            <div class="profile-header-card animate-fade-up" style="margin-bottom:var(--sp-8)">
              <div class="profile-avatar-lg" role="img" aria-label="${user.name}'s avatar">
                <img src="${user.avatar}" alt="${user.name}"
                  onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=3b82f6&textColor=ffffff'">
              </div>
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-2)">
                  <h2 style="font-family:var(--font-display);font-size:var(--text-3xl);font-weight:700;color:var(--text);line-height:1">${user.name}</h2>
                  <span class="badge badge-pending">Administrator</span>
                </div>
                <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-2)">${user.email}</p>
                <p style="font-size:var(--text-xs);color:var(--text-muted)">Phone: ${user.phone || 'Not provided'}</p>
              </div>
              <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
                <button class="btn btn-primary" onclick="navigate('/admin')" aria-label="Go to Admin Dashboard">Go to Admin Dashboard</button>
                <button class="btn btn-ghost" onclick="Auth.logout()" aria-label="Sign out">Sign out</button>
              </div>
            </div>

            <!-- Update Admin Profile Card -->
            <div class="booking-widget animate-fade-up" style="margin-bottom:var(--sp-10)">
              <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-6)">Update Admin Profile</h2>
              <form class="auth-form" onsubmit="saveProfile(event)" novalidate>
                <div class="form-group">
                  <label class="form-label" for="edit-name">Full Name *</label>
                  <input class="form-input" id="edit-name" type="text" value="${user.name}" required aria-required="true">
                </div>
                <div class="form-group">
                  <label class="form-label" for="edit-email">Email Address *</label>
                  <input class="form-input" id="edit-email" type="email" value="${user.email}" readonly style="opacity:0.8">
                </div>
                <div class="form-group">
                  <label class="form-label" for="edit-phone">Phone Number</label>
                  <input class="form-input" id="edit-phone" type="tel" value="${user.phone || ''}" placeholder="+91 98000 33333">
                </div>
                <div class="form-group">
                  <label class="form-label" for="edit-avatar">Avatar URL</label>
                  <input class="form-input" id="edit-avatar" type="url" value="${user.avatar || ''}" placeholder="https://api.dicebear.com/7.x/initials/svg?seed=Admin">
                </div>
                <div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-6)">
                  <button type="submit" class="btn btn-primary btn-lg flex-1" id="save-profile-btn">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
          ${Components.renderFooter()}
        </div>
      `;

      _initPageAdmin();
      return;
    }

    const allRes = await DB.getUserReservations(user.id);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = allRes.filter(r => {
      const d = new Date(r.date); d.setHours(0, 0, 0, 0);
      return d >= today && r.status !== 'cancelled' && r.status !== 'completed';
    });
    const past = allRes.filter(r => {
      const d = new Date(r.date); d.setHours(0, 0, 0, 0);
      return d < today || r.status === 'completed';
    });

    document.getElementById('app').innerHTML = `
      <div class="profile-page page-enter">
        <div class="container">

          <!-- Profile Header -->
          <div class="profile-header-card animate-fade-up">
            <div class="profile-avatar-lg" role="img" aria-label="${user.name}'s avatar">
              <img src="${user.avatar}" alt="${user.name}"
                onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=e8732a&textColor=ffffff'">
            </div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-2)">
                <h1 style="font-family:var(--font-display);font-size:var(--text-3xl);font-weight:700;color:var(--text);line-height:1">${user.name}</h1>
                <span class="badge ${user.role === 'owner' ? 'badge-featured' : 'badge-approved'}">${_roleLabel(user.role)}</span>
              </div>
              <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-4)">${user.email}</p>
              <div style="display:flex;gap:var(--sp-6);flex-wrap:wrap">
                <div>
                  <div style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;color:var(--primary-light)">${upcoming.length}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">Upcoming</div>
                </div>
                <div>
                  <div style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;color:var(--text)">${past.length}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">Past Visits</div>
                </div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
              <button class="btn btn-secondary" onclick="showEditProfile()" aria-label="Edit profile">Edit Profile</button>
              <button class="btn btn-ghost" onclick="Auth.logout()" aria-label="Sign out">Sign out</button>
            </div>
          </div>

          <!-- Edit Profile form -->
          <div id="edit-profile-section" style="display:none">
            <div class="booking-widget animate-fade-up" style="max-width:480px;margin-bottom:var(--sp-8)">
              <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-6)">Edit Profile</h2>
              <form class="auth-form" onsubmit="saveProfile(event)" novalidate>
                <div class="form-group">
                  <label class="form-label" for="edit-name">Full name</label>
                  <input class="form-input" id="edit-name" type="text" value="${user.name}" required aria-required="true">
                </div>
                <div class="form-group">
                  <label class="form-label" for="edit-phone">Phone number</label>
                  <input class="form-input" id="edit-phone" type="tel" value="${user.phone || ''}" placeholder="+91 98765 43210">
                </div>
                <div style="display:flex;gap:var(--sp-3)">
                  <button type="submit" class="btn btn-primary flex-1" id="save-profile-btn">Save Changes</button>
                  <button type="button" class="btn btn-secondary" onclick="hideEditProfile()">Cancel</button>
                </div>
              </form>
            </div>
          </div>

          <!-- UPCOMING RESERVATIONS -->
          <div style="margin-bottom:var(--sp-10)">
            <div class="section-header" style="margin-bottom:var(--sp-5)">
              <div>
                <div class="section-label">What's Next</div>
                <h2 class="section-title">Upcoming Reservations</h2>
              </div>
              <button class="btn btn-outline btn-sm" onclick="navigate('/discover')" aria-label="Discover more restaurants">Discover more</button>
            </div>
            ${upcoming.length === 0 ? `
              <div class="empty-state">
                <div class="empty-state-icon">🗓️</div>
                <h3>No upcoming reservations</h3>
                <p>Ready to discover your next favourite table?</p>
                <button class="btn btn-primary" onclick="navigate('/discover')">Explore Restaurants</button>
              </div>
            ` : `
              <div style="display:flex;flex-direction:column;gap:var(--sp-4)" role="list" aria-label="Upcoming reservations">
                ${upcoming.map(res => _reservationCard(res, true)).join('')}
              </div>
            `}
          </div>

          <!-- PAST RESERVATIONS -->
          ${past.length > 0 ? `
            <div style="margin-bottom:var(--sp-10)">
              <div class="section-header" style="margin-bottom:var(--sp-5)">
                <div>
                  <div class="section-label">History</div>
                  <h2 class="section-title">Past Visits</h2>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:var(--sp-4)" role="list" aria-label="Past reservations">
                ${past.map(res => _reservationCard(res, false)).join('')}
              </div>
            </div>
          ` : ''}

        </div>
        ${Components.renderFooter()}
      </div>
    `;

    _initPage();
  }

  function _reservationCard(res, isUpcoming) {
    const dateObj = new Date(res.date);
    const day     = dateObj.getDate();
    const month   = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
    const statusClass = { confirmed:'badge-confirmed', pending:'badge-pending', completed:'badge-completed', cancelled:'badge-rejected' }[res.status] || 'badge-outline';
    const isShifted = res.originalTime && res.originalTime !== res.time;

    return `
      <div class="reservation-card" role="listitem">
        <div class="reservation-date-box" aria-label="${day} ${month}">
          <div class="reservation-day">${day}</div>
          <div class="reservation-month">${month}</div>
        </div>
        <div class="reservation-info">
          <div class="reservation-name" style="display:flex;align-items:center;gap:var(--sp-2)">
            ${res.restaurantName}
            ${isShifted ? `<span class="badge badge-pending" style="font-size:10px">🕒 Time Shifted</span>` : ''}
          </div>
          <div class="reservation-meta" style="flex-wrap:wrap">
            <span>${Components.icons.clock} ${res.time} ${isShifted ? `<span style="text-decoration:line-through;opacity:0.65;font-size:11px">(${res.originalTime})</span>` : ''}</span>
            <span>${Components.icons.persons} ${res.guests} guest${res.guests !== 1 ? 's' : ''}</span>
            ${res.notes ? `<span style="font-style:italic">"${res.notes}"</span>` : ''}
          </div>
          ${res.status === 'cancelled' && res.cancelReason ? `
            <div style="margin-top:var(--sp-2);padding:var(--sp-2) var(--sp-3);background:var(--error-bg);border:1px solid rgba(239,68,68,0.25);border-radius:var(--r-md);font-size:var(--text-xs);color:var(--error);font-weight:600">
              ${res.cancelReason}
            </div>
          ` : ''}
          ${isShifted && res.shiftReason ? `
            <div style="margin-top:var(--sp-2);padding:var(--sp-2) var(--sp-3);background:var(--warning-bg);border:1px solid rgba(245,158,11,0.25);border-radius:var(--r-md);font-size:var(--text-xs);color:var(--warning)">
              <strong>Restaurant Note:</strong> "${res.shiftReason}"
            </div>
          ` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--sp-2);flex-shrink:0">
          <span class="badge ${statusClass}">${_capitalize(res.status)}</span>
          ${isUpcoming ? `
            <button class="btn btn-ghost btn-sm" onclick="navigate('/restaurant/${res.restaurantId}')" aria-label="View ${res.restaurantName}">View</button>
          ` : `
            <button class="btn btn-outline btn-sm" onclick="navigate('/restaurant/${res.restaurantId}')" aria-label="Book ${res.restaurantName} again">Book Again</button>
          `}
        </div>
      </div>
    `;
  }

  function _roleLabel(role) {
    return { user:'Diner', owner:'Owner', admin:'Administrator' }[role] || role;
  }

  function _capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  function _initPage() {
    window.showEditProfile = function() {
      document.getElementById('edit-profile-section').style.display = 'block';
      document.getElementById('edit-profile-section').scrollIntoView({ behavior: 'smooth' });
    };

    window.hideEditProfile = function() {
      document.getElementById('edit-profile-section').style.display = 'none';
    };

    window.saveProfile = async function(e) {
      e.preventDefault();
      const name  = document.getElementById('edit-name').value.trim();
      const phone = document.getElementById('edit-phone').value.trim();
      const btn   = document.getElementById('save-profile-btn');

      if (!name) { Components.toast('Name required', 'Please enter your name.', 'error'); return; }

      if (btn) { btn.classList.add('loading'); btn.disabled = true; }

      await Auth.updateCurrentUser({ name, phone });

      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
      Components.toast('Profile updated', 'Your changes have been saved.', 'success');
      render();
    };
  }

  function _initPageAdmin() {
    window.saveProfile = async function(e) {
      e.preventDefault();
      const name   = document.getElementById('edit-name').value.trim();
      const phone  = document.getElementById('edit-phone').value.trim();
      const avatar = document.getElementById('edit-avatar').value.trim();
      const btn    = document.getElementById('save-profile-btn');

      if (!name) { Components.toast('Name required', 'Please enter your name.', 'error'); return; }

      if (btn) { btn.classList.add('loading'); btn.disabled = true; }

      await Auth.updateCurrentUser({ name, phone, avatar });

      if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
      Components.toast('Admin Profile Updated', 'Credentials and details saved.', 'success');
      render();
    };
  }

  return { render };
})();
