// ============================================================
// TABLD — Router Module
// Hash-based SPA router with role-based route guards
// ============================================================

window.Router = (function () {
  const PUBLIC_ROUTES = ['login', 'register', 'forgot-password'];

  const ROUTES = {
    'login':            { page: 'login',      roles: null },
    'register':         { page: 'register',   roles: null },
    'forgot-password':  { page: 'forgot',     roles: null },
    'home':             { page: 'home',       roles: ['user'] },
    'onboarding':       { page: 'onboarding', roles: ['user'] },
    'discover':         { page: 'discover',   roles: ['user'] },
    'restaurant':       { page: 'restaurant', roles: ['user'] },
    'profile':          { page: 'profile',    roles: ['user', 'admin'] },
    'owner':            { page: 'owner',      roles: ['owner'] },
    'admin':            { page: 'admin',      roles: ['admin'] },
  };

  function _getHashParts() {
    let raw = window.location.hash.replace(/^#\/?/, '') || 'home';
    const qIdx = raw.indexOf('?');
    if (qIdx !== -1) {
      raw = raw.substring(0, qIdx);
    }
    const parts = raw.split('/');
    return { route: parts[0] || 'home', param: parts[1] || null };
  }

  async function _render({ route, param }) {
    const config = ROUTES[route];
    let user = Auth.getCurrentUser();

    // Unknown route → redirect
    if (!config) { navigate('/home'); return; }

    // Public routes — redirect logged-in users away from auth pages
    if (PUBLIC_ROUTES.includes(route) && user) {
      navigate('/' + _defaultRouteForRole(user.role));
      return;
    }

    // For 'user' role: silently refresh session from DB to pick up any
    // role upgrades (e.g. admin approved their restaurant application).
    // This runs once per navigation so approved owners get auto-promoted.
    if (user && user.role === 'user') {
      try {
        const refreshed = await Auth.refreshSession();
        if (refreshed && refreshed.role !== 'user') {
          // Role has changed — update local reference and redirect to new home
          user = refreshed;
          if (window.Components && Components.renderNav) Components.renderNav();
          navigate('/' + _defaultRouteForRole(refreshed.role));
          return;
        }
        if (refreshed) user = refreshed;
      } catch (e) { /* non-fatal, continue with cached session */ }
    }

    // Protected routes — require login
    if (config.roles && !user) { navigate('/login'); return; }

    // Role-restricted routes — redirect to role default
    if (config.roles && user && !config.roles.includes(user.role)) {
      navigate('/' + _defaultRouteForRole(user.role));
      return;
    }

    // New user onboarding redirect guard — force onboarding if not completed
    if (user && user.role === 'user' && !user.onboardingCompleted && route !== 'onboarding') {
      navigate('/onboarding');
      return;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Update navbar state
    if (window.Components && Components.renderNav) Components.renderNav();

    // Render page
    switch (config.page) {
      case 'login':      Pages.Auth.renderLogin(); break;
      case 'register':   Pages.Auth.renderRegister(); break;
      case 'forgot':     Pages.Auth.renderForgot(); break;
      case 'home':       await Pages.Home.render(); break;
      case 'onboarding': Pages.Onboarding.render(); break;
      case 'discover':   await Pages.Discover.render(); break;
      case 'restaurant': await Pages.Restaurant.render(param); break;
      case 'profile':    await Pages.Profile.render(); break;
      case 'owner':      await Pages.Owner.render(); break;
      case 'admin':      await Pages.Admin.render(); break;
      default:           await Pages.Home.render();
    }
  }

  function _defaultRouteForRole(role) {
    if (role === 'admin') return 'admin';
    if (role === 'owner') return 'owner';
    return 'home';
  }

  return {
    init() {
      if (window._routerStarted) return;
      window._routerStarted = true;
      window.addEventListener('hashchange', () => _render(_getHashParts()));
      _render(_getHashParts());
    },

    navigate(path) {
      window.location.hash = '#' + path;
    },

    current() { return _getHashParts(); }
  };
})();

// Convenience global
function navigate(path) { Router.navigate(path); }
