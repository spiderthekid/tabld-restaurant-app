// ============================================================
// TABLD — Hybrid Recommendation Engine
// Takes User Taste Profile + History + Context -> Scores & Ranks DB Restaurants
// ============================================================

window.Recommendations = (function () {

  // ─── Weather Context Helper (Chennai Real-Time + Coastal Dynamics) ───
  let _cachedLiveWeather = null;

  async function _fetchLiveChennaiWeather() {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&current_weather=true');
      if (res.ok) {
        const data = await res.json();
        const cw = data.current_weather;
        if (cw && typeof cw.temperature === 'number') {
          const temp = Math.round(cw.temperature) + '°C';
          const code = cw.weathercode;
          let cond = 'Sunny Coastal';
          let icon = '☀️';
          let vibe = 'Chennai Sunshine';

          if (code === 0) { cond = 'Clear Coastal Sky'; icon = '☀️'; vibe = 'Sunny Chennai Vibe'; }
          else if ([1, 2, 3].includes(code)) { cond = 'Breezy & Partially Cloudy'; icon = '🌤️'; vibe = 'Pleasant Bay Breeze'; }
          else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) { cond = 'Chennai Rain Showers'; icon = '🌧️'; vibe = 'Cozy Rain Dining'; }
          else if ([95, 96, 99].includes(code)) { cond = 'Monsoon Thunderstorm'; icon = '🌩️'; vibe = 'Indoor Comfort'; }

          const hour = new Date().getHours();
          let timeOfDay = 'Evening';
          let tag = 'Evening Table';
          if (hour >= 6 && hour < 12) { timeOfDay = 'Morning'; tag = 'Morning Perk'; }
          else if (hour >= 12 && hour < 17) { timeOfDay = 'Afternoon'; tag = 'Cool Afternoon Lunch'; }
          else if (hour >= 17 && hour < 21) { timeOfDay = 'Evening'; tag = 'Coastal Evening Table'; }
          else { timeOfDay = 'Night'; tag = 'Late Night Atmosphere'; }

          _cachedLiveWeather = {
            condition: `${cond} (${timeOfDay})`,
            temp,
            vibe,
            icon,
            tag,
            city: 'Chennai'
          };
        }
      }
    } catch(e) {}
  }

  if (typeof window !== 'undefined') {
    setTimeout(_fetchLiveChennaiWeather, 100);
  }

  function getWeatherContext() {
    if (_cachedLiveWeather) return _cachedLiveWeather;

    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return { condition: 'Sunny Coastal Morning', temp: '30°C', vibe: 'Fresh Coastal Morning', icon: '☀️', tag: 'Morning Perk', city: 'Chennai' };
    } else if (hour >= 12 && hour < 17) {
      return { condition: 'Tropical Afternoon', temp: '35°C', vibe: 'Cool AC Lunch Spot', icon: '🌤️', tag: 'Afternoon Pick', city: 'Chennai' };
    } else if (hour >= 17 && hour < 21) {
      return { condition: 'Marina Sea Breeze Evening', temp: '29°C', vibe: 'Coastal Breeze Dining', icon: '🌊', tag: 'Evening Table', city: 'Chennai' };
    } else {
      return { condition: 'Balmy Chennai Night', temp: '27°C', vibe: 'Late Night Speakeasy', icon: '🌙', tag: 'Nightcap', city: 'Chennai' };
    }
  }

  function _getApprovedList(customList) {
    if (Array.isArray(customList)) return customList;
    if (window.DB && typeof DB.getAllApprovedSync === 'function') {
      return DB.getAllApprovedSync();
    }
    return [];
  }

  // ─── Main Hybrid Recommendation Function ─────────────────────
  function getPersonalizedRecommendations(user, limit = 6, customList = null) {
    const allRestaurants = _getApprovedList(customList);
    if (!allRestaurants.length) return [];

    if (!user || !user.tasteProfile) {
      return allRestaurants.slice().sort((a,b) => b.rating - a.rating).slice(0, limit).map(r => ({
        ...r,
        matchScore: 90,
        explanationTag: 'Curated Hidden Gem',
        recommendationReason: 'Top-rated dining experience on Tabld.'
      }));
    }

    const profile = user.tasteProfile;
    const saved = user.savedRestaurants || [];
    const viewed = user.viewedRestaurants || [];

    const scored = allRestaurants.map(r => {
      let score = 0;
      let maxScore = 100;
      const reasons = [];

      // 1. Cuisine Match (Weight: 35 points)
      const userCuisines = (profile.cuisines || []).map(c => c.toLowerCase());
      const rCuisineCat  = (r.cuisineCategory || '').toLowerCase();
      const rCuisine     = (r.cuisine || '').toLowerCase();
      const rFilters     = (r.cuisineFilters || []).map(c => c.toLowerCase());

      const cuisineMatch = userCuisines.some(uc =>
        rCuisineCat.includes(uc) || rCuisine.includes(uc) || rFilters.includes(uc)
      );

      if (cuisineMatch) {
        score += 35;
        reasons.push(`Matches your love for ${r.cuisineCategory || r.cuisine}`);
      } else {
        score += 10;
      }

      // 2. Budget / Price Range Match (Weight: 25 points)
      const userBudget = profile.budget || '₹₹';
      if (r.priceRange === userBudget) {
        score += 25;
        reasons.push(`Fits your preferred ${r.priceRange} budget`);
      } else {
        const diff = Math.abs((r.priceLevel || 2) - (profile.priceLevel || 2));
        if (diff === 1) score += 15;
        else score += 5;
      }

      // 3. Ambience & Vibe Match (Weight: 20 points)
      const userAmbience = (profile.ambience || []).map(a => a.toLowerCase());
      if (userAmbience.includes((r.ambience || '').toLowerCase())) {
        score += 20;
        reasons.push(`Has a ${r.ambience.toLowerCase()} ambience`);
      } else if (r.vibeTags && r.vibeTags.some(v => userAmbience.includes(v.toLowerCase()))) {
        score += 15;
      } else {
        score += 8;
      }

      // 4. Noise Level Match (Weight: 10 points)
      if (profile.noiseLevel && profile.noiseLevel.toLowerCase() === (r.noiseLevel || '').toLowerCase()) {
        score += 10;
        reasons.push(`${r.noiseLevel} noise level`);
      } else {
        score += 5;
      }

      // 5. Behavioral History Boost (Weight: 10 points)
      if (saved.includes(r.id)) {
        score += 10;
        reasons.unshift('From your Saved List');
      } else if (viewed.includes(r.id)) {
        score += 5;
      }

      const matchScore = Math.min(99, Math.max(78, Math.round((score / maxScore) * 100)));
      let explanationTag = reasons[0] || `Recommended for you`;

      return {
        ...r,
        matchScore,
        explanationTag,
        recommendationReason: `Recommended because it ${reasons.join(', ')}.`
      };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, limit);
  }

  // ─── Weather-Aware Recommendations ───────────────────────────
  function getWeatherAwareRecommendations(user, limit = 3, customList = null) {
    const weather = getWeatherContext();
    const all = _getApprovedList(customList);
    if (!all.length) return { weather, items: [] };

    const scored = all.map(r => {
      let score = (r.rating || 4.5) * 10;
      let tag = weather.tag;

      if (weather.condition.includes('Morning') && ((r.vibeTags || []).includes('Breakfast') || (r.cuisine || '').includes('Café') || r.ambience === 'Casual')) {
        score += 25;
        tag = 'Great Coastal Morning';
      } else if (weather.condition.includes('Afternoon') && (r.priceRange === '₹₹' || r.ambience === 'Serene' || r.ambience === 'Casual')) {
        score += 25;
        tag = 'Cool AC Lunch Spot';
      } else if ((weather.condition.includes('Evening') || weather.condition.includes('Breeze')) && (r.ambience === 'Romantic' || r.ambience === 'Vibrant' || (r.vibeTags || []).includes('Rooftop') || (r.vibeTags || []).includes('Al Fresco'))) {
        score += 25;
        tag = 'Sea Breeze Dining';
      } else if (weather.condition.includes('Rain') && (r.ambience === 'Intimate' || r.ambience === 'Moody' || r.ambience === 'Serene')) {
        score += 25;
        tag = 'Cozy Rain Retreat';
      } else if (weather.condition.includes('Night') && ((r.vibeTags || []).includes('Speakeasy') || (r.vibeTags || []).includes('Exclusive') || r.noiseLevel === 'Quiet')) {
        score += 25;
        tag = 'Late Night Atmosphere';
      }

      return {
        ...r,
        weatherTag: tag,
        explanationTag: `${weather.icon} ${tag} (${weather.condition})`,
        matchScore: Math.min(98, Math.round(score + 40))
      };
    });

    scored.sort((a,b) => b.matchScore - a.matchScore);
    return { weather, items: scored.slice(0, limit) };
  }

  // ─── Search Query Filter (Strict Matching + Natural Language Scoring) ──
  function searchWithAiIntent(intent, user, customList = null) {
    let all = _getApprovedList(customList);
    if (!all.length) return [];

    // Strict cuisine filter if specified in intent or UI
    if (intent.cuisines && intent.cuisines.length > 0) {
      const cTargets = intent.cuisines.map(c => c.toLowerCase());
      all = all.filter(r => {
        return cTargets.some(ct =>
          (r.cuisineCategory && r.cuisineCategory.toLowerCase().includes(ct)) ||
          (r.cuisine && r.cuisine.toLowerCase().includes(ct)) ||
          (r.cuisineFilters && r.cuisineFilters.some(cf => cf.toLowerCase().includes(ct)))
        );
      });
    }

    // Strict budget filter if specified
    if (intent.budget && intent.budget !== 'all') {
      all = all.filter(r => r.priceRange === intent.budget || r.budgetFilter === intent.budget);
    }

    // Strict ambience filter if specified
    if (intent.ambience && intent.ambience !== 'all') {
      const ambTarget = intent.ambience.toLowerCase();
      all = all.filter(r => (r.ambience || '').toLowerCase() === ambTarget);
    }

    // Strict noise level filter if specified
    if (intent.noiseLevel && intent.noiseLevel !== 'all') {
      const noiseTarget = intent.noiseLevel.toLowerCase();
      all = all.filter(r => (r.noiseLevel || '').toLowerCase() === noiseTarget);
    }

    // Strict accessibility filter if specified
    if (intent.accessibility) {
      all = all.filter(r => r.accessibility && r.accessibility.wheelchairAccess);
    }

    // If query keywords exist, filter or boost by text match
    if (intent.queryKeywords && intent.queryKeywords.length > 0) {
      const kws = intent.queryKeywords.map(k => k.toLowerCase());
      const kwMatches = all.filter(r => {
        const text = `${r.name} ${r.cuisine} ${r.shortDescription} ${r.editorialDescription} ${r.ambience} ${r.noiseLevel} ${(r.vibeTags||[]).join(' ')}`.toLowerCase();
        return kws.some(kw => text.includes(kw));
      });
      if (kwMatches.length > 0) {
        all = kwMatches;
      }
    }

    const scored = all.map(r => {
      let matchCount = 50;
      let reasons = [];

      if (intent.cuisines && intent.cuisines.length > 0) {
        reasons.push(`Specializes in ${r.cuisine}`);
        matchCount += 20;
      }
      if (intent.maxPriceLevel && (r.priceLevel || 2) <= intent.maxPriceLevel) {
        matchCount += 15;
        reasons.push(`Within ${r.priceRange} budget`);
      }
      if (intent.noiseLevel && intent.noiseLevel !== 'all' && (r.noiseLevel || '').toLowerCase() === intent.noiseLevel.toLowerCase()) {
        matchCount += 15;
        reasons.push(`${r.noiseLevel} atmosphere`);
      }
      if (intent.ambience && intent.ambience !== 'all' && (r.ambience || '').toLowerCase() === intent.ambience.toLowerCase()) {
        matchCount += 10;
        reasons.push(`${r.ambience} vibe`);
      }
      if (intent.vibeTags && intent.vibeTags.length > 0) {
        const tagMatch = (r.vibeTags || []).some(vt => intent.vibeTags.some(it => vt.toLowerCase().includes(it.toLowerCase())));
        if (tagMatch) {
          matchCount += 15;
          reasons.push(`Ideal for ${intent.vibeTags.slice(0, 2).join(' & ')}`);
        }
      }

      const matchScore = Math.min(99, Math.max(75, matchCount));
      return {
        ...r,
        matchScore,
        explanationTag: reasons[0] || `Matches your search query`,
        recommendationReason: `Matches criteria: ${reasons.join(', ')}.`
      };
    });

    scored.sort((a,b) => b.matchScore - a.matchScore);
    return scored;
  }

  // ─── Adaptive Taste Profile Updater ───────────────────────────
  function updateTasteProfile(userId, actionType, payload) {
    if (!window.Auth) return;
    const user = Auth.getCurrentUser();
    if (!user || user.id !== userId) return;

    if (!user.tasteProfile) {
      user.tasteProfile = { cuisines: [], budget: '₹₹', priceLevel: 2, ambience: [], noiseLevel: 'Moderate', dietary: [] };
    }

    if (actionType === 'SAVE_RESTAURANT') {
      user.savedRestaurants = user.savedRestaurants || [];
      if (!user.savedRestaurants.includes(payload.restaurantId)) {
        user.savedRestaurants.push(payload.restaurantId);
      }
    } else if (actionType === 'UNSAVE_RESTAURANT') {
      user.savedRestaurants = (user.savedRestaurants || []).filter(id => id !== payload.restaurantId);
    }

    Auth.updateCurrentUser({ tasteProfile: user.tasteProfile, savedRestaurants: user.savedRestaurants });
  }

  return {
    getWeatherContext,
    getPersonalizedRecommendations,
    getWeatherAwareRecommendations,
    searchWithAiIntent,
    updateTasteProfile
  };

})();
