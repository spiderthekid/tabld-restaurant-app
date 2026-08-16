// ============================================================
// TABLD — Admin Dashboard
// Connected with Supabase Data Layer
// ============================================================

window.Pages = window.Pages || {};
Pages.Admin = (function () {
  let _section = 'overview';

  async function render() {
    if (!Auth.requireRole('admin')) return;
    const user = Auth.getCurrentUser();
    const stats = await DB.getStats();

    document.getElementById('app').innerHTML = `
      <div class="dashboard-layout">

        <!-- Sidebar -->
        <aside class="sidebar" aria-label="Admin navigation">
          <div style="margin-bottom:var(--sp-6)">
            <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-1)">
              <span class="badge badge-pending" style="font-size:10px">ADMIN</span>
            </div>
            <div style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;color:var(--text)">${user.name}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted)">Administrator Module</div>
          </div>
          <nav class="sidebar-nav" role="navigation" aria-label="Admin sections">
            <button class="sidebar-item active" id="sb-overview" onclick="adminSection('overview')" aria-label="Overview dashboard">
              <span class="sidebar-icon">${Components.icons.chart}</span> Overview
            </button>
            <button class="sidebar-item" id="sb-approvals" onclick="adminSection('approvals')" aria-label="Pending approvals">
              <span class="sidebar-icon">${Components.icons.check}</span> Pending Approvals
              <span class="badge badge-pending" id="admin-pending-badge" style="margin-left:auto;${stats.pendingApprovals > 0 ? '' : 'display:none'}">${stats.pendingApprovals}</span>
            </button>
            <button class="sidebar-item" id="sb-restaurants" onclick="adminSection('restaurants')" aria-label="Manage restaurants">
              <span class="sidebar-icon">${Components.icons.store}</span> Restaurants
            </button>
            <button class="sidebar-item" id="sb-users" onclick="adminSection('users')" aria-label="Manage users">
              <span class="sidebar-icon">${Components.icons.users}</span> Users
            </button>
            <button class="sidebar-item" id="sb-reservations" onclick="adminSection('reservations')" aria-label="All reservations">
              <span class="sidebar-icon">${Components.icons.calendar}</span> Reservations
            </button>
            <button class="sidebar-item" id="sb-ai" onclick="adminSection('ai')" aria-label="API Key & Engine Configuration">
              <span class="sidebar-icon">🔑</span> API Key &amp; Engine
              <span id="sb-ai-badge" class="badge ${window.AI && AI.isEnabled() ? 'badge-approved' : 'badge-outline'}" style="margin-left:auto;font-size:9px">
                ${window.AI && AI.isEnabled() ? 'Active' : 'Off'}
              </span>
            </button>
            <button class="sidebar-item" onclick="Auth.logout()" aria-label="Sign out">
              <span class="sidebar-icon">${Components.icons.logout}</span> Sign Out
            </button>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="dashboard-main" id="admin-main" role="main">
          <div id="admin-content"></div>
        </main>
      </div>
    `;

    _bindAdminActions();

    window.adminSection = async function(section) {
      _section = section;
      document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
      const btn = document.getElementById(`sb-${section}`);
      if (btn) btn.classList.add('active');

      const map = {
        overview: renderOverview,
        approvals: renderApprovals,
        restaurants: renderRestaurants,
        users: renderUsers,
        reservations: renderReservations,
        ai: renderAiSettings
      };
      if (map[section]) {
        try {
          await map[section]();
        } catch(err) {
          console.error(`Error rendering admin section '${section}':`, err);
          const content = document.getElementById('admin-content');
          if (content) {
            content.innerHTML = `
              <div class="animate-fade-up" style="padding:var(--sp-6)">
                <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:var(--r-xl);padding:var(--sp-6)">
                  <h3 style="color:var(--danger);margin-bottom:var(--sp-2)">Error loading section</h3>
                  <p style="font-size:var(--text-sm);color:var(--text-secondary)">${err.message || err}</p>
                  <button class="btn btn-primary btn-sm" onclick="adminSection('${section}')" style="margin-top:var(--sp-4)">Try Again</button>
                </div>
              </div>
            `;
          }
        }
      }
    };

    await adminSection('overview');
  }

  async function renderOverview() {
    const stats = await DB.getStats();
    const pending = await DB.getPending();

    document.getElementById('admin-content').innerHTML = `
      <div class="animate-fade-up">
        <div class="page-header">
          <h1>Dashboard Overview</h1>
          <p>Welcome back. Here's a snapshot of Tabld backed by Supabase.</p>
        </div>

        <div class="admin-stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--primary-10);color:var(--primary-light)">${Components.icons.users}</div>
            <div class="stat-label">Total Diners</div>
            <div class="stat-value">${stats.totalUsers}</div>
            <div class="stat-change">Registered profiles</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--success-bg);color:var(--success)">${Components.icons.store}</div>
            <div class="stat-label">Listed Restaurants</div>
            <div class="stat-value">${stats.totalRestaurants}</div>
            <div class="stat-change">Approved &amp; live</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--warning-bg);color:var(--warning)">${Components.icons.clock}</div>
            <div class="stat-label">Pending Approvals</div>
            <div class="stat-value" style="color:var(--warning)">${stats.pendingApprovals}</div>
            <div class="stat-change">Awaiting review</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background:var(--info-bg);color:var(--info)">${Components.icons.calendar}</div>
            <div class="stat-label">Total Reservations</div>
            <div class="stat-value">${stats.totalReservations}</div>
            <div class="stat-change">All time in database</div>
          </div>
        </div>

        ${pending.length > 0 ? `
          <div style="margin-top:var(--sp-8)">
            <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-2)">Action Required</h2>
            <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--sp-5)">${pending.length} restaurant${pending.length>1?'s':''} awaiting approval.</p>
            <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
              ${pending.map(r => `
                <div class="reservation-card" style="justify-content:space-between">
                  <div style="display:flex;align-items:center;gap:var(--sp-4)">
                    <img src="${r.coverImage}" alt="${r.name}" style="width:56px;height:56px;border-radius:var(--r-md);object-fit:cover" onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&q=50'">
                    <div>
                      <div style="font-weight:600;color:var(--text)">${r.name}</div>
                      <div style="font-size:var(--text-xs);color:var(--text-muted)">${r.cuisine} · ${r.city}</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:var(--sp-2)">
                    <button class="btn btn-success btn-sm" onclick="approveRestaurant(${r.id})">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectRestaurant(${r.id})">Reject</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div style="margin-top:var(--sp-8)">
            <div style="background:var(--success-bg);border:1px solid rgba(34,197,94,0.2);border-radius:var(--r-lg);padding:var(--sp-5);display:flex;align-items:center;gap:var(--sp-3)">
              ${Components.icons.check}
              <span style="font-size:var(--text-sm);color:var(--success)">All caught up! No pending restaurant approvals.</span>
            </div>
          </div>
        `}

        <!-- Quick Actions -->
        <div style="margin-top:var(--sp-8)">
          <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-5)">Quick Actions</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:var(--sp-4)">
            <button class="stat-card" onclick="adminSection('approvals')" style="text-align:left;cursor:pointer">
              <div class="stat-icon" style="background:var(--warning-bg);color:var(--warning)">${Components.icons.check}</div>
              <div style="font-weight:600;color:var(--text)">Review Approvals</div>
              <div class="stat-change">${stats.pendingApprovals} pending</div>
            </button>
            <button class="stat-card" onclick="adminSection('restaurants')" style="text-align:left;cursor:pointer">
              <div class="stat-icon" style="background:var(--primary-10);color:var(--primary-light)">${Components.icons.store}</div>
              <div style="font-weight:600;color:var(--text)">Manage Restaurants</div>
              <div class="stat-change">${stats.totalRestaurants} live</div>
            </button>
            <button class="stat-card" onclick="adminSection('users')" style="text-align:left;cursor:pointer">
              <div class="stat-icon" style="background:var(--info-bg);color:var(--info)">${Components.icons.users}</div>
              <div style="font-weight:600;color:var(--text)">View Users</div>
              <div class="stat-change">${stats.totalUsers} profiles</div>
            </button>
          </div>
        </div>
      </div>
    `;

    _bindAdminActions();
  }

  async function renderApprovals() {
    const pending = await DB.getPending();
    const pendingApps = await DB.getPendingApplications();
    const totalPending = pending.length + pendingApps.length;

    document.getElementById('admin-content').innerHTML = `
      <div class="animate-fade-up">
        <div class="page-header">
          <h1>Pending Approvals</h1>
          <p>Review restaurant listing applications submitted by users and pending restaurant reviews.</p>
        </div>

        ${totalPending === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <h3>No pending applications</h3>
            <p>All restaurant listings and user applications have been reviewed.</p>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:var(--sp-6)">
            ${pendingApps.length > 0 ? `
              <div>
                <h2 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text);margin-bottom:var(--sp-4)">
                  User Listing Applications <span class="badge badge-pending">${pendingApps.length}</span>
                </h2>
                <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
                  ${pendingApps.map(app => `
                    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-6)">
                      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--sp-4);flex-wrap:wrap;gap:var(--sp-2)">
                        <div>
                          <div style="display:flex;align-items:center;gap:var(--sp-3)">
                            <h3 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text)">${app.name}</h3>
                            <span class="badge badge-pending">User Submitted</span>
                          </div>
                          <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--sp-1)">
                            Submitted by <strong>${app.userName}</strong> (${app.userEmail})
                          </div>
                        </div>
                        <div style="display:flex;gap:var(--sp-2)">
                          <button class="btn btn-success" onclick="approveListingApp(${app.id})">✓ Approve & Promote Owner</button>
                          <button class="btn btn-danger" onclick="rejectListingApp(${app.id})">✗ Reject</button>
                        </div>
                      </div>
                      <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-3)">${app.shortDescription || 'No description provided.'}</p>
                      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--sp-2);font-size:var(--text-xs);color:var(--text-muted);background:var(--bg-surface);padding:var(--sp-3);border-radius:var(--r-md)">
                        <div><strong>Cuisine:</strong> ${app.cuisine}</div>
                        <div><strong>City:</strong> ${app.city}</div>
                        <div><strong>Price:</strong> ${app.priceRange}</div>
                        <div><strong>Phone:</strong> ${app.phone}</div>
                        <div><strong>Email:</strong> ${app.email}</div>
                        <div><strong>Address:</strong> ${app.address}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${pending.length > 0 ? `
              <div>
                <h2 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text);margin-bottom:var(--sp-4)">
                  Pending Restaurant Listings <span class="badge badge-pending">${pending.length}</span>
                </h2>
                <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
                  ${pending.map(r => `
                    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-6)">
                      <div style="display:flex;gap:var(--sp-5);margin-bottom:var(--sp-5);flex-wrap:wrap">
                        <img src="${r.coverImage}" alt="${r.name}" style="width:120px;height:90px;border-radius:var(--r-lg);object-fit:cover;flex-shrink:0" onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&q=60'">
                        <div style="flex:1;min-width:0">
                          <h3 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text)">${r.name}</h3>
                          <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-2)">${r.shortDescription}</p>
                          <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap;font-size:var(--text-xs);color:var(--text-muted)">
                            <span>${r.cuisine}</span>
                            <span>${r.priceRange}</span>
                            <span>${r.city}</span>
                          </div>
                        </div>
                      </div>
                      <div style="display:flex;gap:var(--sp-3)">
                        <button class="btn btn-success" onclick="approveRestaurant(${r.id})">✓ Approve Listing</button>
                        <button class="btn btn-danger" onclick="rejectRestaurant(${r.id})">✗ Reject</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `}
      </div>
    `;
    _bindAdminActions();
  }

  async function renderRestaurants() {
    const restaurants = await DB.getAllRestaurants();
    document.getElementById('admin-content').innerHTML = `
      <div class="animate-fade-up">
        <div class="page-header" style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-3)">
          <div>
            <h1>Manage Restaurants</h1>
            <p>Full database catalog of restaurants on Tabld.</p>
          </div>
          <button class="btn btn-primary" id="admin-add-restaurant-btn" onclick="openAddRestaurantModal()" style="flex-shrink:0">
            <span style="font-size:1.1em">+</span>&nbsp; Add Restaurant
          </button>
        </div>

        <div class="data-table-wrap">
          <table class="data-table" aria-label="Restaurant management table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Cuisine</th>
                <th>Price</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${restaurants.map(r => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:var(--sp-3)">
                      <img src="${r.coverImage}" alt="${r.name}" style="width:40px;height:40px;border-radius:var(--r-md);object-fit:cover" onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&q=50'">
                      <div>
                        <strong>${r.name}</strong><br>
                        <span style="font-size:var(--text-xs);color:var(--text-muted)">${r.city} · ★ ${r.rating}</span>
                      </div>
                    </div>
                  </td>
                  <td>${r.cuisine}</td>
                  <td>${r.priceRange}</td>
                  <td><span class="badge ${r.approved ? 'badge-approved' : 'badge-pending'}">${r.approved ? 'Approved' : 'Pending'}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="toggleFeatured(${r.id})">
                      ${r.featured ? '⭐ Featured' : '☆ Standard'}
                    </button>
                  </td>
                  <td>
                    <div style="display:flex;gap:var(--sp-2)">
                      <button class="btn btn-ghost btn-sm" onclick="navigate('/restaurant/${r.id}')">View</button>
                      <button class="btn btn-danger btn-sm" onclick="rejectRestaurant(${r.id})">Delete</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    _bindAdminActions();
  }

  async function renderUsers() {
    const users = await DB.getAllUsers();
    document.getElementById('admin-content').innerHTML = `
      <div class="animate-fade-up">
        <div class="page-header">
          <h1>Users &amp; Roles</h1>
          <p>All registered accounts stored in Supabase Auth &amp; Profiles.</p>
        </div>

        <div class="data-table-wrap">
          <table class="data-table" aria-label="Users table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:var(--sp-3)">
                      <img src="${u.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(u.name)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover" alt="${u.name}">
                      <div>
                        <strong>${u.name}</strong><br>
                        <span style="font-size:var(--text-xs);color:var(--text-muted)">${u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge ${u.role === 'admin' ? 'badge-pending' : u.role === 'owner' ? 'badge-featured' : 'badge-approved'}">${u.role}</span></td>
                  <td>${u.phone || '—'}</td>
                  <td>${u.joinedAt || 'Recent'}</td>
                  <td>
                    <select class="form-select" data-user-id="${u.id}" style="width:auto;font-size:var(--text-xs);padding:2px 8px" onchange="changeUserRole('${u.id}', this.value, '${u.role}')">
                      <option value="user" ${u.role==='user'?'selected':''}>Diner</option>
                      <option value="owner" ${u.role==='owner'?'selected':''}>Owner</option>
                      <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function renderReservations() {
    const reservations = await DB.getAllReservations();
    document.getElementById('admin-content').innerHTML = `
      <div class="animate-fade-up">
        <div class="page-header">
          <h1>All Reservations</h1>
          <p>Live table bookings across all listed restaurants.</p>
        </div>

        <div class="data-table-wrap">
          <table class="data-table" aria-label="All reservations table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Date &amp; Time</th>
                <th>Guests</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${reservations.map(res => `
                <tr>
                  <td><strong>${res.restaurantName}</strong></td>
                  <td>${res.date} at ${res.time}</td>
                  <td>${res.guests} guests</td>
                  <td><span class="badge ${res.status === 'confirmed' ? 'badge-confirmed' : res.status === 'pending' ? 'badge-pending' : 'badge-rejected'}">${res.status}</span></td>
                  <td style="font-size:var(--text-xs)">${res.notes || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAiSettings() {
    console.log('[Admin] renderAiSettings called');
    let config = { apiKey: '', model: 'gemini-3.5-flash', enabled: false };
    let isAct = false;
    try {
      if (window.AI) {
        config = AI.getConfig() || config;
        isAct = AI.isEnabled();
      }
    } catch(e) { console.warn('[Admin] AI.getConfig error:', e); }

    document.getElementById('admin-content').innerHTML = `
      <div class="animate-fade-up">
        <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:var(--sp-3)">
          <div>
            <h1>Gemini AI &amp; Engine Configuration</h1>
            <p>Configure Google Gemini API integration for natural language discovery and smart recommendations.</p>
          </div>
          <div id="ai-engine-status-pill" class="badge ${isAct ? 'badge-approved' : 'badge-outline'}" style="font-size:var(--text-xs);padding:6px 14px;border-radius:var(--r-full);display:flex;align-items:center;gap:6px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isAct ? '#22c55e' : '#94a3b8'}"></span>
            ${isAct ? 'AI Engine Active' : 'AI Engine Inactive / Fallback Active'}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:var(--sp-6);margin-bottom:var(--sp-6)">
          
          <!-- API Configuration Card -->
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-6);display:flex;flex-direction:column;gap:var(--sp-4)">
            <div style="display:flex;align-items:center;gap:var(--sp-3);padding-bottom:var(--sp-3);border-bottom:1px solid var(--border)">
              <div style="width:36px;height:36px;border-radius:var(--r-md);background:rgba(232,115,42,0.12);color:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:18px">🔑</div>
              <div>
                <h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text);margin:0">API Credentials</h3>
                <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0">Enter your Google AI Studio API Key</p>
              </div>
            </div>

            <!-- API Key Input -->
            <div class="form-group">
              <label class="form-label" for="ai-key-input" style="display:flex;justify-content:space-between;align-items:center">
                <span>Google Gemini API Key</span>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="font-size:var(--text-xs);color:var(--primary-light);text-decoration:underline">Get Key (Free) ↗</a>
              </label>
              <div style="display:flex;gap:var(--sp-2)">
                <input class="form-input" id="ai-key-input" type="password" value="${config.apiKey || ''}" placeholder="AIzaSy..." style="font-family:monospace;letter-spacing:0.05em">
                <button class="btn btn-ghost" type="button" onclick="toggleAiVisibility()" id="btn-toggle-key-visibility" title="Show/Hide Key" style="padding:0 12px">👁️</button>
              </div>
              <span style="font-size:var(--text-xs);color:var(--text-muted);margin-top:4px">Your key is stored securely in your browser's local storage.</span>
            </div>

            <!-- Model Selection -->
            <div class="form-group">
              <label class="form-label" for="ai-model-select">Model Version</label>
              <select class="form-select" id="ai-model-select">
                <option value="gemini-3.5-flash" ${!config.model || config.model === 'gemini-3.5-flash' || config.model === 'gemini-2.5-flash' || config.model === 'gemini-2.0-flash' || config.model === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-3.5-flash — Recommended · Fastest &amp; Accurate</option>
                <option value="gemini-3.5-pro" ${config.model === 'gemini-3.5-pro' || config.model === 'gemini-2.5-pro' || config.model === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-3.5-pro — Most Capable · Deep Reasoning</option>
              </select>
              <span style="font-size:var(--text-xs);color:var(--text-muted);margin-top:4px;display:block">Only the latest Gemini 3.5 generation models are supported.</span>
            </div>

            <!-- Enable / Disable Switch -->
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:var(--sp-3);cursor:pointer;user-select:none">
                <input type="checkbox" id="ai-enable-switch" ${config.enabled ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--primary)">
                <div>
                  <div style="font-weight:600;font-size:var(--text-sm);color:var(--text)">Enable Gemini AI Engine</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted)">When unchecked, Tabld uses the built-in rule parser fallback</div>
                </div>
              </label>
            </div>

            <!-- Test Connection Results Container -->
            <div id="ai-test-result" style="display:none;padding:var(--sp-3);border-radius:var(--r-md);font-size:var(--text-xs)"></div>

            <!-- Action buttons -->
            <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;margin-top:var(--sp-2)">
              <button class="btn btn-primary" onclick="saveApiKey()" id="btn-save-ai">Save Settings</button>
              <button class="btn btn-ghost" onclick="testAiConnection()" id="btn-test-ai">⚡ Test Connection</button>
              <button class="btn btn-danger btn-sm" onclick="clearAiKey()" style="margin-left:auto">Clear Key</button>
            </div>
          </div>

          <!-- Feature status & explanation card -->
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-6);display:flex;flex-direction:column;gap:var(--sp-4)">
            <div style="display:flex;align-items:center;gap:var(--sp-3);padding-bottom:var(--sp-3);border-bottom:1px solid var(--border)">
              <div style="width:36px;height:36px;border-radius:var(--r-md);background:rgba(59,130,246,0.12);color:var(--info);display:flex;align-items:center;justify-content:center;font-size:18px">✨</div>
              <div>
                <h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text);margin:0">AI-Powered Capabilities</h3>
                <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0">Integrated throughout the guest experience</p>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:var(--sp-3);font-size:var(--text-sm)">
              <div style="display:flex;gap:var(--sp-3);align-items:flex-start">
                <span style="color:var(--primary);font-size:16px;line-height:1">🔍</span>
                <div>
                  <strong style="color:var(--text)">Natural Language Search</strong>
                  <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:2px">Parses natural dining queries into cuisine, budget, ambience, and occasion filters.</div>
                </div>
              </div>
              <div style="display:flex;gap:var(--sp-3);align-items:flex-start">
                <span style="color:var(--primary);font-size:16px;line-height:1">🎯</span>
                <div>
                  <strong style="color:var(--text)">Personalized Match Reasons</strong>
                  <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:2px">Dynamically explains to diners why a curated venue fits their exact taste profile.</div>
                </div>
              </div>
              <div style="display:flex;gap:var(--sp-3);align-items:flex-start">
                <span style="color:var(--primary);font-size:16px;line-height:1">🧩</span>
                <div>
                  <strong style="color:var(--text)">Adaptive Taste Onboarding</strong>
                  <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:2px">Generates contextual follow-up questions during new diner profile onboarding.</div>
                </div>
              </div>
              <div style="display:flex;gap:var(--sp-3);align-items:flex-start">
                <span style="color:var(--success);font-size:16px;line-height:1">🛡️</span>
                <div>
                  <strong style="color:var(--text)">Graceful Rule Fallback</strong>
                  <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-top:2px">When AI is offline or without a key, the built-in offline keyword engine handles all queries.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Interactive Intent Parser Playground -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-6)">
          <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-4)">
            <div style="width:36px;height:36px;border-radius:var(--r-md);background:rgba(34,197,94,0.12);color:var(--success);display:flex;align-items:center;justify-content:center;font-size:18px">🧪</div>
            <div>
              <h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text);margin:0">Intent Parser Playground</h3>
              <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0">Test natural language queries against the active engine</p>
            </div>
          </div>

          <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-bottom:var(--sp-4)">
            <input class="form-input" id="ai-playground-input" type="text" placeholder="e.g. Romantic Italian rooftop dinner under ₹2000 in Chennai" value="Romantic rooftop dinner with Italian pasta and quiet ambience" style="flex:1;min-width:260px">
            <button class="btn btn-primary" onclick="testAiIntent()" id="btn-run-intent">Test Parser</button>
          </div>

          <div id="ai-playground-output" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--sp-4);display:none">
            <div style="font-size:var(--text-xs);font-weight:600;color:var(--text-muted);margin-bottom:var(--sp-2);text-transform:uppercase;letter-spacing:0.05em">Parsed Intent Output</div>
            <pre id="ai-playground-json" style="margin:0;font-size:var(--text-xs);color:var(--text);overflow-x:auto;white-space:pre-wrap;font-family:monospace"></pre>
          </div>
        </div>

      </div>
    `;
  }

  function _bindAdminActions() {
    window.approveRestaurant = async function(id) {
      await DB.approveRestaurant(id);
      Components.toast('Restaurant approved', 'Listing is now live on Tabld.', 'success');
      if (window.adminSection) adminSection(_section);
    };

    window.rejectRestaurant = async function(id) {
      await DB.rejectRestaurant(id);
      Components.toast('Restaurant deleted', 'Listing removed from database.', 'error');
      if (window.adminSection) adminSection(_section);
    };

    window.toggleFeatured = async function(id) {
      await DB.toggleFeatured(id);
      if (window.adminSection) adminSection(_section);
    };

    window.approveListingApp = async function(appId) {
      const res = await DB.approveListingApplication(appId);
      if (res) {
        Components.toast('Application Approved! 🎉', `Created listing for "${res.name}" and promoted applicant to Owner.`, 'success', 6000);
      }
      if (window.adminSection) adminSection(_section);
    };

    window.rejectListingApp = async function(appId) {
      await DB.rejectListingApplication(appId);
      Components.toast('Application Rejected', 'Application status updated.', 'info');
      if (window.adminSection) adminSection(_section);
    };

    window.changeUserRole = async function(userId, newRole, currentRole) {
      if (newRole === 'owner') {
        // Show restaurant picker modal instead of immediately changing role
        _openOwnerRestaurantPicker(userId);
        // Reset the select back to current value — modal will handle the change
        const sel = document.querySelector(`select[data-user-id="${userId}"]`);
        if (sel) sel.value = currentRole || 'user';
        return;
      }
      await DB.updateProfile(userId, { role: newRole, restaurantId: null });
      // If downgrading from owner, remove their owner_id from the restaurant
      if (currentRole === 'owner') {
        await DB.clearRestaurantOwner(userId);
      }
      Components.toast('Role Updated', `User role set to ${newRole}.`, 'success');
      renderUsers();
    };

    window._openOwnerRestaurantPicker = async function(userId) {
      document.getElementById('owner-picker-modal')?.remove();

      const restaurants = await DB.getAllRestaurants();
      const approved    = restaurants.filter(r => r.approved);

      const modal = document.createElement('div');
      modal.id = 'owner-picker-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(9,9,11,0.8);backdrop-filter:blur(8px);padding:var(--sp-5);animation:fadeIn 0.15s ease';
      modal.innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-2xl);padding:var(--sp-7);max-width:520px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.6);animation:scaleIn 0.18s cubic-bezier(0.34,1.56,0.64,1);display:flex;flex-direction:column;gap:var(--sp-5);max-height:85vh">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text);margin:0">Assign Restaurant</h3>
              <p style="font-size:var(--text-xs);color:var(--text-muted);margin:var(--sp-1) 0 0">Select the restaurant this user will manage as owner</p>
            </div>
            <button onclick="document.getElementById('owner-picker-modal').remove()" style="background:none;border:none;color:var(--text-muted);font-size:1.4rem;cursor:pointer;line-height:1;padding:var(--sp-1)">×</button>
          </div>

          <input type="text" id="owner-picker-search" placeholder="Search restaurants…" oninput="filterOwnerPicker(this.value)"
            style="width:100%;padding:var(--sp-3) var(--sp-4);background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);color:var(--text);font-size:var(--text-sm);font-family:inherit;box-sizing:border-box" autofocus>

          <div id="owner-picker-list" style="display:flex;flex-direction:column;gap:var(--sp-2);overflow-y:auto;max-height:340px;padding-right:4px">
            ${approved.length === 0 ? `<div style="text-align:center;padding:var(--sp-8);color:var(--text-muted);font-size:var(--text-sm)">No approved restaurants found.</div>` : ''}
            ${approved.map(r => `
              <button class="owner-picker-item" data-id="${r.id}" data-name="${r.name.replace(/"/g,'&quot;')}" onclick="selectOwnerRestaurant('${userId}', ${r.id}, '${r.name.replace(/'/g, "\\'")}')"
                style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);cursor:pointer;text-align:left;width:100%;transition:border-color 0.15s,background 0.15s;font-family:inherit">
                <img src="${r.coverImage}" alt="${r.name}" style="width:44px;height:44px;border-radius:var(--r-md);object-fit:cover;flex-shrink:0" onerror="this.src='https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&q=50'">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:var(--text-sm);color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">${r.cuisine} · ${r.city} · ${r.priceRange}</div>
                  ${r.ownerId ? `<div style="font-size:var(--text-xs);color:var(--warning);margin-top:2px">⚠ Already has an owner</div>` : ''}
                </div>
                <span style="font-size:0.75rem;color:var(--text-muted)">→</span>
              </button>
            `).join('')}
          </div>

          <button onclick="document.getElementById('owner-picker-modal').remove()" class="btn btn-ghost btn-w-full">Cancel</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

      window.filterOwnerPicker = function(q) {
        const items = document.querySelectorAll('.owner-picker-item');
        const lq    = q.toLowerCase();
        items.forEach(item => {
          const name = (item.dataset.name || '').toLowerCase();
          item.style.display = name.includes(lq) ? '' : 'none';
        });
      };

      window.selectOwnerRestaurant = async function(uid, restaurantId, restaurantName) {
        document.getElementById('owner-picker-modal')?.remove();
        const btn = document.querySelector(`select[data-user-id="${uid}"]`);

        try {
          // 1. Update profile: role = owner, restaurant_id = restaurantId
          await DB.updateProfile(uid, { role: 'owner', restaurantId: restaurantId });
          // 2. Update restaurants.owner_id
          await DB.setRestaurantOwner(restaurantId, uid);
          Components.toast('Owner Assigned! 🏪', `User is now the owner of "${restaurantName}". They'll see the Owner module on next login.`, 'success', 6000);
          renderUsers();
        } catch(err) {
          Components.toast('Error', err.message || 'Failed to assign owner.', 'error');
        }
      };
    };

    window.toggleAiVisibility = function() {
      const input = document.getElementById('ai-key-input');
      const btn = document.getElementById('btn-toggle-key-visibility');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.textContent = '🔒';
      } else {
        input.type = 'password';
        if (btn) btn.textContent = '👁️';
      }
    };

    window.saveApiKey = function() {
      const key = document.getElementById('ai-key-input')?.value?.trim() || '';
      const model = document.getElementById('ai-model-select')?.value || 'gemini-3.5-flash';
      const enabled = Boolean(document.getElementById('ai-enable-switch')?.checked);

      if (window.AI) {
        AI.saveConfig({ apiKey: key, model, enabled: key.length > 5 ? enabled : false });
      }

      const isAct = window.AI && AI.isEnabled();
      const badge = document.getElementById('sb-ai-badge');
      if (badge) {
        badge.className = `badge ${isAct ? 'badge-approved' : 'badge-outline'}`;
        badge.textContent = isAct ? 'Active' : 'Off';
      }

      const statusPill = document.getElementById('ai-engine-status-pill');
      if (statusPill) {
        statusPill.className = `badge ${isAct ? 'badge-approved' : 'badge-outline'}`;
        statusPill.innerHTML = `
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${isAct ? '#22c55e' : '#94a3b8'}"></span>
          ${isAct ? 'AI Engine Active' : 'AI Engine Inactive / Fallback Active'}
        `;
      }

      Components.toast('AI Settings Saved', isAct ? 'Gemini AI engine is active!' : 'Settings saved. Fallback rule parser is active.', isAct ? 'success' : 'info');
    };

    window.clearAiKey = function() {
      if (confirm('Are you sure you want to clear the Gemini API key?')) {
        if (window.AI) {
          AI.saveConfig({ apiKey: '', model: 'gemini-3.5-flash', enabled: false });
        }
        renderAiSettings();
        const badge = document.getElementById('sb-ai-badge');
        if (badge) {
          badge.className = 'badge badge-outline';
          badge.textContent = 'Off';
        }
        Components.toast('API Key Cleared', 'Gemini AI has been reset.', 'info');
      }
    };

    window.testAiConnection = async function() {
      const key = document.getElementById('ai-key-input')?.value?.trim() || (window.AI ? AI.getApiKey() : '');
      const model = document.getElementById('ai-model-select')?.value || 'gemini-3.5-flash';
      const resultBox = document.getElementById('ai-test-result');
      const btn = document.getElementById('btn-test-ai');

      if (!key) {
        if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(239, 68, 68, 0.1)';
          resultBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
          resultBox.style.color = 'var(--danger)';
          resultBox.textContent = '⚠️ Please enter an API key first.';
        }
        return;
      }

      if (btn) { btn.disabled = true; btn.textContent = '⏳ Testing...'; }
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.style.background = 'rgba(59, 130, 246, 0.1)';
        resultBox.style.border = '1px solid rgba(59, 130, 246, 0.3)';
        resultBox.style.color = 'var(--info)';
        resultBox.textContent = `Connecting to Google Gemini (${model})...`;
      }

      try {
        const startTime = Date.now();
        await AI.testConnection(key, model);
        const latency = Date.now() - startTime;
        if (resultBox) {
          resultBox.style.background = 'rgba(34, 197, 94, 0.1)';
          resultBox.style.border = '1px solid rgba(34, 197, 94, 0.3)';
          resultBox.style.color = 'var(--success)';
          resultBox.innerHTML = `✅ <strong>Connected successfully!</strong> (${model} · ${latency}ms latency)`;
        }
        Components.toast('Connection Successful', `Connected to Gemini in ${latency}ms.`, 'success');
      } catch(err) {
        if (resultBox) {
          resultBox.style.background = 'rgba(239, 68, 68, 0.1)';
          resultBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
          resultBox.style.color = 'var(--danger)';
          resultBox.innerHTML = `❌ <strong>Connection Failed:</strong> ${err.message || err}`;
        }
        Components.toast('Connection Failed', err.message || 'Could not verify API key.', 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⚡ Test Connection'; }
      }
    };

    window.testAiIntent = async function() {
      const prompt = document.getElementById('ai-playground-input')?.value?.trim();
      const output = document.getElementById('ai-playground-output');
      const jsonPre = document.getElementById('ai-playground-json');
      const btn = document.getElementById('btn-run-intent');

      if (!prompt) return;

      if (btn) { btn.disabled = true; btn.textContent = 'Parsing...'; }
      if (output) output.style.display = 'block';
      if (jsonPre) jsonPre.textContent = 'Parsing natural language dining request...';

      try {
        const parsed = await AI.parseNaturalLanguageIntent(prompt);
        if (jsonPre) jsonPre.textContent = JSON.stringify(parsed, null, 2);
      } catch(err) {
        if (jsonPre) jsonPre.textContent = `Error: ${err.message}`;
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Test Parser'; }
      }
    };

    // ── Add Restaurant Modal ──────────────────────────────────
    window.openAddRestaurantModal = function() {
      // Remove existing modal if any
      document.getElementById('admin-add-restaurant-modal')?.remove();

      const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      const DAY_LABELS = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' };

      const hoursRows = DAYS.map(day => `
        <div class="arm-hours-row" id="arm-hours-${day}">
          <label class="arm-hours-label">${DAY_LABELS[day]}</label>
          <input class="form-input arm-time" type="time" id="arm-open-${day}" value="12:00">
          <span style="color:var(--text-muted);font-size:var(--text-sm)">to</span>
          <input class="form-input arm-time" type="time" id="arm-close-${day}" value="23:00">
          <label class="arm-closed-label">
            <input type="checkbox" id="arm-closed-${day}" onchange="armToggleClosed('${day}')">
            <span>Closed</span>
          </label>
        </div>
      `).join('');

      const modal = document.createElement('div');
      modal.id = 'admin-add-restaurant-modal';
      modal.className = 'modal-backdrop';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal modal-xl" role="dialog" aria-modal="true" aria-labelledby="arm-title" style="max-height:90vh;display:flex;flex-direction:column;">
          <div class="modal-header">
            <h2 class="modal-title" id="arm-title">Add New Restaurant</h2>
            <button class="modal-close" onclick="document.getElementById('admin-add-restaurant-modal').remove()" aria-label="Close">&times;</button>
          </div>

          <!-- Step tabs -->
          <div class="arm-tabs" role="tablist">
            <button class="arm-tab active" id="arm-tab-1" onclick="armGoStep(1)" role="tab" aria-selected="true">1. Basic Info</button>
            <button class="arm-tab" id="arm-tab-2" onclick="armGoStep(2)" role="tab" aria-selected="false">2. Contact</button>
            <button class="arm-tab" id="arm-tab-3" onclick="armGoStep(3)" role="tab" aria-selected="false">3. Details</button>
            <button class="arm-tab" id="arm-tab-4" onclick="armGoStep(4)" role="tab" aria-selected="false">4. Hours</button>
            <button class="arm-tab" id="arm-tab-5" onclick="armGoStep(5)" role="tab" aria-selected="false">5. Settings</button>
          </div>

          <div class="modal-body" style="overflow-y:auto;flex:1;">

            <!-- STEP 1: Basic Info -->
            <div class="arm-step" id="arm-step-1">
              <div class="arm-grid-2">
                <div class="form-group">
                  <label class="form-label" for="arm-name">Restaurant Name <span class="arm-req">*</span></label>
                  <input class="form-input" id="arm-name" type="text" placeholder="e.g. The Spice Garden" maxlength="100" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="arm-cuisine">Cuisine Type <span class="arm-req">*</span></label>
                  <input class="form-input" id="arm-cuisine" type="text" placeholder="e.g. South Indian, Italian" maxlength="80" required>
                </div>
              </div>
              <div class="arm-grid-2">
                <div class="form-group">
                  <label class="form-label" for="arm-city">City <span class="arm-req">*</span></label>
                  <input class="form-input" id="arm-city" type="text" placeholder="e.g. Chennai" value="Chennai" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="arm-price">Price Range <span class="arm-req">*</span></label>
                  <select class="form-select" id="arm-price">
                    <option value="₹">₹ — Budget</option>
                    <option value="₹₹" selected>₹₹ — Casual</option>
                    <option value="₹₹₹">₹₹₹ — Mid-range</option>
                    <option value="₹₹₹₹">₹₹₹₹ — Fine Dining</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="arm-address">Full Address <span class="arm-req">*</span></label>
                <input class="form-input" id="arm-address" type="text" placeholder="Street, Area, City, PIN" required>
              </div>
              <div class="arm-grid-2">
                <div class="form-group">
                  <label class="form-label" for="arm-capacity">Seating Capacity</label>
                  <input class="form-input" id="arm-capacity" type="number" min="1" max="1000" value="30" placeholder="30">
                </div>
                <div class="form-group">
                  <label class="form-label" for="arm-distance">Distance from City Centre (km)</label>
                  <input class="form-input" id="arm-distance" type="number" min="0" step="0.1" value="2.0" placeholder="2.0">
                </div>
              </div>
            </div>

            <!-- STEP 2: Contact & Media -->
            <div class="arm-step" id="arm-step-2" style="display:none">
              <div class="arm-grid-2">
                <div class="form-group">
                  <label class="form-label" for="arm-phone">Phone Number</label>
                  <input class="form-input" id="arm-phone" type="tel" placeholder="+91 98765 43210">
                </div>
                <div class="form-group">
                  <label class="form-label" for="arm-email">Booking / Contact Email</label>
                  <input class="form-input" id="arm-email" type="email" placeholder="info@restaurant.com">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="arm-website">Website URL</label>
                <input class="form-input" id="arm-website" type="url" placeholder="https://www.restaurant.com">
              </div>
              <div class="form-group">
                <label class="form-label" for="arm-cover">Cover Image URL <span class="arm-req">*</span></label>
                <input class="form-input" id="arm-cover" type="url" placeholder="https://...image.jpg" oninput="armPreviewCover()">
                <div id="arm-cover-preview" style="margin-top:var(--sp-3);display:none">
                  <img id="arm-cover-img" src="" alt="Cover preview" style="width:100%;max-height:200px;object-fit:cover;border-radius:var(--r-lg);border:1px solid var(--border)">
                </div>
                <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--sp-1)">Use an Unsplash URL or any publicly accessible image link.</p>
              </div>
              <div class="form-group">
                <label class="form-label" for="arm-gmaps">Google Maps URL</label>
                <input class="form-input" id="arm-gmaps" type="url" placeholder="https://maps.google.com/...">
              </div>
            </div>

            <!-- STEP 3: Descriptions & Tags -->
            <div class="arm-step" id="arm-step-3" style="display:none">
              <div class="form-group">
                <label class="form-label" for="arm-short-desc">Short Description <span class="arm-req">*</span></label>
                <input class="form-input" id="arm-short-desc" type="text" placeholder="Brief tagline shown on cards" maxlength="160" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="arm-editorial-desc">Editorial Description</label>
                <textarea class="form-input" id="arm-editorial-desc" rows="4" placeholder="Longer curated description shown on the restaurant page…" style="resize:vertical"></textarea>
              </div>
              <div class="arm-grid-2">
                <div class="form-group">
                  <label class="form-label" for="arm-ambience">Ambience</label>
                  <select class="form-select" id="arm-ambience">
                    <option value="Casual">Casual</option>
                    <option value="Fine Dining">Fine Dining</option>
                    <option value="Romantic">Romantic</option>
                    <option value="Family">Family</option>
                    <option value="Rooftop">Rooftop</option>
                    <option value="Bar & Lounge">Bar &amp; Lounge</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Cosy">Cosy</option>
                    <option value="Trendy">Trendy</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="arm-noise">Noise Level</label>
                  <select class="form-select" id="arm-noise">
                    <option value="Quiet">Quiet</option>
                    <option value="Moderate" selected>Moderate</option>
                    <option value="Lively">Lively</option>
                    <option value="Loud">Loud</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="arm-vibe-tags">Vibe Tags <span style="color:var(--text-muted);font-weight:400;font-size:var(--text-xs)">(comma separated)</span></label>
                <input class="form-input" id="arm-vibe-tags" type="text" placeholder="e.g. Date Night, Family Friendly, Pet Friendly">
              </div>
              <div class="form-group">
                <label class="form-label" for="arm-best-dishes">Signature Dishes <span style="color:var(--text-muted);font-weight:400;font-size:var(--text-xs)">(comma separated)</span></label>
                <input class="form-input" id="arm-best-dishes" type="text" placeholder="e.g. Butter Chicken, Paneer Tikka">
              </div>
              <div class="form-group">
                <label class="form-label">Accessibility</label>
                <div style="display:flex;flex-wrap:wrap;gap:var(--sp-3);margin-top:var(--sp-1)">
                  <label class="arm-check-label"><input type="checkbox" id="arm-acc-wheelchair" checked> Wheelchair Access</label>
                  <label class="arm-check-label"><input type="checkbox" id="arm-acc-braille"> Braille Menu</label>
                  <label class="arm-check-label"><input type="checkbox" id="arm-acc-hearing"> Hearing Loop</label>
                  <label class="arm-check-label"><input type="checkbox" id="arm-acc-largetext"> Large Text Menu</label>
                </div>
              </div>
            </div>

            <!-- STEP 4: Opening Hours -->
            <div class="arm-step" id="arm-step-4" style="display:none">
              <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--sp-4)">Set opening and closing times for each day. Check 'Closed' for days the restaurant does not operate.</p>
              <div class="arm-hours-grid">
                ${hoursRows}
              </div>
              <div style="margin-top:var(--sp-5)">
                <label class="form-label" for="arm-slots">Available Booking Slots <span style="color:var(--text-muted);font-weight:400;font-size:var(--text-xs)">(comma separated, e.g. 12:00, 19:00, 20:30)</span></label>
                <input class="form-input" id="arm-slots" type="text" value="12:00, 13:00, 19:00, 19:30, 20:00, 20:30, 21:00">
              </div>
            </div>

            <!-- STEP 5: Settings -->
            <div class="arm-step" id="arm-step-5" style="display:none">
              <div class="form-group">
                <label class="form-label">Listing Status</label>
                <div style="display:flex;gap:var(--sp-3);flex-wrap:wrap;margin-top:var(--sp-1)">
                  <label class="arm-radio-label">
                    <input type="radio" name="arm-approved" id="arm-approved-yes" value="yes" checked>
                    <span class="arm-radio-pill">✓ Approved &amp; Live</span>
                  </label>
                  <label class="arm-radio-label">
                    <input type="radio" name="arm-approved" id="arm-approved-no" value="no">
                    <span class="arm-radio-pill">⏳ Pending Review</span>
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Flags</label>
                <div style="display:flex;flex-wrap:wrap;gap:var(--sp-3);margin-top:var(--sp-1)">
                  <label class="arm-check-label"><input type="checkbox" id="arm-featured"> ⭐ Featured</label>
                  <label class="arm-check-label"><input type="checkbox" id="arm-trending"> 🔥 Trending</label>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="arm-rating">Initial Rating</label>
                <input class="form-input" id="arm-rating" type="number" min="1" max="5" step="0.1" value="4.8" style="max-width:120px">
              </div>
              <div class="arm-review-panel" id="arm-review-panel" style="display:none">
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:var(--sp-5);font-size:var(--text-sm);color:var(--text-secondary)">
                  <strong style="color:var(--text)">Review before submitting</strong>
                  <div id="arm-summary" style="margin-top:var(--sp-3);display:flex;flex-direction:column;gap:var(--sp-2)"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer navigation -->
          <div class="modal-footer" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--sp-2)">
            <button class="btn btn-ghost" id="arm-btn-prev" onclick="armStep(-1)" style="display:none">← Back</button>
            <div style="display:flex;gap:var(--sp-2);margin-left:auto">
              <button class="btn btn-ghost" onclick="document.getElementById('admin-add-restaurant-modal').remove()">Cancel</button>
              <button class="btn btn-primary" id="arm-btn-next" onclick="armStep(1)">Next →</button>
              <button class="btn btn-success" id="arm-btn-submit" onclick="armSubmit()" style="display:none">✓ Create Restaurant</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Close on backdrop click
      modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
      });

      window._armCurrentStep = 1;
      window._armTotalSteps = 5;
    };

    window.armGoStep = function(n) {
      const total = window._armTotalSteps || 5;
      for (let i = 1; i <= total; i++) {
        const step = document.getElementById(`arm-step-${i}`);
        const tab  = document.getElementById(`arm-tab-${i}`);
        if (step) step.style.display = (i === n) ? '' : 'none';
        if (tab)  { tab.classList.toggle('active', i === n); tab.setAttribute('aria-selected', i === n); }
      }
      document.getElementById('arm-btn-prev').style.display = n > 1 ? '' : 'none';
      document.getElementById('arm-btn-next').style.display = n < total ? '' : 'none';
      document.getElementById('arm-btn-submit').style.display = n === total ? '' : 'none';
      if (n === total) armBuildSummary();
      window._armCurrentStep = n;
    };

    window.armStep = function(dir) {
      const cur   = window._armCurrentStep || 1;
      const total = window._armTotalSteps  || 5;
      const next  = Math.min(Math.max(cur + dir, 1), total);
      if (dir > 0 && !armValidateStep(cur)) return;
      armGoStep(next);
    };

    window.armValidateStep = function(step) {
      if (step === 1) {
        const name    = document.getElementById('arm-name')?.value?.trim();
        const cuisine = document.getElementById('arm-cuisine')?.value?.trim();
        const city    = document.getElementById('arm-city')?.value?.trim();
        const address = document.getElementById('arm-address')?.value?.trim();
        if (!name)    { Components.toast('Validation', 'Restaurant name is required.', 'error'); return false; }
        if (!cuisine) { Components.toast('Validation', 'Cuisine type is required.', 'error'); return false; }
        if (!city)    { Components.toast('Validation', 'City is required.', 'error'); return false; }
        if (!address) { Components.toast('Validation', 'Address is required.', 'error'); return false; }
      }
      if (step === 3) {
        const desc = document.getElementById('arm-short-desc')?.value?.trim();
        if (!desc) { Components.toast('Validation', 'A short description is required.', 'error'); return false; }
      }
      return true;
    };

    window.armToggleClosed = function(day) {
      const closed = document.getElementById(`arm-closed-${day}`)?.checked;
      const row = document.getElementById(`arm-hours-${day}`);
      if (!row) return;
      row.querySelectorAll('input[type="time"]').forEach(el => el.disabled = closed);
      row.style.opacity = closed ? '0.45' : '1';
    };

    window.armPreviewCover = function() {
      const url = document.getElementById('arm-cover')?.value?.trim();
      const wrap = document.getElementById('arm-cover-preview');
      const img  = document.getElementById('arm-cover-img');
      if (url && wrap && img) {
        img.src = url;
        wrap.style.display = '';
        img.onerror = () => { wrap.style.display = 'none'; };
      } else if (wrap) {
        wrap.style.display = 'none';
      }
    };

    window.armBuildSummary = function() {
      const name     = document.getElementById('arm-name')?.value?.trim() || '—';
      const cuisine  = document.getElementById('arm-cuisine')?.value?.trim() || '—';
      const city     = document.getElementById('arm-city')?.value?.trim() || '—';
      const price    = document.getElementById('arm-price')?.value || '₹₹';
      const address  = document.getElementById('arm-address')?.value?.trim() || '—';
      const approved = document.querySelector('input[name="arm-approved"]:checked')?.value === 'yes';
      const featured = document.getElementById('arm-featured')?.checked;
      const trending = document.getElementById('arm-trending')?.checked;

      const el = document.getElementById('arm-summary');
      if (!el) return;
      el.innerHTML = [
        `<div>🍽️ <strong>${name}</strong> · ${cuisine} · ${city}</div>`,
        `<div>💰 ${price} · 📍 ${address}</div>`,
        `<div>📋 Status: <strong>${approved ? '✅ Approved & Live' : '⏳ Pending Review'}</strong></div>`,
        featured ? `<div>⭐ Will be featured</div>` : '',
        trending ? `<div>🔥 Marked as trending</div>` : ''
      ].join('');
      document.getElementById('arm-review-panel').style.display = '';
    };

    window.armSubmit = async function() {
      if (!armValidateStep(1) || !armValidateStep(3)) return;

      const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
      const hours = {};
      DAYS.forEach(day => {
        hours[day] = {
          open:   document.getElementById(`arm-open-${day}`)?.value  || '12:00',
          close:  document.getElementById(`arm-close-${day}`)?.value || '23:00',
          closed: Boolean(document.getElementById(`arm-closed-${day}`)?.checked)
        };
      });

      const rawSlots = (document.getElementById('arm-slots')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
      const vibeTags = (document.getElementById('arm-vibe-tags')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
      const bestDishes = (document.getElementById('arm-best-dishes')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
      const noiseMap = { Quiet: 1, Moderate: 2, Lively: 3, Loud: 4 };
      const noiseLevel = document.getElementById('arm-noise')?.value || 'Moderate';
      const cuisine = document.getElementById('arm-cuisine')?.value?.trim() || '';
      const coverImage = document.getElementById('arm-cover')?.value?.trim() ||
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80';

      const data = {
        name:                document.getElementById('arm-name')?.value?.trim(),
        cuisine,
        cuisineCategory:     cuisine,
        cuisineFilters:      [cuisine].concat(vibeTags).filter(Boolean),
        city:                document.getElementById('arm-city')?.value?.trim() || 'Chennai',
        priceRange:          document.getElementById('arm-price')?.value || '₹₹',
        address:             document.getElementById('arm-address')?.value?.trim(),
        capacity:            Number(document.getElementById('arm-capacity')?.value) || 30,
        distanceKm:          Number(document.getElementById('arm-distance')?.value) || 0,
        phone:               document.getElementById('arm-phone')?.value?.trim() || '',
        email:               document.getElementById('arm-email')?.value?.trim() || '',
        website:             document.getElementById('arm-website')?.value?.trim() || '',
        coverImage,
        gallery:             [coverImage],
        googleMapsUrl:       document.getElementById('arm-gmaps')?.value?.trim() || '',
        shortDescription:    document.getElementById('arm-short-desc')?.value?.trim(),
        editorialDescription:document.getElementById('arm-editorial-desc')?.value?.trim() || '',
        ambience:            document.getElementById('arm-ambience')?.value || 'Casual',
        noiseLevel,
        noiseLevelScore:     noiseMap[noiseLevel] || 2,
        vibeTags:            vibeTags.length ? vibeTags : [cuisine],
        bestDishes,
        accessibility: {
          wheelchairAccess: Boolean(document.getElementById('arm-acc-wheelchair')?.checked),
          brailleMenu:      Boolean(document.getElementById('arm-acc-braille')?.checked),
          hearingLoop:      Boolean(document.getElementById('arm-acc-hearing')?.checked),
          largeText:        Boolean(document.getElementById('arm-acc-largetext')?.checked),
          note: ''
        },
        hours,
        availableSlots: rawSlots.length ? rawSlots : ["12:00","13:00","19:00","19:30","20:00","20:30","21:00"],
        approved:  document.querySelector('input[name="arm-approved"]:checked')?.value === 'yes',
        featured:  Boolean(document.getElementById('arm-featured')?.checked),
        trending:  Boolean(document.getElementById('arm-trending')?.checked),
        rating:    Number(document.getElementById('arm-rating')?.value) || 4.8
      };

      const btn = document.getElementById('arm-btn-submit');
      if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }

      const result = await DB.adminCreateRestaurant(data);

      if (result) {
        document.getElementById('admin-add-restaurant-modal')?.remove();
        Components.toast('Restaurant Created! 🎉', `"${result.name}" has been added to the database.`, 'success', 5000);
        if (window.adminSection) adminSection('restaurants');
      } else {
        if (btn) { btn.disabled = false; btn.textContent = '✓ Create Restaurant'; }
        Components.toast('Error', 'Failed to create restaurant. Check console for details.', 'error');
      }
    };
  }

  return { render };
})();
