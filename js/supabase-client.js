// ============================================================
// TABLD — Supabase Client Initializer
// Loaded before all other scripts. Exposes window.supa.
// ============================================================

(function () {
  const SUPABASE_URL  = 'https://olzlqbletgvxaauujngg.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9semxxYmxldGd2eGFhdXVqbmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3OTQ0NTEsImV4cCI6MjEwMjM3MDQ1MX0.4pWrv3_N127X3mstUlT2FHLqI4SdXcq6ZiaP-HxewLU';

  // ── Admin email — users who register with this email get auto-promoted to admin
  // 👇 Replace this with your email address
  window.TABLD_ADMIN_EMAIL = 'abijithfeb2009@gmail.com';

  if (!window.supabase) {
    console.error('[TABLD] Supabase SDK not loaded. Check that the CDN script is above supabase-client.js in index.html.');
    return;
  }

  window.supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  console.log('[TABLD] Supabase client ready.');
})();
