// ============================================================
// TABLD — Auth Pages (Login, Register, Forgot Password)
// Connected with Supabase Auth
// ============================================================

window.Pages = window.Pages || {};
Pages.Auth = (function () {

  function renderLogin() {
    document.getElementById('app').innerHTML = `
      <main class="auth-page" id="login-page">
        <div class="auth-bg-glow auth-bg-glow-1" aria-hidden="true"></div>
        <div class="auth-bg-glow auth-bg-glow-2" aria-hidden="true"></div>
        <div class="auth-card animate-scale-in">
          <div class="auth-logo" onclick="navigate('/login')" role="link" tabindex="0" aria-label="Tabld">Tabld</div>
          <p class="auth-tagline">Hidden Gems. Reserved for You.</p>
          <h1 class="auth-heading">Welcome back</h1>
          <p class="auth-subheading">Sign in to continue to your account.</p>

          <form class="auth-form" id="login-form" novalidate onsubmit="handleLogin(event)">
            <div class="form-group">
              <label class="form-label" for="login-email">Email address</label>
              <input class="form-input" id="login-email" type="email" placeholder="you@example.com"
                autocomplete="email" required aria-required="true">
            </div>
            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-2)">
                <label class="form-label" for="login-password" style="margin-bottom:0">Password</label>
                <span class="auth-forgot" onclick="navigate('/forgot-password')" role="button" tabindex="0" aria-label="Forgot password">Forgot password?</span>
              </div>
              <div style="position:relative">
                <input class="form-input" id="login-password" type="password" placeholder="••••••••"
                  autocomplete="current-password" required aria-required="true" style="padding-right:72px">
                <button type="button" id="pw-toggle-btn"
                  style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-muted);font-size:var(--text-xs);font-weight:600;cursor:pointer;padding:var(--sp-1) var(--sp-2);border-radius:var(--r-sm);transition:color var(--t-fast)"
                  onclick="togglePw()" aria-label="Toggle password visibility">Show</button>
              </div>
            </div>
            <div id="login-error" class="form-error" style="display:none" role="alert"></div>
            <button type="submit" class="btn btn-primary btn-lg btn-w-full" id="login-submit">Sign In</button>
          </form>

          <p class="auth-switch">
            Don't have an account?
            <button onclick="navigate('/register')" aria-label="Create account">Create one free</button>
          </p>
        </div>
      </main>
    `;

    window.togglePw = function() {
      const input = document.getElementById('login-password');
      const btn = document.getElementById('pw-toggle-btn');
      if (!input || !btn) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
      } else {
        input.type = 'password';
        btn.textContent = 'Show';
      }
    };

    window.handleLogin = async function(e) {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value?.trim();
      const password = document.getElementById('login-password')?.value;
      const errEl = document.getElementById('login-error');
      const btn = document.getElementById('login-submit');

      if (errEl) errEl.style.display = 'none';
      document.getElementById('login-email')?.classList.remove('error');
      document.getElementById('login-password')?.classList.remove('error');

      if (!email || !password) {
        if (errEl) { errEl.textContent = 'Please enter both email and password.'; errEl.style.display = 'flex'; }
        return;
      }

      if (btn) { btn.classList.add('loading'); btn.disabled = true; }

      try {
        const result = await Auth.login(email, password);
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }

        if (!result.ok) {
          if (errEl) {
            errEl.textContent = result.error || 'Invalid email or password.';
            errEl.style.display = 'flex';
          }
          document.getElementById('login-email')?.classList.add('error');
          document.getElementById('login-password')?.classList.add('error');
          return;
        }

        Components.renderNav();
        Components.toast('Welcome back!', `Good to see you, ${result.user.name ? result.user.name.split(' ')[0] : 'there'}.`, 'success');
        const dest = result.user.role === 'admin' ? '/admin' : result.user.role === 'owner' ? '/owner' : '/home';
        navigate(dest);
      } catch (err) {
        if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
        if (errEl) { errEl.textContent = err.message || 'An error occurred during login.'; errEl.style.display = 'flex'; }
      }
    };
  }

  function renderRegister() {
    document.getElementById('app').innerHTML = `
      <main class="auth-page" id="register-page">
        <div class="auth-bg-glow auth-bg-glow-1" aria-hidden="true"></div>
        <div class="auth-bg-glow auth-bg-glow-2" aria-hidden="true"></div>
        <div class="auth-card animate-scale-in" style="max-width:520px" id="register-card">
          <div class="auth-logo" onclick="navigate('/home')" role="link" tabindex="0" aria-label="Tabld home">Tabld</div>
          <p class="auth-tagline">Hidden Gems. Reserved for You.</p>
          <h1 class="auth-heading">Create account</h1>
          <p class="auth-subheading">Join thousands of discerning diners discovering the best tables in Chennai.</p>

          <form class="auth-form" id="register-form" novalidate onsubmit="handleRegister(event)">
            <div class="form-group">
              <label class="form-label" for="reg-name">Full name *</label>
              <input class="form-input" id="reg-name" type="text" placeholder="Your full name"
                autocomplete="name" required aria-required="true">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-email">Email address *</label>
              <input class="form-input" id="reg-email" type="email" placeholder="you@example.com"
                autocomplete="email" required aria-required="true">
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-password">Password *</label>
              <input class="form-input" id="reg-password" type="password" placeholder="At least 8 characters"
                autocomplete="new-password" required aria-required="true" minlength="8">
              <span class="form-hint">Minimum 8 characters</span>
            </div>
            <div class="form-group">
              <label class="form-label">I am joining as</label>
              <div class="role-selector" role="radiogroup" aria-label="Account type">
                <label class="role-option selected" id="role-user" for="role-user-input">
                  <input type="radio" id="role-user-input" name="role" value="user" checked>
                  <div class="role-option-icon">🍽️</div>
                  <span class="role-option-label">Diner</span>
                  <span class="role-option-desc">Discover & book restaurants</span>
                </label>
                <label class="role-option" id="role-owner" for="role-owner-input">
                  <input type="radio" id="role-owner-input" name="role" value="owner">
                  <div class="role-option-icon">🏪</div>
                  <span class="role-option-label">Restaurant Owner</span>
                  <span class="role-option-desc">List & manage your restaurant</span>
                </label>
              </div>
            </div>

            <!-- Dynamic Restaurant Details Fields (Shown when Restaurant Owner is selected) -->
            <div id="restaurant-details-fields" style="display:none;margin-top:var(--sp-2);padding:var(--sp-5);background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-xl)" class="animate-fade-up">
              <div style="font-weight:700;color:var(--primary-light);margin-bottom:var(--sp-4);font-size:var(--text-sm);display:flex;align-items:center;gap:var(--sp-2)">
                <span>🏪</span> Restaurant Listing Details
              </div>

              <!-- Restaurant Profile Photo -->
              <div class="form-group" style="margin-bottom:var(--sp-4)">
                <label class="form-label" style="margin-bottom:var(--sp-2)">Restaurant Cover Photo</label>
                <div id="res-photo-drop" onclick="document.getElementById('reg-res-photo').click()"
                  style="border:2px dashed var(--border);border-radius:var(--r-lg);overflow:hidden;cursor:pointer;transition:border-color 0.2s,background 0.2s;min-height:140px;display:flex;align-items:center;justify-content:center;position:relative;background:var(--bg-surface)">
                  <img id="res-photo-preview" src="" alt="" style="display:none;width:100%;height:160px;object-fit:cover">
                  <div id="res-photo-placeholder" style="display:flex;flex-direction:column;align-items:center;gap:var(--sp-2);padding:var(--sp-6);color:var(--text-muted)">
                    <span style="font-size:2rem">📷</span>
                    <span style="font-size:var(--text-xs);font-weight:600;text-transform:uppercase;letter-spacing:0.08em">Upload a cover photo</span>
                    <span style="font-size:var(--text-xs)">Click to browse · JPG, PNG, WEBP up to 5 MB</span>
                  </div>
                  <button type="button" id="res-photo-remove" onclick="event.stopPropagation();clearResPhoto()"
                    style="display:none;position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.55);border:none;color:#fff;border-radius:var(--r-full);width:28px;height:28px;cursor:pointer;font-size:1rem;line-height:1;display:none;align-items:center;justify-content:center">✕</button>
                </div>
                <input type="file" id="reg-res-photo" accept="image/*" style="display:none" onchange="handleResPhotoSelect(this)">
              </div>

              <div class="form-group" style="margin-bottom:var(--sp-3)">
                <label class="form-label" for="reg-res-name">Restaurant Name *</label>
                <input class="form-input" id="reg-res-name" type="text" placeholder="e.g. Saffron & Spice">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-3)">
                <div class="form-group">
                  <label class="form-label" for="reg-res-cuisine">Cuisine *</label>
                  <input class="form-input" id="reg-res-cuisine" type="text" placeholder="e.g. Japanese, Italian, Indian">
                </div>
                <div class="form-group">
                  <label class="form-label" for="reg-res-city">City *</label>
                  <input class="form-input" id="reg-res-city" type="text" value="Chennai" readonly style="opacity:0.85">
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-3)">
                <div class="form-group">
                  <label class="form-label" for="reg-res-phone">Phone Number *</label>
                  <input class="form-input" id="reg-res-phone" type="tel" placeholder="+91 98765 43210">
                </div>
                <div class="form-group">
                  <label class="form-label" for="reg-res-email">Business Email *</label>
                  <input class="form-input" id="reg-res-email" type="email" placeholder="contact@restaurant.com">
                </div>
              </div>
              <div class="form-group" style="margin-bottom:var(--sp-3)">
                <label class="form-label" for="reg-res-address">Full Address *</label>
                <input class="form-input" id="reg-res-address" type="text" placeholder="Street address, locality, Chennai">
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-res-desc">Short Description / Story</label>
                <textarea class="form-textarea" id="reg-res-desc" rows="2" placeholder="Tell us about the dining experience, key dishes, and ambience…"></textarea>
              </div>
            </div>

            <div id="reg-error" class="form-error" style="display:none" role="alert"></div>
            <button type="submit" class="btn btn-primary btn-lg btn-w-full" id="reg-submit">Create Account</button>
          </form>

          <p class="auth-switch">
            Already have an account?
            <button onclick="navigate('/login')" aria-label="Sign in">Sign in</button>
          </p>
        </div>
      </main>
    `;

    // Role selector interactivity
    document.querySelectorAll('.role-option').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        const radio = el.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        const resFields = document.getElementById('restaurant-details-fields');
        if (resFields) {
          if (radio && radio.value === 'owner') {
            resFields.style.display = 'block';
            const regEmail = document.getElementById('reg-email')?.value;
            const resEmail = document.getElementById('reg-res-email');
            if (regEmail && resEmail && !resEmail.value) {
              resEmail.value = regEmail;
            }
          } else {
            resFields.style.display = 'none';
          }
        }
      });
    });

    // ── Restaurant photo helpers ────────────────────────────────
    window._resPhotoBlobUrl  = null; // object URL for previewing
    window._resPhotoDataUrl  = null; // base64 data URL to pass to DB

    window.handleResPhotoSelect = function(input) {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        Components.toast('File too large', 'Please choose an image under 5 MB.', 'error');
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = function(ev) {
        window._resPhotoDataUrl = ev.target.result;
        const preview     = document.getElementById('res-photo-preview');
        const placeholder = document.getElementById('res-photo-placeholder');
        const removeBtn   = document.getElementById('res-photo-remove');
        const drop        = document.getElementById('res-photo-drop');
        if (preview)     { preview.src = ev.target.result; preview.style.display = 'block'; }
        if (placeholder) { placeholder.style.display = 'none'; }
        if (removeBtn)   { removeBtn.style.display = 'flex'; }
        if (drop)        { drop.style.borderStyle = 'solid'; drop.style.borderColor = 'var(--primary)'; }
      };
      reader.readAsDataURL(file);
    };

    window.clearResPhoto = function() {
      window._resPhotoDataUrl = null;
      const input       = document.getElementById('reg-res-photo');
      const preview     = document.getElementById('res-photo-preview');
      const placeholder = document.getElementById('res-photo-placeholder');
      const removeBtn   = document.getElementById('res-photo-remove');
      const drop        = document.getElementById('res-photo-drop');
      if (input)       { input.value = ''; }
      if (preview)     { preview.src = ''; preview.style.display = 'none'; }
      if (placeholder) { placeholder.style.display = 'flex'; }
      if (removeBtn)   { removeBtn.style.display = 'none'; }
      if (drop)        { drop.style.borderStyle = 'dashed'; drop.style.borderColor = 'var(--border)'; }
    };

    // Drag-and-drop support
    setTimeout(() => {
      const drop = document.getElementById('res-photo-drop');
      if (!drop) return;
      drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--primary)'; });
      drop.addEventListener('dragleave', ()  => { drop.style.borderColor = window._resPhotoDataUrl ? 'var(--primary)' : 'var(--border)'; });
      drop.addEventListener('drop', e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const input = document.getElementById('reg-res-photo');
        const dt    = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        handleResPhotoSelect(input);
      });
    }, 50);

    window.handleRegister = async function(e) {
      e.preventDefault();
      const name     = document.getElementById('reg-name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const role     = document.querySelector('input[name="role"]:checked')?.value || 'user';
      const errEl    = document.getElementById('reg-error');
      const btn      = document.getElementById('reg-submit');

      errEl.style.display = 'none';
      if (!name) { errEl.textContent = 'Please enter your full name.'; errEl.style.display = 'flex'; return; }
      if (!email) { errEl.textContent = 'Please enter your email address.'; errEl.style.display = 'flex'; return; }
      if (password.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; errEl.style.display = 'flex'; return; }

      let resData = null;
      if (role === 'owner') {
        const resName    = document.getElementById('reg-res-name')?.value?.trim();
        const resCuisine = document.getElementById('reg-res-cuisine')?.value?.trim();
        const resPhone   = document.getElementById('reg-res-phone')?.value?.trim();
        const resEmail   = document.getElementById('reg-res-email')?.value?.trim() || email;
        const resAddress = document.getElementById('reg-res-address')?.value?.trim();
        const resDesc    = document.getElementById('reg-res-desc')?.value?.trim();

        if (!resName) { errEl.textContent = 'Please enter your restaurant name.'; errEl.style.display = 'flex'; return; }
        if (!resCuisine) { errEl.textContent = 'Please enter your restaurant cuisine.'; errEl.style.display = 'flex'; return; }
        if (!resPhone) { errEl.textContent = 'Please enter your restaurant phone number.'; errEl.style.display = 'flex'; return; }
        if (!resAddress) { errEl.textContent = 'Please enter your restaurant address.'; errEl.style.display = 'flex'; return; }

        resData = {
          name: resName,
          cuisine: resCuisine,
          city: 'Chennai',
          address: resAddress,
          phone: resPhone,
          email: resEmail,
          priceRange: '₹₹',
          shortDescription: resDesc || `A curated ${resCuisine} restaurant in Chennai.`,
          coverImage: window._resPhotoDataUrl || null
        };
      }

      btn.classList.add('loading');
      btn.disabled = true;

      try {
        const result = await Auth.register(name, email, password, role);
        btn.classList.remove('loading');
        btn.disabled = false;

        if (!result.ok) {
          errEl.textContent = result.error || 'Failed to create account.';
          errEl.style.display = 'flex';
          return;
        }

        // Check if email verification is needed
        if (result.needsEmailVerification) {
          const isOwner = (role === 'owner');
          document.getElementById('register-card').innerHTML = `
            <div style="text-align:center;padding:var(--sp-6) var(--sp-2)">
              <div style="font-size:3.5rem;margin-bottom:var(--sp-4)">${isOwner ? '⏳' : '✉️'}</div>
              <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-3)">
                ${isOwner ? 'Application Submitted' : 'Verify Your Email'}
              </h2>
              <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin-bottom:var(--sp-2)">
                We've sent a verification email to <strong>${email}</strong>.<br>
                Please check your inbox and click the confirmation link to activate your account.
              </p>
              ${isOwner ? `<p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;margin-bottom:var(--sp-6);padding:var(--sp-4);background:var(--bg-elevated);border-radius:var(--r-lg);border:1px solid var(--border)">
                🏪 Once verified, your restaurant listing will be reviewed by our team. You'll be notified when it's approved and live on Tabld.
              </p>` : ''}
              <button class="btn btn-primary btn-lg btn-w-full" onclick="navigate('/login')">Go to Sign In</button>
            </div>
          `;
          return;
        }

        // Immediate session — show owner awaiting approval screen or user onboarding
        if (role === 'owner' && resData) {
          await DB.submitListingApplication(resData, result.user.id);
          // Show awaiting approval screen in-place (no navigation to user module)
          _showOwnerAwaitingApproval(resData.name, name);
        } else {
          Components.toast('Welcome to Tabld!', `Your account is ready, ${name.split(' ')[0]}.`, 'success');
          navigate('/onboarding');
        }
      } catch (err) {
        btn.classList.remove('loading');
        btn.disabled = false;
        errEl.textContent = err.message || 'An error occurred during registration.';
        errEl.style.display = 'flex';
      }
    };

    function _showOwnerAwaitingApproval(restaurantName, ownerName) {
      document.getElementById('app').innerHTML = `
        <main class="auth-page" id="awaiting-page">
          <div class="auth-bg-glow auth-bg-glow-1" aria-hidden="true"></div>
          <div class="auth-bg-glow auth-bg-glow-2" aria-hidden="true"></div>
          <div class="auth-card animate-scale-in" style="max-width:500px;text-align:center">
            <div class="auth-logo" style="margin-bottom:var(--sp-6)">Tabld</div>

            <div style="width:80px;height:80px;margin:0 auto var(--sp-6);background:var(--primary-10);border-radius:var(--r-full);display:flex;align-items:center;justify-content:center;font-size:2.5rem;border:2px solid var(--primary)">
              ⏳
            </div>

            <h1 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-3)">
              Your Restaurant is Awaiting Approval
            </h1>
            <p style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.7;margin-bottom:var(--sp-4)">
              Thanks, <strong>${ownerName.split(' ')[0]}</strong>! We've received your listing application for
              <strong>${restaurantName}</strong> and it's now under review by our admin team.
            </p>

            <div style="background:var(--bg-elevated);border:1px solid var(--border);border-radius:var(--r-xl);padding:var(--sp-5);margin-bottom:var(--sp-6);text-align:left">
              <div style="display:flex;flex-direction:column;gap:var(--sp-3)">
                <div style="display:flex;align-items:flex-start;gap:var(--sp-3)">
                  <div style="width:28px;height:28px;min-width:28px;background:var(--primary-10);border-radius:var(--r-full);display:flex;align-items:center;justify-content:center;font-size:0.85rem;margin-top:1px">✔</div>
                  <div>
                    <div style="font-weight:600;font-size:var(--text-sm);color:var(--text)">Application submitted</div>
                    <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">Your restaurant details have been sent to our team</div>
                  </div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:var(--sp-3)">
                  <div style="width:28px;height:28px;min-width:28px;background:var(--bg-surface);border-radius:var(--r-full);display:flex;align-items:center;justify-content:center;font-size:0.85rem;margin-top:1px;color:var(--text-muted)">🔍</div>
                  <div>
                    <div style="font-weight:600;font-size:var(--text-sm);color:var(--text-secondary)">Under review</div>
                    <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">Usually takes 1–2 business days</div>
                  </div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:var(--sp-3)">
                  <div style="width:28px;height:28px;min-width:28px;background:var(--bg-surface);border-radius:var(--r-full);display:flex;align-items:center;justify-content:center;font-size:0.85rem;margin-top:1px;color:var(--text-muted)">🚀</div>
                  <div>
                    <div style="font-weight:600;font-size:var(--text-sm);color:var(--text-secondary)">Go live</div>
                    <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">Your listing will appear on Tabld once approved</div>
                  </div>
                </div>
              </div>
            </div>

            <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--sp-5)">
              Please check back later. You can sign in any time — your dashboard will unlock once your restaurant is approved.
            </p>

            <button class="btn btn-primary btn-lg btn-w-full" onclick="navigate('/login')" style="margin-bottom:var(--sp-3)">Back to Sign In</button>
            <button class="btn btn-ghost btn-w-full" onclick="navigate('/home')">Explore Tabld as a Guest</button>
          </div>
        </main>
      `;
    }
  }

  function renderForgot() {
    document.getElementById('app').innerHTML = `
      <main class="auth-page" id="forgot-page">
        <div class="auth-bg-glow auth-bg-glow-1" aria-hidden="true"></div>
        <div class="auth-card animate-scale-in">
          <div class="auth-logo" onclick="navigate('/home')" role="link" tabindex="0" aria-label="Tabld home">Tabld</div>
          <h1 class="auth-heading" id="forgot-heading">Reset password</h1>
          <p class="auth-subheading" id="forgot-sub">Enter your email and we'll send you a secure password reset link.</p>

          <form class="auth-form" id="forgot-form" novalidate onsubmit="handleForgot(event)">
            <div class="form-group">
              <label class="form-label" for="forgot-email">Email address</label>
              <input class="form-input" id="forgot-email" type="email" placeholder="you@example.com"
                autocomplete="email" required aria-required="true">
            </div>
            <div id="forgot-error" class="form-error" style="display:none" role="alert"></div>
            <button type="submit" class="btn btn-primary btn-lg btn-w-full" id="forgot-submit">Send Reset Link</button>
          </form>

          <p class="auth-switch">
            Remembered it?
            <button onclick="navigate('/login')" aria-label="Back to sign in">Sign in</button>
          </p>
        </div>
      </main>
    `;

    window.handleForgot = async function(e) {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const errEl = document.getElementById('forgot-error');
      const btn   = document.getElementById('forgot-submit');

      if (!email) { errEl.textContent = 'Please enter your email address.'; errEl.style.display = 'flex'; return; }
      btn.classList.add('loading'); btn.disabled = true;

      try {
        const result = await Auth.forgotPassword(email);
        btn.classList.remove('loading'); btn.disabled = false;

        if (!result.ok) {
          errEl.textContent = result.error || 'Failed to send reset link.';
          errEl.style.display = 'flex';
          return;
        }

        document.getElementById('forgot-form').innerHTML = `
          <div style="text-align:center;padding:var(--sp-6) 0">
            <div style="font-size:3rem;margin-bottom:var(--sp-4)">📬</div>
            <h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text);margin-bottom:var(--sp-3)">Check your inbox</h3>
            <p style="font-size:var(--text-sm);color:var(--text-secondary)">If an account exists for <strong>${email}</strong>, a password reset link has been sent.</p>
            <button class="btn btn-primary btn-lg" style="margin-top:var(--sp-6)" onclick="navigate('/login')">Back to Sign In</button>
          </div>
        `;
      } catch (err) {
        btn.classList.remove('loading'); btn.disabled = false;
        errEl.textContent = err.message || 'An error occurred.';
        errEl.style.display = 'flex';
      }
    };
  }

  return { renderLogin, renderRegister, renderForgot };
})();
