// ============================================================
// TABLD — AI Onboarding Page
// Multi-step adaptive preference builder for new users
// ============================================================

window.Pages = window.Pages || {};
Pages.Onboarding = (function () {
  let _step = 1;
  let _answers = {
    cuisines: [],
    budget: '₹₹',
    priceLevel: 2,
    occasion: 'Casual',
    ambience: [],
    noiseLevel: 'Moderate',
    dietary: [],
    followUpAnswer: ''
  };

  function render() {
    const user = Auth.getCurrentUser();
    if (!user) { navigate('/login'); return; }

    _step = 1;
    _renderStep();
  }

  function _renderStep() {
    const user = Auth.getCurrentUser();
    const app  = document.getElementById('app');

    app.innerHTML = `
      <div class="container" style="max-width:680px;padding:var(--sp-12) var(--sp-6)">
        <!-- Progress Bar -->
        <div style="margin-bottom:var(--sp-8)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3)">
            <span style="font-size:var(--text-xs);font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--primary-light)">
              Taste Profile Setup · Step ${_step} of 4
            </span>
            <span style="font-size:var(--text-xs);color:var(--text-muted)">${_step * 25}% completed</span>
          </div>
          <div style="height:6px;background:var(--bg-elevated);border-radius:var(--r-full);overflow:hidden">
            <div style="height:100%;width:${_step * 25}%;background:linear-gradient(90deg, var(--primary), var(--accent));transition:width 0.4s ease"></div>
          </div>
        </div>

        <div id="onboarding-card" class="animate-fade-up">
          ${_getStepHtml(user)}
        </div>
      </div>
    `;
  }

  function _getStepHtml(user) {
    if (_step === 1) {
      const CUISINES = ['Japanese', 'Modern Indian', 'Italian', 'Korean', 'Mediterranean', 'Seafood', 'American', 'French', 'Spanish'];
      const DIETARY  = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'No Restrictions'];

      return `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-2xl);padding:var(--sp-8);box-shadow:var(--shadow-xl)">
          <div style="font-size:2.5rem;margin-bottom:var(--sp-3)">🍽️</div>
          <h1 style="font-family:var(--font-display);font-size:var(--text-3xl);color:var(--text);margin-bottom:var(--sp-2)">
            Welcome, ${user.name.split(' ')[0]}!
          </h1>
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--sp-6)">
            Let's build your personalized taste profile so Tabld can recommend tables you'll genuinely love.
          </p>

          <div style="margin-bottom:var(--sp-6)">
            <label class="form-label" style="margin-bottom:var(--sp-3)">What cuisines excite you most? (Select all that apply)</label>
            <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
              ${CUISINES.map(c => `
                <button type="button" class="filter-option ${_answers.cuisines.includes(c) ? 'selected' : ''}"
                  onclick="toggleOnboardingCuisine(this, '${c}')">${c}</button>
              `).join('')}
            </div>
          </div>

          <div style="margin-bottom:var(--sp-8)">
            <label class="form-label" style="margin-bottom:var(--sp-3)">Dietary Preferences</label>
            <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
              ${DIETARY.map(d => `
                <button type="button" class="filter-option ${_answers.dietary.includes(d) ? 'selected' : ''}"
                  onclick="toggleOnboardingDietary(this, '${d}')">${d}</button>
              `).join('')}
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end">
            <button class="btn btn-primary btn-lg" onclick="nextOnboardingStep(2)">
              Next Step ${Components.icons.arrow}
            </button>
          </div>
        </div>
      `;
    }

    if (_step === 2) {
      const BUDGETS = [
        { label: '₹ — Casual', val: '₹', level: 1, desc: 'Under ₹500 per person' },
        { label: '₹₹ — Moderate', val: '₹₹', level: 2, desc: '₹500 – ₹1500 per person' },
        { label: '₹₹₹ — Fine Dining', val: '₹₹₹', level: 3, desc: '₹1500 – ₹3500 per person' },
        { label: '₹₹₹₹ — Luxury', val: '₹₹₹₹', level: 4, desc: '₹3500+ per person' }
      ];

      const OCCASIONS = ['Casual Meal', 'Date Night', 'Celebration / Birthday', 'Work & Study', 'Family Dinner'];

      return `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-2xl);padding:var(--sp-8);box-shadow:var(--shadow-xl)">
          <div style="font-size:2.5rem;margin-bottom:var(--sp-3)">💳</div>
          <h2 style="font-family:var(--font-display);font-size:var(--text-3xl);color:var(--text);margin-bottom:var(--sp-2)">
            Budget & Occasion
          </h2>
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--sp-6)">
            Help us match recommendations to your comfort budget and dining style.
          </p>

          <div style="margin-bottom:var(--sp-6)">
            <label class="form-label" style="margin-bottom:var(--sp-3)">Preferred Price Range</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)">
              ${BUDGETS.map(b => `
                <div class="stat-card ${b.val === _answers.budget ? 'selected' : ''}"
                  style="cursor:pointer;border:2px solid ${b.val === _answers.budget ? 'var(--primary)' : 'var(--border)'};background:${b.val === _answers.budget ? 'var(--primary-10)' : 'var(--bg-elevated)'}"
                  onclick="selectOnboardingBudget('${b.val}', ${b.level})">
                  <div style="font-weight:700;color:${b.val === _answers.budget ? 'var(--primary-light)' : 'var(--text)'}">${b.label}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">${b.desc}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div style="margin-bottom:var(--sp-8)">
            <label class="form-label" style="margin-bottom:var(--sp-3)">Primary Dining Occasion</label>
            <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
              ${OCCASIONS.map(o => `
                <button type="button" class="filter-option ${_answers.occasion === o ? 'selected' : ''}"
                  onclick="selectOnboardingOccasion(this, '${o}')">${o}</button>
              `).join('')}
            </div>
          </div>

          <div style="display:flex;justify-content:space-between">
            <button class="btn btn-ghost" onclick="nextOnboardingStep(1)">Back</button>
            <button class="btn btn-primary btn-lg" onclick="nextOnboardingStep(3)">
              Next Step ${Components.icons.arrow}
            </button>
          </div>
        </div>
      `;
    }

    if (_step === 3) {
      const AMBIENCES = ['Serene', 'Intimate', 'Vibrant', 'Casual', 'Moody', 'Trendy'];
      const NOISE     = ['Quiet', 'Moderate', 'Lively'];

      return `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-2xl);padding:var(--sp-8);box-shadow:var(--shadow-xl)">
          <div style="font-size:2.5rem;margin-bottom:var(--sp-3)">✨</div>
          <h2 style="font-family:var(--font-display);font-size:var(--text-3xl);color:var(--text);margin-bottom:var(--sp-2)">
            Vibe & Atmosphere
          </h2>
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--sp-6)">
            What kind of environment makes you feel most comfortable?
          </p>

          <div style="margin-bottom:var(--sp-6)">
            <label class="form-label" style="margin-bottom:var(--sp-3)">Preferred Ambience (Select up to 3)</label>
            <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
              ${AMBIENCES.map(a => `
                <button type="button" class="filter-option ${_answers.ambience.includes(a) ? 'selected' : ''}"
                  onclick="toggleOnboardingAmbience(this, '${a}')">${a}</button>
              `).join('')}
            </div>
          </div>

          <div style="margin-bottom:var(--sp-8)">
            <label class="form-label" style="margin-bottom:var(--sp-3)">Preferred Noise Level</label>
            <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2)">
              ${NOISE.map(n => `
                <button type="button" class="filter-option ${_answers.noiseLevel === n ? 'selected' : ''}"
                  onclick="selectOnboardingNoise(this, '${n}')">${n}</button>
              `).join('')}
            </div>
          </div>

          <div style="display:flex;justify-content:space-between">
            <button class="btn btn-ghost" onclick="nextOnboardingStep(2)">Back</button>
            <button class="btn btn-primary btn-lg" onclick="loadAdaptiveQuestionStep()">
              Build Profile ${Components.icons.arrow}
            </button>
          </div>
        </div>
      `;
    }

    if (_step === 4) {
      return `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--r-2xl);padding:var(--sp-8);box-shadow:var(--shadow-xl);text-align:center" id="adaptive-step-content">
          <div id="loading-spinner" style="margin:var(--sp-8) auto;width:40px;height:40px;border:3px solid rgba(255,255,255,0.1);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite"></div>
          <h3 style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--text)">Analyzing your dining preferences…</h3>
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-top:var(--sp-2)">Creating your custom Taste Profile</p>
        </div>
      `;
    }
  }

  // ─── Adaptive Preference Question Step ────────────────────────
  window.loadAdaptiveQuestionStep = async function() {
    _step = 4;
    _renderStep();

    try {
      const followUp = await AI.generateOnboardingFollowUp(_answers);
      const container = document.getElementById('adaptive-step-content');
      if (container) {
        container.style.textAlign = 'left';
        container.innerHTML = `
          <div style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-3)">
            <span class="badge badge-trending">Preference Question</span>
          </div>
          <h2 style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--text);margin-bottom:var(--sp-4)">
            ${followUp.question}
          </h2>
          <div style="display:flex;flex-direction:column;gap:var(--sp-3);margin-bottom:var(--sp-8)">
            ${followUp.options.map((opt, i) => `
              <button class="btn btn-secondary" style="justify-content:flex-start;text-align:left;padding:var(--sp-4)"
                onclick="finishOnboarding('${opt.replace(/'/g, "\\'")}')">
                <span style="color:var(--primary-light);font-weight:700;margin-right:var(--sp-2)">0${i+1}.</span> ${opt}
              </button>
            `).join('')}
          </div>
          <div style="display:flex;justify-content:space-between">
            <button class="btn btn-ghost" onclick="nextOnboardingStep(3)">Back</button>
            <button class="btn btn-outline" onclick="finishOnboarding('Standard Preferences')">Skip & Complete Profile</button>
          </div>
        `;
      }
    } catch(e) {
      finishOnboarding('Standard Preferences');
    }
  };

  // ─── Finish Onboarding & Save Taste Profile ───────────────────
  window.finishOnboarding = async function(finalAnswer) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    _answers.followUpAnswer = finalAnswer;

    // Build finalized Taste Profile
    const tasteProfile = {
      cuisines: _answers.cuisines.length > 0 ? _answers.cuisines : ['Modern Indian', 'Japanese'],
      budget: _answers.budget,
      priceLevel: _answers.priceLevel,
      ambience: _answers.ambience.length > 0 ? _answers.ambience : ['Intimate', 'Casual'],
      noiseLevel: _answers.noiseLevel,
      dietary: _answers.dietary,
      occasions: [_answers.occasion],
      maxDistance: 15
    };

    await Auth.updateCurrentUser({ tasteProfile, onboardingCompleted: true });

    // Show toast and navigate to home
    Components.toast('Taste Profile Complete! ✨', 'Welcome to your personalized Tabld dining experience.', 'success', 5000);
    navigate('/home');
  };

  // ─── Global Step Handlers ─────────────────────────────────────
  window.nextOnboardingStep = function(stepNum) {
    _step = stepNum;
    _renderStep();
  };

  window.toggleOnboardingCuisine = function(btn, cuisine) {
    btn.classList.toggle('selected');
    if (_answers.cuisines.includes(cuisine)) {
      _answers.cuisines = _answers.cuisines.filter(c => c !== cuisine);
    } else {
      _answers.cuisines.push(cuisine);
    }
  };

  window.toggleOnboardingDietary = function(btn, item) {
    btn.classList.toggle('selected');
    if (_answers.dietary.includes(item)) {
      _answers.dietary = _answers.dietary.filter(d => d !== item);
    } else {
      _answers.dietary.push(item);
    }
  };

  window.selectOnboardingBudget = function(val, level) {
    _answers.budget = val;
    _answers.priceLevel = level;
    _renderStep();
  };

  window.selectOnboardingOccasion = function(btn, occ) {
    _answers.occasion = occ;
    _renderStep();
  };

  window.toggleOnboardingAmbience = function(btn, amb) {
    btn.classList.toggle('selected');
    if (_answers.ambience.includes(amb)) {
      _answers.ambience = _answers.ambience.filter(a => a !== amb);
    } else {
      if (_answers.ambience.length < 3) _answers.ambience.push(amb);
      else {
        btn.classList.remove('selected');
        Components.toast('Limit reached', 'You can select up to 3 ambiences.', 'info');
      }
    }
  };

  window.selectOnboardingNoise = function(btn, noise) {
    _answers.noiseLevel = noise;
    _renderStep();
  };

  return { render };

})();
