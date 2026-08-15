// ============================================================
// TABLD — AI Service (Google Gemini Integration)
// ============================================================

window.AI = (function () {

  // Load AI configuration from localStorage or defaults
  function getConfig() {
    try {
      const saved = localStorage.getItem('tabld_ai_config');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return {
      apiKey: '',
      model: 'gemini-3.5-flash',
      enabled: false
    };
  }

  function saveConfig(cfg) {
    try {
      localStorage.setItem('tabld_ai_config', JSON.stringify(cfg));
    } catch(e) {}
  }

  function isEnabled() {
    const cfg = getConfig();
    return !!(cfg.enabled && cfg.apiKey && cfg.apiKey.trim().length > 10);
  }

  // ─── Direct Call to Gemini REST API ───────────────────────────
  async function callGemini(promptText, systemInstruction = '') {
    const cfg = getConfig();
    if (!cfg.apiKey) throw new Error('Gemini API key is not configured.');

    const modelName = cfg.model || 'gemini-3.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cfg.apiKey}`;

    const bodyPayload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ]
    };

    if (systemInstruction) {
      bodyPayload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error ? errData.error.message : response.statusText;
      throw new Error(`Gemini API Error (${response.status}): ${errMsg}`);
    }

    const data = await response.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return textResult;
  }

  // ─── Test API Connection ──────────────────────────────────────
  async function testConnection(apiKey, model = 'gemini-2.0-flash') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with JSON: {"status":"ok","message":"Connected to Gemini"}' }] }]
      })
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error ? errData.error.message : `HTTP ${response.status}`);
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text;
  }

  // ─── Natural Language Intent Interpreter ──────────────────────
  // Converts user search prompts into structured JSON filters
  async function parseNaturalLanguageIntent(userPrompt) {
    if (!isEnabled()) {
      return _fallbackIntentParser(userPrompt);
    }

    const systemInstruction = `You are the intent interpreter for Tabld, a restaurant discovery platform.
Your job is to convert natural language dining requests into a strict JSON filter object.
Do NOT invent restaurants. Return ONLY valid JSON with no markdown formatting.

JSON Schema:
{
  "cuisines": ["string"],          // e.g. ["Japanese", "Italian", "Indian", "Korean", "Continental", "Seafood"]
  "budget": "string",              // "₹", "₹₹", "₹₹₹", "₹₹₹₹", or "all"
  "maxPriceLevel": 4,              // 1 (₹), 2 (₹₹), 3 (₹₹₹), 4 (₹₹₹₹)
  "noiseLevel": "string",          // "Quiet", "Moderate", "Lively", "Loud", or "all"
  "ambience": "string",            // "Intimate", "Casual", "Vibrant", "Trendy", "Romantic", "Serene", "Lively", "Moody", or "all"
  "vibeTags": ["string"],          // e.g. ["Study", "Coffee", "Speakeasy", "Omakase", "Date Night", "Rooftop"]
  "occasion": "string",            // "Study", "Date", "Birthday", "Casual", "Business", "Celebration"
  "accessibility": false,         // boolean
  "queryKeywords": ["string"],     // key search terms
  "userIntentSummary": "string"   // Brief 1-sentence summary of what the user wants
}`;

    const prompt = `Parse this dining request: "${userPrompt}"`;

    try {
      const rawText = await callGemini(prompt, systemInstruction);
      const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);
      return parsed;
    } catch(err) {
      console.warn('Gemini intent parse failed, using fallback rule engine:', err);
      return _fallbackIntentParser(userPrompt);
    }
  }

  // Fallback rule engine when AI is disabled or offline
  function _fallbackIntentParser(userPrompt) {
    const p = userPrompt.toLowerCase();
    const res = {
      cuisines: [],
      budget: 'all',
      maxPriceLevel: 4,
      noiseLevel: 'all',
      ambience: 'all',
      vibeTags: [],
      occasion: 'Casual',
      accessibility: false,
      queryKeywords: p.split(/\s+/).filter(w => w.length > 2),
      userIntentSummary: `Results for "${userPrompt}"`
    };

    // ─── Cuisines ──────────────────────────────────────────────
    if (p.match(/\b(japanese|sushi|sashimi|omakase|ramen|yakitori|wagyu|nigiri|miso)\b/)) { res.cuisines.push('Japanese'); res.vibeTags.push('Omakase'); }
    if (p.match(/\b(indian|curry|biryani|tandoori|dal|dosa|masala|chettinad|north indian|south indian)\b/)) res.cuisines.push('Indian');
    if (p.match(/\b(italian|pasta|pizza|risotto|tiramisu|trattoria|carbonara|lasagna|pesto)\b/)) res.cuisines.push('Italian');
    if (p.match(/\b(mediterranean|mezze|hummus|halloumi|falafel|Lebanese|moroccan|greek|shawarma)\b/)) res.cuisines.push('Mediterranean');
    if (p.match(/\b(french|bistro|beurre blanc|foie gras|croissant|crepe|baguette|lyon)\b/)) res.cuisines.push('French');
    if (p.match(/\b(seafood|fish|prawn|lobster|crab|oyster|shrimp|clam|squid)\b/)) res.cuisines.push('Seafood');
    if (p.match(/\b(korean|bibimbap|kimchi|bbq|kbbq|bulgogi|tteokbokki)\b/)) res.cuisines.push('Korean');
    if (p.match(/\b(spanish|tapas|paella|churros|sangria|gazpacho)\b/)) res.cuisines.push('Spanish');
    if (p.match(/\b(american|burger|steak|bbq|wings|hot dog|fried chicken)\b/)) res.cuisines.push('American');
    if (p.match(/\b(continental|european|international|fusion)\b/)) res.cuisines.push('Continental');

    // ─── Ambience & Vibe ──────────────────────────────────────
    if (p.match(/\b(quiet|calm|peaceful|study|work|laptop|focus|silent|tranquil)\b/)) {
      res.noiseLevel = 'Quiet'; res.vibeTags.push('Study', 'Quiet'); res.occasion = 'Study';
      res.userIntentSummary = 'Quiet spots to study or work in peace';
    }
    if (p.match(/\b(romantic|date|intimate|cosy|cozy|couple|anniversary|love|candlelit|candle)\b/)) {
      res.ambience = 'Intimate'; res.vibeTags.push('Date Night', 'Romantic'); res.occasion = 'Date';
      res.userIntentSummary = 'Romantic restaurants perfect for a date';
    }
    if (p.match(/\b(rooftop|terrace|outdoor|al fresco|open air|skyline|view)\b/)) {
      res.vibeTags.push('Rooftop', 'Al Fresco');
      res.userIntentSummary = 'Rooftop & outdoor dining with great views';
    }
    if (p.match(/\b(lively|vibrant|party|fun|energy|buzzing|happening)\b/)) {
      res.ambience = 'Vibrant'; res.noiseLevel = 'Lively';
    }
    if (p.match(/\b(birthday|celebrate|celebration|special occasion|milestone|anniversary)\b/)) {
      res.occasion = 'Celebration'; res.vibeTags.push('Special Occasion');
      res.userIntentSummary = 'Great places to celebrate a special occasion';
    }
    if (p.match(/\b(fine dining|upscale|premium|luxury|tasting menu|chef.?s table|michelin|exclusive)\b/)) {
      res.ambience = 'Intimate'; res.vibeTags.push('Tasting Menu', 'Exclusive', 'Fine Dining'); res.budget = '₹₹₹₹'; res.maxPriceLevel = 4;
      res.userIntentSummary = 'Fine dining & upscale restaurant experiences';
    }
    if (p.match(/\b(casual|relaxed|chill|laid.?back|no.?fuss|easy going)\b/)) {
      res.ambience = 'Casual';
    }
    if (p.match(/\b(family|kids|children|child.?friendly|group|large group)\b/)) {
      res.vibeTags.push('Group Friendly', 'Family');
      res.userIntentSummary = 'Family-friendly restaurants for groups';
    }
    if (p.match(/\b(brunch|breakfast|morning|coffee|cafe|café|bakery)\b/)) {
      res.vibeTags.push('Breakfast', 'Coffee', 'Café');
      res.userIntentSummary = 'Best brunch & café spots for the morning';
    }
    if (p.match(/\b(speakeasy|cocktail|bar|drinks|nightlife|late night|craft beer|wine)\b/)) {
      res.vibeTags.push('Speakeasy', 'Cocktails'); res.noiseLevel = 'Lively';
      res.userIntentSummary = 'Cocktail bars and speakeasy-style restaurants';
    }
    if (p.match(/\b(vegetarian|vegan|plant.?based|no meat|veggie)\b/)) {
      res.vibeTags.push('Vegetarian Options');
      res.userIntentSummary = 'Restaurants with great vegetarian & vegan options';
    }
    if (p.match(/\b(wheelchair|accessible|disability|disabled|ramp)\b/)) {
      res.accessibility = true;
    }

    // ─── Budget ───────────────────────────────────────────────
    if (p.match(/\b(cheap|budget|affordable|inexpensive|under 500|pocket.?friendly|wallet)\b/)) {
      res.budget = '₹'; res.maxPriceLevel = 1;
      res.userIntentSummary = 'Affordable restaurants that won\'t break the bank';
    } else if (p.match(/\b(under 1000|under 1500|mid.?range|moderate|medium price)\b/)) {
      res.budget = '₹₹'; res.maxPriceLevel = 2;
    } else if (p.match(/\b(expensive|luxury|fine dining|premium|splurge|treat)\b/)) {
      res.budget = '₹₹₹₹'; res.maxPriceLevel = 4;
    }

    return res;
  }

  // ─── Adaptive Follow-Up Question Generator (for Onboarding) ───
  async function generateOnboardingFollowUp(answersSoFar) {
    if (!isEnabled()) {
      return _fallbackFollowUp(answersSoFar);
    }

    const systemInstruction = `You are Tabld's AI Dining Assistant during onboarding.
Given the user's initial choices so far, generate a friendly follow-up question to deepen their taste profile.
Return strictly valid JSON:
{
  "question": "string",
  "options": ["string", "string", "string", "string"]
}`;

    const prompt = `User choices so far: ${JSON.stringify(answersSoFar)}`;

    try {
      const raw = await callGemini(prompt, systemInstruction);
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch(e) {
      return _fallbackFollowUp(answersSoFar);
    }
  }

  function _fallbackFollowUp(answers) {
    const cuisines = answers.cuisines || [];
    if (cuisines.includes('Japanese') || cuisines.includes('Asian')) {
      return {
        question: "What's your ideal Japanese dining atmosphere?",
        options: ["Authentic 8-seat Omakase counter", "Lively Izakaya & sake bar", "Minimalist & quiet tea lounge", "Modern fusion bistro"]
      };
    }
    return {
      question: "What matters most to you when picking a new table?",
      options: ["Exceptional signature dish", "Cozy & intimate noise level", "Great cocktail & wine selection", "Unique aesthetic & ambience"]
    };
  }

  // ─── AI Recommendation Explanation Generator ─────────────────
  async function generateExplanation(restaurant, userProfile) {
    if (!isEnabled()) {
      return _fallbackExplanation(restaurant, userProfile);
    }

    const systemInstruction = `Generate a single short sentence explaining why this restaurant was recommended for this user profile.
Rules:
- 1 sentence max (under 12 words).
- Direct & warm tone.
- Reference their taste preference (e.g. cuisine, budget, ambience).
- Return ONLY the plain text sentence. No quotes, no markdown.`;

    const prompt = `Restaurant: ${restaurant.name} (${restaurant.cuisine}, ${restaurant.priceRange}, Ambience: ${restaurant.ambience}, Noise: ${restaurant.noiseLevel})
User Taste: Favorite Cuisines: ${(userProfile?.cuisines || []).join(', ')}, Budget: ${userProfile?.budget || '₹₹'}, Ambience: ${(userProfile?.ambience || []).join(', ')}`;

    try {
      const text = await callGemini(prompt, systemInstruction);
      return text.trim().replace(/^["']|["']$/g, '');
    } catch(e) {
      return _fallbackExplanation(restaurant, userProfile);
    }
  }

  function _fallbackExplanation(restaurant, userProfile) {
    const userCuisines = (userProfile?.cuisines || []).map(c => c.toLowerCase());
    if (userCuisines.includes(restaurant.cuisineCategory?.toLowerCase()) || userCuisines.includes(restaurant.cuisine?.toLowerCase())) {
      return `Matches your preference for ${restaurant.cuisine} cuisine.`;
    }
    if (userProfile?.budget && userProfile.budget === restaurant.priceRange) {
      return `Fits perfectly within your preferred ${restaurant.priceRange} budget.`;
    }
    if (userProfile?.noiseLevel && userProfile.noiseLevel === restaurant.noiseLevel) {
      return `Features a ${restaurant.noiseLevel.toLowerCase()} atmosphere as you prefer.`;
    }
    return `Highly rated curated gem in ${restaurant.city}.`;
  }

  return {
    getConfig,
    saveConfig,
    getApiKey: () => getConfig().apiKey || '',
    setApiKey: (key) => {
      const cfg = getConfig();
      cfg.apiKey = (key || '').trim();
      if (cfg.apiKey.length > 10) cfg.enabled = true;
      saveConfig(cfg);
      return cfg;
    },
    getModel: () => getConfig().model || 'gemini-2.5-flash',
    setModel: (model) => {
      const cfg = getConfig();
      cfg.model = model;
      saveConfig(cfg);
      return cfg;
    },
    setEnabled: (val) => {
      const cfg = getConfig();
      cfg.enabled = Boolean(val);
      saveConfig(cfg);
      return cfg;
    },
    isEnabled,
    testConnection,
    parseNaturalLanguageIntent,
    generateOnboardingFollowUp,
    generateExplanation
  };

})();
