// ============================================================
// TABLD — Auth Module (Supabase Auth Integration)
// Handles login, register, logout, session persistence & role guards
// ============================================================

window.Auth = (function () {
  const SESSION_KEY = 'tabld_session';
  let _cachedUser = null;

  function _loadSession() {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) _cachedUser = JSON.parse(s);
    } catch (e) {
      _cachedUser = null;
    }
  }
  _loadSession();

  function _saveSession(user) {
    if (!user) {
      _clearSession();
      return;
    }
    _cachedUser = {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'User')}&backgroundColor=e8732a&textColor=ffffff`,
      phone: user.phone || '',
      onboardingCompleted: user.onboardingCompleted || false,
      tasteProfile: user.tasteProfile || null,
      restaurantId: user.restaurantId || null,
      savedRestaurants: user.savedRestaurants || []
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(_cachedUser));
    } catch (e) {}
  }

  function _clearSession() {
    _cachedUser = null;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  // Fetch or create profile for a Supabase auth user
  async function _syncProfile(authUser, fallbackMeta = {}) {
    if (!window.supa) return null;
    try {
      const { data: profile, error } = await supa
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const adminEmail = (window.TABLD_ADMIN_EMAIL || '').trim().toLowerCase();
      const userEmail = (authUser.email || '').trim().toLowerCase();
      const isAutoAdmin = adminEmail && userEmail === adminEmail;

      if (!profile || error) {
        // Create initial profile
        const newProfile = {
          id: authUser.id,
          name: fallbackMeta.name || authUser.user_metadata?.name || userEmail.split('@')[0],
          email: authUser.email,
          role: isAutoAdmin ? 'admin' : (fallbackMeta.role || authUser.user_metadata?.role || 'user'),
          avatar: fallbackMeta.avatar || authUser.user_metadata?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackMeta.name || authUser.email)}&backgroundColor=e8732a&textColor=ffffff`,
          onboarding_completed: false
        };
        const { data: created } = await supa.from('profiles').upsert([newProfile]).select().single();
        if (created) return DB.getUserById(authUser.id);
      } else {
        // Auto-promote if email matches configured admin email
        if (isAutoAdmin && profile.role !== 'admin') {
          await supa.from('profiles').update({ role: 'admin' }).eq('id', authUser.id);
          profile.role = 'admin';
        }
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          phone: profile.phone,
          avatar: profile.avatar,
          onboardingCompleted: profile.onboarding_completed,
          tasteProfile: profile.taste_profile,
          restaurantId: profile.restaurant_id,
          savedRestaurants: profile.saved_restaurants || []
        };
      }
    } catch (err) {
      console.error('[Auth] _syncProfile error:', err);
    }
    return null;
  }

  return {
    async init() {
      if (!window.supa) return;
      try {
        const { data: { session } } = await supa.auth.getSession();
        if (session && session.user) {
          const profile = await _syncProfile(session.user);
          if (profile) _saveSession(profile);
        } else {
          // If no active supabase session, clear local cached session
          _clearSession();
        }

        // Listen for auth state changes
        supa.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const profile = await _syncProfile(session.user);
            if (profile) {
              _saveSession(profile);
              if (window.Components && Components.renderNav) Components.renderNav();
            }
          } else if (event === 'SIGNED_OUT') {
            _clearSession();
            if (window.Components && Components.renderNav) Components.renderNav();
          }
        });
      } catch (err) {
        console.error('[Auth] init error:', err);
      }
    },

    async login(email, password) {
      if (!window.supa) {
        return { ok: false, error: 'Database connection not initialized.' };
      }
      try {
        const { data, error } = await supa.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });

        if (error) {
          return { ok: false, error: error.message || 'Invalid email or password.' };
        }

        if (!data.user) {
          return { ok: false, error: 'Login failed. Please try again.' };
        }

        const profile = await _syncProfile(data.user);
        const userObj = profile || {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email.split('@')[0],
          role: data.user.user_metadata?.role || 'user'
        };

        _saveSession(userObj);
        return { ok: true, user: userObj };
      } catch (err) {
        return { ok: false, error: err.message || 'An unexpected error occurred.' };
      }
    },

    async register(name, email, password, role = 'user') {
      if (!window.supa) {
        return { ok: false, error: 'Database connection not initialized.' };
      }
      if (password.length < 8) {
        return { ok: false, error: 'Password must be at least 8 characters.' };
      }

      const adminEmail = (window.TABLD_ADMIN_EMAIL || '').trim().toLowerCase();
      const finalRole = (adminEmail && email.trim().toLowerCase() === adminEmail) ? 'admin' : role;
      const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=e8732a&textColor=ffffff`;

      try {
        const { data, error } = await supa.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name.trim(),
              role: finalRole,
              avatar: avatar
            }
          }
        });

        if (error) {
          return { ok: false, error: error.message || 'Registration failed.' };
        }

        const authUser = data.user;
        if (!authUser) {
          return { ok: false, error: 'User could not be created.' };
        }

        // Check if email confirmation is required (session will be null if confirmation is on)
        const needsEmailVerification = !data.session;

        // Upsert profile in public.profiles table
        try {
          await supa.from('profiles').upsert([{
            id: authUser.id,
            name: name.trim(),
            email: email.trim(),
            role: finalRole,
            avatar: avatar,
            onboarding_completed: false
          }]);
        } catch (profileErr) {
          console.warn('[Auth] Profile upsert warning:', profileErr);
        }

        const userObj = {
          id: authUser.id,
          name: name.trim(),
          email: email.trim(),
          role: finalRole,
          avatar: avatar,
          onboardingCompleted: false
        };

        if (!needsEmailVerification) {
          _saveSession(userObj);
        }

        return { ok: true, user: userObj, needsEmailVerification };
      } catch (err) {
        return { ok: false, error: err.message || 'An unexpected error occurred.' };
      }
    },

    async forgotPassword(email) {
      if (!window.supa) {
        return { ok: false, error: 'Database connection not initialized.' };
      }
      try {
        const { error } = await supa.auth.resetPasswordForEmail(email.trim());
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },

    logout() {
      // Show a polished confirmation modal before signing out.
      // A private _doLogout() handles the actual session teardown.
      document.getElementById('auth-signout-modal')?.remove();

      const modal = document.createElement('div');
      modal.id = 'auth-signout-modal';
      modal.style.cssText = [
        'position:fixed;inset:0;z-index:9999',
        'display:flex;align-items:center;justify-content:center',
        'background:rgba(9,9,11,0.75)',
        'backdrop-filter:blur(8px)',
        '-webkit-backdrop-filter:blur(8px)',
        'animation:fadeIn 0.15s ease',
        'padding:var(--sp-5)'
      ].join(';');

      modal.innerHTML = `
        <div style="
          background:var(--bg-card);
          border:1px solid var(--border);
          border-radius:var(--r-2xl);
          padding:var(--sp-8);
          max-width:360px;
          width:100%;
          text-align:center;
          box-shadow:0 24px 64px rgba(0,0,0,0.6);
          animation:scaleIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
        ">
          <img src="./assets/crying-cat.png" alt="Sad cat" style="width:96px;height:72px;object-fit:cover;border-radius:var(--r-lg);margin-bottom:var(--sp-4);box-shadow:0 4px 16px rgba(0,0,0,0.4);display:block;margin-left:auto;margin-right:auto;">
          <h3 style="
            font-family:var(--font-display);
            font-size:var(--text-xl);
            font-weight:700;
            color:var(--text);
            margin-bottom:var(--sp-2);
          ">Sign out of Tabld?</h3>
          <p style="
            font-size:var(--text-sm);
            color:var(--text-secondary);
            margin-bottom:var(--sp-7);
            line-height:1.6;
          ">You'll need to sign back in to access your reservations and profile.</p>
          <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
            <button id="auth-signout-confirm" style="
              width:100%;
              padding:var(--sp-3) var(--sp-5);
              background:var(--error, #ef4444);
              color:#fff;
              border:none;
              border-radius:var(--r-lg);
              font-size:var(--text-sm);
              font-weight:600;
              cursor:pointer;
              transition:opacity 0.15s;
              font-family:inherit;
            ">Yes, sign me out</button>
            <button id="auth-signout-cancel" style="
              width:100%;
              padding:var(--sp-3) var(--sp-5);
              background:var(--bg-elevated);
              color:var(--text-secondary);
              border:1px solid var(--border);
              border-radius:var(--r-lg);
              font-size:var(--text-sm);
              font-weight:500;
              cursor:pointer;
              transition:background 0.15s,color 0.15s;
              font-family:inherit;
            ">Stay signed in</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      const close = () => modal.remove();

      document.getElementById('auth-signout-confirm').onclick = () => {
        close();
        Auth._doLogout();
      };
      document.getElementById('auth-signout-cancel').onclick = close;

      // Backdrop click dismisses
      modal.addEventListener('click', e => { if (e.target === modal) close(); });

      // Escape key dismisses
      const onKey = e => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
      document.addEventListener('keydown', onKey);

      // Focus the cancel button by default (safe default)
      setTimeout(() => document.getElementById('auth-signout-cancel')?.focus(), 50);
    },

    async _doLogout() {
      _clearSession();
      if (window.supa) {
        try { await supa.auth.signOut(); } catch (e) {}
      }
      if (window.Components && Components.renderNav) Components.renderNav();
      window.location.hash = '#/login';
    },

    getCurrentUser() {
      if (!_cachedUser) _loadSession();
      return _cachedUser;
    },

    isLoggedIn() { return !!this.getCurrentUser(); },
    isRole(role) { const u = this.getCurrentUser(); return u && u.role === role; },
    isUser()  { return this.isRole('user'); },
    isOwner() { return this.isRole('owner'); },
    isAdmin() { return this.isRole('admin'); },

    requireAuth(redirect = '/login') {
      if (!this.isLoggedIn()) { window.location.hash = '#' + redirect; return false; }
      return true;
    },

    requireRole(role, redirect = '/login') {
      const user = this.getCurrentUser();
      if (!user) { window.location.hash = '#/login'; return false; }
      if (user.role !== role) {
        const dest = user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/owner' : '/home';
        window.location.hash = '#' + dest;
        return false;
      }
      return true;
    },

    async updateCurrentUser(data) {
      const user = this.getCurrentUser();
      if (!user) return null;
      const updated = { ...user, ...data };
      _saveSession(updated);
      if (window.DB && DB.updateProfile) {
        await DB.updateProfile(user.id, data);
      }
      return updated;
    },

    async refreshSession() {
      const user = this.getCurrentUser();
      if (!user || !window.DB) return null;
      const profile = await DB.getUserById(user.id);
      if (profile) {
        _saveSession(profile);
        return profile;
      }
      return user;
    }
  };
})();
