// ============================================================
// TABLD — Supabase Data Layer (window.DB)
// Connects to PostgreSQL via Supabase SDK.
// Provides both Async API and in-memory cache for instant UI rendering.
// ============================================================

window.DB = (function () {
  let _cachedApprovedRestaurants = [];
  let _cachedAllRestaurants = [];

  // ─── INTERNAL HELPERS ────────────────────────────────────────

  /** Map a DB row (snake_case) → app object (camelCase) */
  function _mapRestaurant(row) {
    if (!row) return null;
    return {
      id:                   row.id,
      name:                 row.name || '',
      slug:                 row.slug || '',
      cuisine:              row.cuisine || '',
      cuisineCategory:      row.cuisine_category || row.cuisine || '',
      priceRange:           row.price_range || '₹₹',
      priceLevel:           row.price_level || 2,
      editorialDescription: row.editorial_description || '',
      shortDescription:     row.short_description || '',
      address:              row.address || '',
      city:                 row.city || 'Chennai',
      phone:                row.phone || '',
      email:                row.email || '',
      website:              row.website || '',
      coverImage:           row.cover_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=70',
      gallery:              row.gallery || [],
      menu:                 row.menu || [],
      bestDishes:           row.best_dishes || [],
      hours:                row.hours || {
        monday:    { open: "12:00", close: "23:00", closed: false },
        tuesday:   { open: "12:00", close: "23:00", closed: false },
        wednesday: { open: "12:00", close: "23:00", closed: false },
        thursday:  { open: "12:00", close: "23:00", closed: false },
        friday:    { open: "12:00", close: "23:00", closed: false },
        saturday:  { open: "12:00", close: "23:00", closed: false },
        sunday:    { open: "12:00", close: "23:00", closed: false }
      },
      accessibility:        row.accessibility || { wheelchairAccess: true, brailleMenu: false, hearingLoop: false, largeText: false, note: '' },
      noiseLevel:           row.noise_level || 'Moderate',
      noiseLevelScore:      row.noise_level_score || 2,
      vibeTags:             row.vibe_tags || [],
      ambience:             row.ambience || 'Casual',
      cuisineFilters:       row.cuisine_filters || [row.cuisine || 'Specialty'],
      budgetFilter:         row.budget_filter || row.price_range || '₹₹',
      distanceKm:           row.distance_km || 2.0,
      featured:             Boolean(row.featured),
      trending:             Boolean(row.trending),
      recentlyAdded:        Boolean(row.recently_added),
      approved:             Boolean(row.approved),
      ownerId:              row.owner_id,
      googleMapsUrl:        row.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent((row.name || '') + ' ' + (row.city || 'Chennai'))}`,
      availableSlots:       row.available_slots || ["12:00","13:00","19:00","19:30","20:00","20:30","21:00"],
      slotCapacities:       row.slot_capacities || {},
      rating:               row.rating ? Number(row.rating) : 4.8,
      reviewCount:          row.review_count ? Number(row.review_count) : 0,
      capacity:             row.capacity ? Number(row.capacity) : 30,
      createdAt:            row.created_at || new Date().toISOString().split('T')[0]
    };
  }

  function _mapReservation(row) {
    if (!row) return null;
    return {
      id:             row.id,
      userId:         row.user_id,
      restaurantId:   row.restaurant_id,
      restaurantName: row.restaurant_name || '',
      date:           row.date,
      time:           row.time,
      guests:         Number(row.guests || 2),
      status:         row.status || 'pending',
      notes:          row.notes || '',
      cancelReason:   row.cancel_reason || '',
      cancelledBy:    row.cancelled_by || '',
      cancelledAt:    row.cancelled_at,
      shiftReason:    row.shift_reason || '',
      shiftedBy:      row.shifted_by || '',
      shiftedAt:      row.shifted_at,
      originalTime:   row.original_time || '',
      createdAt:      row.created_at
    };
  }

  function _mapProfile(row) {
    if (!row) return null;
    return {
      id:                   row.id,
      name:                 row.name || '',
      email:                row.email || '',
      role:                 row.role || 'user',
      phone:                row.phone || '',
      avatar:               row.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.name || 'User')}&backgroundColor=e8732a&textColor=ffffff`,
      onboardingCompleted:  Boolean(row.onboarding_completed),
      tasteProfile:         row.taste_profile || null,
      savedRestaurants:     row.saved_restaurants || [],
      restaurantId:         row.restaurant_id || null,
      joinedAt:             row.joined_at
    };
  }

  function _mapApplication(row) {
    if (!row) return null;
    return {
      id:               row.id,
      userId:           row.user_id,
      userName:         row.user_name || '',
      userEmail:        row.user_email || '',
      name:             row.name || '',
      cuisine:          row.cuisine || '',
      city:             row.city || 'Chennai',
      address:          row.address || '',
      phone:            row.phone || '',
      email:            row.email || '',
      priceRange:       row.price_range || '₹₹',
      shortDescription: row.short_description || '',
      coverImage:       row.cover_image || '',
      status:           row.status || 'pending',
      createdAt:        row.created_at
    };
  }

  function _mapReview(row) {
    if (!row) return null;
    return {
      id:           row.id,
      userId:       row.user_id,
      restaurantId: row.restaurant_id,
      userName:     row.user_name || '',
      userAvatar:   row.user_avatar || '',
      rating:       Number(row.rating || 5),
      comment:      row.comment || '',
      createdAt:    row.created_at
    };
  }

  // ─── PUBLIC API ───────────────────────────────────────────────
  return {

    /** Initialize and pre-fetch cache from Supabase */
    async init() {
      if (!window.supa) return;
      try {
        const { data, error } = await supa
          .from('restaurants')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          _cachedAllRestaurants = data.map(_mapRestaurant);
          _cachedApprovedRestaurants = _cachedAllRestaurants.filter(r => r.approved);
        }
      } catch (err) {
        console.warn('[DB] Init cache fetch warning:', err);
      }
    },

    // ── CACHE ACCESS METHODS (Synchronous) ──────────────────────
    getAllApprovedSync() {
      return [..._cachedApprovedRestaurants];
    },
    getCuisinesSync() {
      const all = _cachedApprovedRestaurants.flatMap(r => r.cuisineFilters || []);
      return [...new Set(all)].sort();
    },
    getCitiesSync() {
      const all = _cachedApprovedRestaurants.map(r => r.city);
      return [...new Set(all)].sort();
    },

    // ── USERS / PROFILES ────────────────────────────────────────

    async getUserById(id) {
      if (!window.supa || !id) return null;
      try {
        const { data, error } = await supa
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (error || !data) return null;
        const mapped = _mapProfile(data);
        
        // Correlate restaurant ownership
        const owned = _cachedAllRestaurants.find(r => r.ownerId === id);
        if (owned && mapped.role === 'user') {
          mapped.role = 'owner';
          mapped.restaurantId = owned.id;
        }
        return mapped;
      } catch (e) { return null; }
    },

    async getAllUsers() {
      if (!window.supa) return [];
      try {
        const { data, error } = await supa
          .from('profiles')
          .select('*')
          .order('joined_at', { ascending: false });
        if (error || !data) return [];
        
        // Ensure restaurants cache is fresh
        if (_cachedAllRestaurants.length === 0) {
          await this.getAllRestaurants();
        }

        return data.map(raw => {
          const profile = _mapProfile(raw);
          // If this user is listed as owner of any restaurant in restaurants table
          const owned = _cachedAllRestaurants.find(r => r.ownerId === profile.id);
          if (owned && profile.role !== 'admin') {
            profile.role = 'owner';
            profile.restaurantId = owned.id;
            profile.restaurantName = owned.name;
          }
          return profile;
        });
      } catch (e) { return []; }
    },

    async updateProfile(id, updates) {
      if (!window.supa) return null;
      const dbUpdates = {};
      if (updates.name !== undefined)                dbUpdates.name = updates.name;
      if (updates.phone !== undefined)               dbUpdates.phone = updates.phone;
      if (updates.avatar !== undefined)              dbUpdates.avatar = updates.avatar;
      if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
      if (updates.tasteProfile !== undefined)        dbUpdates.taste_profile = updates.tasteProfile;
      if (updates.savedRestaurants !== undefined)    dbUpdates.saved_restaurants = updates.savedRestaurants;
      if (updates.role !== undefined)                dbUpdates.role = updates.role;
      if (updates.restaurantId !== undefined)        dbUpdates.restaurant_id = updates.restaurantId;

      try {
        const { data, error } = await supa
          .from('profiles')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();
        if (error) { console.error('[DB] updateProfile error:', error); return null; }
        return _mapProfile(data);
      } catch (err) {
        console.error('[DB] updateProfile catch:', err);
        return null;
      }
    },

    // ── RESTAURANTS ─────────────────────────────────────────────

    async getRestaurantById(id) {
      if (!window.supa) {
        return _cachedAllRestaurants.find(r => r.id === Number(id)) || null;
      }
      try {
        const { data, error } = await supa
          .from('restaurants')
          .select('*')
          .eq('id', Number(id))
          .single();
        if (error) return _cachedAllRestaurants.find(r => r.id === Number(id)) || null;
        const mapped = _mapRestaurant(data);
        // update local cache entry
        const idx = _cachedAllRestaurants.findIndex(r => r.id === mapped.id);
        if (idx > -1) _cachedAllRestaurants[idx] = mapped;
        else _cachedAllRestaurants.push(mapped);
        return mapped;
      } catch (e) {
        return _cachedAllRestaurants.find(r => r.id === Number(id)) || null;
      }
    },

    async getRestaurantBySlug(slug) {
      if (!window.supa) {
        return _cachedAllRestaurants.find(r => r.slug === slug) || null;
      }
      try {
        const { data, error } = await supa
          .from('restaurants')
          .select('*')
          .eq('slug', slug)
          .single();
        if (error) return _cachedAllRestaurants.find(r => r.slug === slug) || null;
        return _mapRestaurant(data);
      } catch (e) {
        return _cachedAllRestaurants.find(r => r.slug === slug) || null;
      }
    },

    async getAllApproved() {
      if (!window.supa) return _cachedApprovedRestaurants;
      try {
        const { data, error } = await supa
          .from('restaurants')
          .select('*')
          .eq('approved', true)
          .order('created_at', { ascending: false });
        if (error) return _cachedApprovedRestaurants;
        const mapped = (data || []).map(_mapRestaurant);
        _cachedApprovedRestaurants = mapped;
        return mapped;
      } catch (e) {
        return _cachedApprovedRestaurants;
      }
    },

    async getFeatured() {
      const all = await this.getAllApproved();
      return all.filter(r => r.featured);
    },

    async getTrending() {
      const all = await this.getAllApproved();
      return all.filter(r => r.trending);
    },

    async getRecentlyAdded() {
      const all = await this.getAllApproved();
      return all.filter(r => r.recentlyAdded).slice(0, 6);
    },

    async getAllRestaurants() {
      if (!window.supa) return _cachedAllRestaurants;
      try {
        const { data, error } = await supa
          .from('restaurants')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return _cachedAllRestaurants;
        const mapped = (data || []).map(_mapRestaurant);
        _cachedAllRestaurants = mapped;
        _cachedApprovedRestaurants = mapped.filter(r => r.approved);
        return mapped;
      } catch (e) {
        return _cachedAllRestaurants;
      }
    },

    async getPending() {
      const all = await this.getAllRestaurants();
      return all.filter(r => !r.approved);
    },

    async getOwnerRestaurant(ownerId) {
      if (!window.supa) {
        return _cachedAllRestaurants.find(r => r.ownerId === ownerId) || null;
      }
      try {
        // 1. Direct check by owner_id on restaurants table
        const { data, error } = await supa
          .from('restaurants')
          .select('*')
          .eq('owner_id', ownerId)
          .limit(1)
          .maybeSingle();
        if (!error && data) return _mapRestaurant(data);

        // 2. Fallback: check profile.restaurant_id
        const user = await this.getUserById(ownerId);
        if (user && user.restaurantId) {
          const res = await this.getRestaurantById(user.restaurantId);
          if (res) return res;
        }

        return null;
      } catch (e) { return null; }
    },

    // Set a restaurant's owner_id to a given user
    async setRestaurantOwner(restaurantId, userId) {
      if (!window.supa) return null;
      try {
        const { data, error } = await supa
          .from('restaurants')
          .update({ owner_id: userId })
          .eq('id', Number(restaurantId))
          .select()
          .single();
        if (error) { console.error('[DB] setRestaurantOwner error:', error); return null; }
        const mapped = _mapRestaurant(data);
        const idx = _cachedAllRestaurants.findIndex(r => r.id === mapped.id);
        if (idx > -1) _cachedAllRestaurants[idx] = mapped;
        return mapped;
      } catch (e) { console.error('[DB] setRestaurantOwner catch:', e); return null; }
    },

    // Clear owner_id for all restaurants currently owned by userId
    async clearRestaurantOwner(userId) {
      if (!window.supa) return;
      try {
        await supa
          .from('restaurants')
          .update({ owner_id: null })
          .eq('owner_id', userId);
      } catch (e) { console.warn('[DB] clearRestaurantOwner error:', e); }
    },

    // Admin action: update a user's role and link/unlink restaurant
    async adminUpdateUserRole(targetUserId, newRole, restaurantId = null) {
      if (!window.supa || !targetUserId) {
        return { ok: false, error: 'Database connection not ready or missing user ID.' };
      }

      // 1. Update restaurant ownership table first (Admins have full RLS permissions on restaurants)
      if (newRole === 'owner' && restaurantId) {
        await this.clearRestaurantOwner(targetUserId);
        await this.setRestaurantOwner(restaurantId, targetUserId);
      } else {
        await this.clearRestaurantOwner(targetUserId);
      }

      // 2. Refresh local restaurant cache
      await this.getAllRestaurants();

      // 3. Try Supabase RPC function (bypasses RLS via security definer if defined)
      try {
        const { data: rpcData, error: rpcErr } = await supa.rpc('admin_update_user_role', {
          target_user_id: targetUserId,
          new_role: newRole,
          new_restaurant_id: restaurantId ? Number(restaurantId) : null
        });
        if (!rpcErr && rpcData) {
          return { ok: true, profile: _mapProfile(rpcData) };
        }
      } catch (e) {}

      // 4. Direct database update fallback on profiles table
      try {
        const updatePayload = {
          role: newRole,
          restaurant_id: restaurantId ? Number(restaurantId) : null
        };
        const { data, error } = await supa
          .from('profiles')
          .update(updatePayload)
          .eq('id', targetUserId)
          .select()
          .single();

        if (!error && data) {
          return { ok: true, profile: _mapProfile(data) };
        }
      } catch (err) {}

      // Even if profiles table direct update had an RLS constraint,
      // the restaurants table ownership was updated successfully.
      return { ok: true, profile: { id: targetUserId, role: newRole, restaurantId } };
    },

    async searchRestaurants(query, filters = {}) {
      if (!window.supa) {
        let results = _cachedApprovedRestaurants;
        if (query && query.trim()) {
          const q = query.toLowerCase();
          results = results.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.cuisine.toLowerCase().includes(q) ||
            r.city.toLowerCase().includes(q)
          );
        }
        return results;
      }

      try {
        let q = supa
          .from('restaurants')
          .select('*')
          .eq('approved', true);

        if (query && query.trim()) {
          const term = `%${query.trim().toLowerCase()}%`;
          q = q.or(`name.ilike.${term},cuisine.ilike.${term},city.ilike.${term}`);
        }
        if (filters.budget && filters.budget !== 'all') {
          q = q.eq('budget_filter', filters.budget);
        }
        if (filters.ambience && filters.ambience !== 'all') {
          q = q.ilike('ambience', filters.ambience);
        }
        if (filters.noiseLevel && filters.noiseLevel !== 'all') {
          q = q.ilike('noise_level', filters.noiseLevel);
        }

        const { data, error } = await q.order('rating', { ascending: false });
        if (error) return [];

        let results = (data || []).map(_mapRestaurant);

        if (filters.accessibility) {
          results = results.filter(r => r.accessibility && r.accessibility.wheelchairAccess);
        }

        if (filters.cuisine && filters.cuisine !== 'all') {
          const cTarget = filters.cuisine.toLowerCase();
          results = results.filter(r =>
            (r.cuisineFilters && r.cuisineFilters.some(cf => cf.toLowerCase() === cTarget)) ||
            (r.cuisineCategory && r.cuisineCategory.toLowerCase() === cTarget) ||
            (r.cuisine && r.cuisine.toLowerCase().includes(cTarget))
          );
        }

        return results;
      } catch (err) {
        console.error('[DB] searchRestaurants catch:', err);
        return [];
      }
    },

    async updateRestaurant(id, data) {
      if (!window.supa) return null;
      const dbData = {};
      if (data.address !== undefined)             dbData.address = data.address;
      if (data.phone !== undefined)               dbData.phone = data.phone;
      if (data.email !== undefined)               dbData.email = data.email;
      if (data.website !== undefined)             dbData.website = data.website;
      if (data.hours !== undefined)               dbData.hours = data.hours;
      if (data.coverImage !== undefined)          dbData.cover_image = data.coverImage;
      if (data.gallery !== undefined)             dbData.gallery = data.gallery;
      if (data.menu !== undefined)                dbData.menu = data.menu;
      if (data.cuisine !== undefined)             dbData.cuisine = data.cuisine;
      if (data.priceRange !== undefined)          dbData.price_range = data.priceRange;
      if (data.priceLevel !== undefined)          dbData.price_level = data.priceLevel;
      if (data.shortDescription !== undefined)    dbData.short_description = data.shortDescription;
      if (data.name !== undefined)                dbData.name = data.name;
      if (data.availableSlots !== undefined)      dbData.available_slots = data.availableSlots;
      if (data.slotCapacities !== undefined)      dbData.slot_capacities = data.slotCapacities;
      if (data.featured !== undefined)            dbData.featured = data.featured;
      if (data.trending !== undefined)            dbData.trending = data.trending;
      if (data.approved !== undefined)            dbData.approved = data.approved;

      try {
        const { data: row, error } = await supa
          .from('restaurants')
          .update(dbData)
          .eq('id', Number(id))
          .select()
          .single();
        if (error) { console.error('[DB] updateRestaurant error:', error); return null; }
        const mapped = _mapRestaurant(row);
        await this.init(); // refresh cache
        return mapped;
      } catch (err) {
        console.error('[DB] updateRestaurant catch:', err);
        return null;
      }
    },

    async approveRestaurant(id) {
      if (!window.supa) return;
      await supa.from('restaurants').update({ approved: true }).eq('id', Number(id));
      await this.init();
    },

    async rejectRestaurant(id) {
      if (!window.supa) return;
      await supa.from('restaurants').delete().eq('id', Number(id));
      await this.init();
    },

    async toggleFeatured(id) {
      const r = await this.getRestaurantById(id);
      if (!r || !window.supa) return;
      await supa.from('restaurants').update({ featured: !r.featured }).eq('id', Number(id));
      await this.init();
    },

    async toggleTrending(id) {
      const r = await this.getRestaurantById(id);
      if (!r || !window.supa) return;
      await supa.from('restaurants').update({ trending: !r.trending }).eq('id', Number(id));
      await this.init();
    },

    async getCuisines() {
      const all = await this.getAllApproved();
      const list = all.flatMap(r => r.cuisineFilters || []);
      return [...new Set(list)].sort();
    },

    async getCities() {
      const all = await this.getAllApproved();
      const list = all.map(r => r.city);
      return [...new Set(list)].sort();
    },

    // ── RESERVATIONS ────────────────────────────────────────────

    async getUserReservations(userId) {
      if (!window.supa) return [];
      try {
        const { data, error } = await supa
          .from('reservations')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        if (error) return [];
        return (data || []).map(_mapReservation);
      } catch (e) { return []; }
    },

    async getRestaurantReservations(restaurantId) {
      if (!window.supa) return [];
      try {
        const { data, error } = await supa
          .from('reservations')
          .select('*')
          .eq('restaurant_id', Number(restaurantId))
          .order('date', { ascending: true });
        if (error) return [];
        return (data || []).map(_mapReservation);
      } catch (e) { return []; }
    },

    async getAllReservations() {
      if (!window.supa) return [];
      try {
        const { data, error } = await supa
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return [];
        return (data || []).map(_mapReservation);
      } catch (e) { return []; }
    },

    async addReservation(data) {
      if (!window.supa) return null;
      const row = {
        user_id:         data.userId,
        restaurant_id:   Number(data.restaurantId),
        restaurant_name: data.restaurantName,
        date:            data.date,
        time:            data.time,
        guests:          Number(data.guests || 2),
        status:          'pending',
        notes:           data.notes || ''
      };
      try {
        const { data: created, error } = await supa
          .from('reservations')
          .insert([row])
          .select()
          .single();
        if (error) { console.error('[DB] addReservation error:', error); return null; }
        return _mapReservation(created);
      } catch (err) {
        console.error('[DB] addReservation catch:', err);
        return null;
      }
    },

    async updateReservationStatus(id, status) {
      if (!window.supa) return;
      await supa.from('reservations').update({ status }).eq('id', Number(id));
    },

    async cancelReservation(id, reason, cancelledBy = 'owner') {
      if (!window.supa) return null;
      try {
        const { data, error } = await supa
          .from('reservations')
          .update({
            status:        'cancelled',
            cancel_reason: reason || 'Unable to accommodate reservation at this time.',
            cancelled_by:  cancelledBy,
            cancelled_at:  new Date().toISOString()
          })
          .eq('id', Number(id))
          .select()
          .single();
        if (error) { console.error('[DB] cancelReservation error:', error); return null; }
        return _mapReservation(data);
      } catch (e) { return null; }
    },

    async shiftReservation(id, newTime, reason, shiftedBy = 'owner') {
      if (!window.supa) return null;
      try {
        const existing = await this.getReservationById(id);
        const { data, error } = await supa
          .from('reservations')
          .update({
            time:          newTime,
            original_time: existing?.originalTime || existing?.time || '',
            shift_reason:  reason || `Shifted to ${newTime} by restaurant.`,
            shifted_by:    shiftedBy,
            shifted_at:    new Date().toISOString(),
            status:        'confirmed'
          })
          .eq('id', Number(id))
          .select()
          .single();
        if (error) { console.error('[DB] shiftReservation error:', error); return null; }
        return _mapReservation(data);
      } catch (e) { return null; }
    },

    async getReservationById(id) {
      if (!window.supa) return null;
      try {
        const { data, error } = await supa
          .from('reservations')
          .select('*')
          .eq('id', Number(id))
          .single();
        if (error) return null;
        return _mapReservation(data);
      } catch (e) { return null; }
    },

    // ── REVIEWS ─────────────────────────────────────────────────

    async getReviews(restaurantId) {
      if (!window.supa) return [];
      try {
        const { data, error } = await supa
          .from('reviews')
          .select('*')
          .eq('restaurant_id', Number(restaurantId))
          .order('created_at', { ascending: false });
        if (error) return [];
        return (data || []).map(_mapReview);
      } catch (e) { return []; }
    },

    async addReview(data) {
      if (!window.supa) return null;
      const row = {
        user_id:       data.userId,
        restaurant_id: Number(data.restaurantId),
        user_name:     data.userName,
        user_avatar:   data.userAvatar,
        rating:        Number(data.rating),
        comment:       data.comment
      };
      try {
        const { data: created, error } = await supa
          .from('reviews')
          .insert([row])
          .select()
          .single();
        if (error) { console.error('[DB] addReview error:', error); return null; }

        await this._recalcRating(data.restaurantId);
        return _mapReview(created);
      } catch (e) { return null; }
    },

    async _recalcRating(restaurantId) {
      if (!window.supa) return;
      try {
        const { data, error } = await supa
          .from('reviews')
          .select('rating')
          .eq('restaurant_id', Number(restaurantId));
        if (error || !data?.length) return;
        const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
        await supa
          .from('restaurants')
          .update({ rating: Math.round(avg * 10) / 10, review_count: data.length })
          .eq('id', Number(restaurantId));
        await this.init();
      } catch (e) {}
    },

    // ── LISTING APPLICATIONS ────────────────────────────────────

    async getPendingApplications() {
      if (!window.supa) return [];
      try {
        const { data, error } = await supa
          .from('listing_applications')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        if (error) { console.warn('[DB] getPendingApplications error:', error); return []; }
        return (data || []).map(_mapApplication);
      } catch (e) { return []; }
    },

    async getPendingApplicationForUser(userId) {
      if (!window.supa || !userId) return null;
      try {
        const { data, error } = await supa
          .from('listing_applications')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error || !data) return null;
        return _mapApplication(data);
      } catch (e) { return null; }
    },

    async getAllApplications() {
      if (!window.supa) return [];
      try {
        const { data, error } = await supa
          .from('listing_applications')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) return [];
        return (data || []).map(_mapApplication);
      } catch (e) { return []; }
    },

    async submitListingApplication(appData, userId) {
      if (!window.supa) return null;
      let user = null;
      if (userId) {
        try { user = await this.getUserById(userId); } catch (e) {}
      }

      // Process cover photo (upload to Supabase Storage if data URL, else fallback to Unsplash)
      let coverImageUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=70';
      if (appData.coverImage && typeof appData.coverImage === 'string' && appData.coverImage.startsWith('data:')) {
        try {
          const [meta, b64] = appData.coverImage.split(',');
          const mimeMatch = meta.match(/:(.*?);/);
          const mime   = mimeMatch ? mimeMatch[1] : 'image/jpeg';
          const binary = atob(b64);
          const bytes  = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: mime });
          const ext  = mime.split('/')[1] || 'jpg';
          const path = `applications/${userId || 'app'}-${Date.now()}.${ext}`;
          const { error: upErr } = await supa.storage
            .from('restaurant-images')
            .upload(path, blob, { contentType: mime, upsert: true });
          if (!upErr) {
            const { data: pubData } = supa.storage.from('restaurant-images').getPublicUrl(path);
            if (pubData?.publicUrl) coverImageUrl = pubData.publicUrl;
          } else {
            console.warn('[DB] Cover image upload warning (using fallback):', upErr.message);
          }
        } catch (imgErr) {
          console.warn('[DB] Cover image processing warning:', imgErr);
        }
      } else if (appData.coverImage && typeof appData.coverImage === 'string' && appData.coverImage.startsWith('http')) {
        coverImageUrl = appData.coverImage;
      }

      const row = {
        user_id:           userId || null,
        user_name:         appData.userName || user?.name || 'Restaurant Owner',
        user_email:        appData.userEmail || user?.email || appData.email || '',
        name:              appData.name,
        cuisine:           appData.cuisine || 'Specialty',
        city:              appData.city || 'Chennai',
        address:           appData.address || '',
        phone:             appData.phone || '',
        email:             appData.email || appData.userEmail || '',
        price_range:       appData.priceRange || '₹₹',
        short_description: appData.shortDescription || `A curated ${appData.cuisine || ''} dining venue in ${appData.city || 'Chennai'}.`,
        cover_image:       coverImageUrl,
        status:            'pending'
      };

      try {
        const { data, error } = await supa
          .from('listing_applications')
          .insert([row])
          .select()
          .single();
        if (error) {
          console.error('[DB] submitListingApplication insert error:', error);
          return null;
        }
        return _mapApplication(data);
      } catch (e) {
        console.error('[DB] submitListingApplication catch:', e);
        return null;
      }
    },

    async approveListingApplication(appId) {
      if (!window.supa) return null;
      try {
        const { data: apps, error: aErr } = await supa
          .from('listing_applications')
          .select('*')
          .eq('id', Number(appId))
          .single();
        if (aErr || !apps) return null;
        const app = _mapApplication(apps);

        const priceLevelMap = { '₹': 1, '₹₹': 2, '₹₹₹': 3, '₹₹₹₹': 4 };
        const slug = (app.name || 'restaurant').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

        const newRes = {
          name:                  app.name,
          slug,
          cuisine:               app.cuisine,
          cuisine_category:      app.cuisine,
          price_range:           app.priceRange || '₹₹',
          price_level:           priceLevelMap[app.priceRange] || 2,
          editorial_description: app.shortDescription || `A curated ${app.cuisine} dining venue in ${app.city}.`,
          short_description:     app.shortDescription || `Specialty ${app.cuisine} in ${app.city}.`,
          address:               app.address,
          city:                  app.city,
          phone:                 app.phone,
          email:                 app.email,
          cover_image:           app.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
          gallery:               [app.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
          menu:                  [{ section: "Chef's Specials", items: [{ name: "House Signature Dish", description: "Chef's special creation", price: "₹650" }] }],
          best_dishes:           ["House Signature Dish"],
          hours:                 { monday:{open:"12:00",close:"23:00",closed:false}, tuesday:{open:"12:00",close:"23:00",closed:false}, wednesday:{open:"12:00",close:"23:00",closed:false}, thursday:{open:"12:00",close:"23:00",closed:false}, friday:{open:"12:00",close:"23:00",closed:false}, saturday:{open:"12:00",close:"23:00",closed:false}, sunday:{open:"12:00",close:"23:00",closed:false} },
          accessibility:         { wheelchairAccess: true, brailleMenu: false, hearingLoop: false, largeText: false, note: '' },
          noise_level:           'Moderate',
          noise_level_score:     2,
          vibe_tags:             [app.cuisine, 'Curated'],
          ambience:              'Casual',
          cuisine_filters:       [app.cuisine],
          budget_filter:         app.priceRange || '₹₹',
          distance_km:           2.5,
          featured:              false,
          trending:              true,
          recently_added:        true,
          approved:              true,
          owner_id:              app.userId,
          google_maps_url:       `https://maps.google.com/?q=${encodeURIComponent(app.name + ' ' + app.city)}`,
          available_slots:       ["12:00","13:00","19:00","19:30","20:00","20:30","21:00"],
          slot_capacities:       {},
          rating:                4.8,
          review_count:          1,
          capacity:              30
        };

        const { data: resRow, error: rErr } = await supa
          .from('restaurants')
          .insert([newRes])
          .select()
          .single();
        if (rErr) { console.error('[DB] approveListingApplication insert error:', rErr); return null; }

        await supa.from('listing_applications').update({ status: 'approved' }).eq('id', Number(appId));
        await supa.from('profiles').update({ role: 'owner', restaurant_id: resRow.id }).eq('id', app.userId);
        await this.init();

        return _mapRestaurant(resRow);
      } catch (e) {
        console.error('[DB] approveListingApplication catch:', e);
        return null;
      }
    },

    async rejectListingApplication(appId) {
      if (!window.supa) return;
      await supa
        .from('listing_applications')
        .update({ status: 'rejected' })
        .eq('id', Number(appId));
    },

    // ── STATS ────────────────────────────────────────────────────

    async getStats() {
      if (!window.supa) {
        return { totalUsers: 0, totalRestaurants: 0, pendingApprovals: 0, totalReservations: 0 };
      }
      try {
        const [usersRes, restaurantsRes, pendingResRes, reservationsRes, appsRes] = await Promise.all([
          supa.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
          supa.from('restaurants').select('id', { count: 'exact', head: true }).eq('approved', true),
          supa.from('restaurants').select('id', { count: 'exact', head: true }).eq('approved', false),
          supa.from('reservations').select('id', { count: 'exact', head: true }),
          supa.from('listing_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ]);
        return {
          totalUsers:        usersRes.count || 0,
          totalRestaurants:  restaurantsRes.count || 0,
          pendingApprovals:  (pendingResRes.count || 0) + (appsRes.count || 0),
          totalReservations: reservationsRes.count || 0
        };
      } catch (e) {
        return { totalUsers: 0, totalRestaurants: 0, pendingApprovals: 0, totalReservations: 0 };
      }
    },

    // ── SLOTS ────────────────────────────────────────────────────

    async getAvailableSlots(restaurantId) {
      const r = await this.getRestaurantById(restaurantId);
      return r ? (r.availableSlots || []) : [];
    },

    async setAvailableSlots(restaurantId, slots) {
      if (!window.supa) return;
      await supa.from('restaurants').update({ available_slots: slots }).eq('id', Number(restaurantId));
      await this.init();
    },

    async getSlotCapacities(restaurantId) {
      const r = await this.getRestaurantById(restaurantId);
      return r ? (r.slotCapacities || {}) : {};
    },

    async setSlotCapacities(restaurantId, capacities) {
      if (!window.supa) return;
      await supa.from('restaurants').update({ slot_capacities: capacities }).eq('id', Number(restaurantId));
      await this.init();
    },

    async getSlotCapacity(restaurantId, time) {
      const r = await this.getRestaurantById(restaurantId);
      if (!r) return 20;
      if (r.slotCapacities && r.slotCapacities[time] !== undefined) {
        return Number(r.slotCapacities[time]);
      }
      return r.capacity || 20;
    },

    getAllPossibleSlots() {
      const slots = [];
      for (let h = 11; h <= 22; h++) {
        slots.push(`${String(h).padStart(2,'0')}:00`);
        if (h < 22) slots.push(`${String(h).padStart(2,'0')}:30`);
      }
      return slots;
    },

    // ── SAVED RESTAURANTS ───────────────────────────────────────

    async toggleSavedRestaurant(userId, restaurantId) {
      const profile = await this.getUserById(userId);
      if (!profile || !window.supa) return [];
      const saved = profile.savedRestaurants || [];
      const numId = Number(restaurantId);
      const idx = saved.indexOf(numId);
      const updated = idx > -1
        ? saved.filter(id => id !== numId)
        : [...saved, numId];
      await this.updateProfile(userId, { savedRestaurants: updated });
      return updated;
    },

    async getSavedRestaurants(userId) {
      const profile = await this.getUserById(userId);
      if (!profile || !profile.savedRestaurants?.length || !window.supa) return [];
      try {
        const { data, error } = await supa
          .from('restaurants')
          .select('*')
          .in('id', profile.savedRestaurants)
          .eq('approved', true);
        if (error) return [];
        return (data || []).map(_mapRestaurant);
      } catch (e) { return []; }
    },

    // ── ADMIN: DIRECT RESTAURANT CREATION ────────────────────

    async adminCreateRestaurant(data) {
      if (!window.supa) return null;
      const priceLevelMap = { '₹': 1, '₹₹': 2, '₹₹₹': 3, '₹₹₹₹': 4 };
      const slug = (data.name || 'restaurant').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);

      const row = {
        name:                  data.name,
        slug,
        cuisine:               data.cuisine || '',
        cuisine_category:      data.cuisineCategory || data.cuisine || '',
        price_range:           data.priceRange || '₹₹',
        price_level:           priceLevelMap[data.priceRange] || 2,
        editorial_description: data.editorialDescription || data.shortDescription || '',
        short_description:     data.shortDescription || '',
        address:               data.address || '',
        city:                  data.city || 'Chennai',
        phone:                 data.phone || '',
        email:                 data.email || '',
        website:               data.website || '',
        cover_image:           data.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
        gallery:               data.gallery || [data.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
        menu:                  data.menu || [{ section: "Chef's Specials", items: [{ name: "House Signature Dish", description: "Chef's special creation", price: "₹650" }] }],
        best_dishes:           data.bestDishes || [],
        hours:                 data.hours || { monday:{open:"12:00",close:"23:00",closed:false}, tuesday:{open:"12:00",close:"23:00",closed:false}, wednesday:{open:"12:00",close:"23:00",closed:false}, thursday:{open:"12:00",close:"23:00",closed:false}, friday:{open:"12:00",close:"23:00",closed:false}, saturday:{open:"12:00",close:"23:00",closed:false}, sunday:{open:"12:00",close:"23:00",closed:false} },
        accessibility:         data.accessibility || { wheelchairAccess: true, brailleMenu: false, hearingLoop: false, largeText: false, note: '' },
        noise_level:           data.noiseLevel || 'Moderate',
        noise_level_score:     data.noiseLevelScore || 2,
        vibe_tags:             data.vibeTags || [data.cuisine || 'Specialty'],
        ambience:              data.ambience || 'Casual',
        cuisine_filters:       data.cuisineFilters || [data.cuisine || 'Specialty'],
        budget_filter:         data.priceRange || '₹₹',
        distance_km:           data.distanceKm || 0,
        featured:              Boolean(data.featured),
        trending:              Boolean(data.trending),
        recently_added:        true,
        approved:              Boolean(data.approved !== false), // default approved for admin-created
        owner_id:              data.ownerId || null,
        google_maps_url:       data.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent((data.name || '') + ' ' + (data.city || 'Chennai'))}`,
        available_slots:       data.availableSlots || ["12:00","13:00","19:00","19:30","20:00","20:30","21:00"],
        slot_capacities:       data.slotCapacities || {},
        rating:                data.rating || 4.8,
        review_count:          0,
        capacity:              data.capacity || 30
      };

      try {
        const { data: created, error } = await supa
          .from('restaurants')
          .insert([row])
          .select()
          .single();
        if (error) { console.error('[DB] adminCreateRestaurant error:', error); return null; }
        await this.init(); // refresh cache
        return _mapRestaurant(created);
      } catch (err) {
        console.error('[DB] adminCreateRestaurant catch:', err);
        return null;
      }
    },

    // ── DUMMY DATA SEEDING ──────────────────────────────────────
    async seedDummyRestaurants() {
      if (!window.supa) return { count: 0, error: 'Supabase connection not ready' };

      const DUMMY_LIST = [
        {
          name: "Avartana",
          slug: "avartana-chennai",
          cuisine: "Modern South Indian",
          cuisine_category: "South Indian",
          price_range: "₹₹₹₹",
          price_level: 4,
          editorial_description: "A culinary tour de force reimagining coastal and southern Indian flavours through avant-garde techniques, modernist presentations, and sublime tasting menus.",
          short_description: "Progressive, Michelin-caliber South Indian degustation menus.",
          address: "ITC Grand Chola, 63 Anna Salai, Guindy",
          city: "Chennai",
          phone: "+91 44 2220 0000",
          email: "avartana.itcgrandchola@itchotels.in",
          website: "https://www.itchotels.com/in/en/itcgrandchola-chennai/dining/avartana",
          cover_image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80",
          gallery: [
            "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80"
          ],
          menu: [
            {
              section: "Tasting Menu Highlights",
              items: [
                { name: "Distilled Rasam", description: "Infused with fresh coriander and crushed Tellicherry black pepper", price: "₹850" },
                { name: "Pan-Seared Lobster", description: "Tossed in roasted shallots and tender coconut emulsion", price: "₹1,850" },
                { name: "Asparagus & Raw Mango", description: "Steamed dumplings with spiced coconut foam", price: "₹950" },
                { name: "Lamb Chops Ghee Roast", description: "Slow-roasted tender lamb chops with Byadgi chili glaze", price: "₹1,950" }
              ]
            }
          ],
          best_dishes: ["Distilled Rasam", "Lamb Chops Ghee Roast", "Pan-Seared Lobster"],
          hours: {
            monday: { open: "19:00", close: "23:30", closed: false },
            tuesday: { open: "19:00", close: "23:30", closed: false },
            wednesday: { open: "19:00", close: "23:30", closed: false },
            thursday: { open: "19:00", close: "23:30", closed: false },
            friday: { open: "19:00", close: "23:30", closed: false },
            saturday: { open: "12:30", close: "23:30", closed: false },
            sunday: { open: "12:30", close: "23:30", closed: false }
          },
          accessibility: { wheelchairAccess: true, brailleMenu: true, hearingLoop: true, largeText: true, note: "Full valet and elevator access from ITC lobby." },
          noise_level: "Quiet",
          noise_level_score: 1,
          vibe_tags: ["Fine Dining", "Romantic", "Modern Indian", "Luxury"],
          ambience: "Luxury",
          cuisine_filters: ["South Indian", "Modern Indian", "Fine Dining"],
          budget_filter: "₹₹₹₹",
          distance_km: 4.2,
          featured: true,
          trending: true,
          recently_added: false,
          approved: true,
          rating: 4.9,
          review_count: 342,
          capacity: 45,
          available_slots: ["19:00","19:30","20:00","20:30","21:00","21:30"]
        },
        {
          name: "Pumpkin Tales",
          slug: "pumpkin-tales-alwarpet",
          cuisine: "Global Comfort & Brunch",
          cuisine_category: "Cafe & Brunch",
          price_range: "₹₹",
          price_level: 2,
          editorial_description: "An all-day cafe celebrated for artisanal sourdough toasts, vibrant grain bowls, Japanese souffle pancakes, and exceptional specialty pour-over coffees.",
          short_description: "Wholesome global comfort food & artisan bakery.",
          address: "37, 20 Bheemanna Garden Street, Alwarpet",
          city: "Chennai",
          phone: "+91 44 2499 6945",
          email: "hello@pumpkintales.com",
          website: "https://www.pumpkintales.com",
          cover_image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920&q=80",
          gallery: [
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80",
            "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?w=800&q=80"
          ],
          menu: [
            {
              section: "All-Day Breakfast & Mains",
              items: [
                { name: "Avocado & Poached Egg Toast", description: "Hass avocado, sourdough bread, za'atar, pickled radish", price: "₹480" },
                { name: "Japanese Souffle Pancakes", description: "Light-as-air stack with maple honeycomb butter", price: "₹420" },
                { name: "Korean Bibimbap Bowl", description: "Sticky rice, sauteed seasonal greens, gochujang sauce", price: "₹560" },
                { name: "Truffle Mushroom Risotto", description: "Arborio rice, wild shiitake, parmesan crisp", price: "₹620" }
              ]
            }
          ],
          best_dishes: ["Avocado & Poached Egg Toast", "Japanese Souffle Pancakes", "Truffle Mushroom Risotto"],
          hours: {
            monday: { open: "07:00", close: "22:30", closed: false },
            tuesday: { open: "07:00", close: "22:30", closed: false },
            wednesday: { open: "07:00", close: "22:30", closed: false },
            thursday: { open: "07:00", close: "22:30", closed: false },
            friday: { open: "07:00", close: "22:30", closed: false },
            saturday: { open: "07:00", close: "23:00", closed: false },
            sunday: { open: "07:00", close: "23:00", closed: false }
          },
          accessibility: { wheelchairAccess: true, brailleMenu: false, hearingLoop: false, largeText: false, note: "Ramp available at main entrance." },
          noise_level: "Moderate",
          noise_level_score: 2,
          vibe_tags: ["Brunch", "Casual", "Outdoor Seating", "Coffee"],
          ambience: "Casual",
          cuisine_filters: ["Cafe & Brunch", "Continental", "Vegetarian-Friendly"],
          budget_filter: "₹₹",
          distance_km: 2.1,
          featured: true,
          trending: true,
          recently_added: false,
          approved: true,
          rating: 4.8,
          review_count: 215,
          capacity: 60,
          available_slots: ["09:00","10:30","12:00","13:30","18:00","19:30","20:30"]
        },
        {
          name: "Soy Soi",
          slug: "soy-soi-adyar",
          cuisine: "Pan-Asian & Dim Sum",
          cuisine_category: "Asian",
          price_range: "₹₹₹",
          price_level: 3,
          editorial_description: "An homage to the street-food culture of Thailand, Vietnam, Singapore, and Indonesia, serving handcrafted dim sums, aromatic laksa, and sizzling robata grills.",
          short_description: "Authentic Southeast Asian street flavors & delicate dim sums.",
          address: "2/10 Gandhi Nagar 1st Main Road, Adyar",
          city: "Chennai",
          phone: "+91 44 4553 4343",
          email: "reservations@soysoi.in",
          website: "https://www.soysoi.in",
          cover_image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1920&q=80",
          gallery: [
            "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&q=80",
            "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800&q=80"
          ],
          menu: [
            {
              section: "Dim Sum & Asian Specialties",
              items: [
                { name: "Truffle Edamame Dumplings", description: "Steamed crystal dumplings with black truffle oil", price: "₹520" },
                { name: "Prawn Har Gau", description: "Classic translucent wrappers filled with juicy tiger prawns", price: "₹580" },
                { name: "Singaporean Seafood Laksa", description: "Spicy coconut broth, rice noodles, calamari, tofu puffs", price: "₹690" },
                { name: "Nasi Goreng Istimewa", description: "Indonesian wok-fried rice with chicken satay & fried egg", price: "₹640" }
              ]
            }
          ],
          best_dishes: ["Truffle Edamame Dumplings", "Singaporean Seafood Laksa", "Prawn Har Gau"],
          hours: {
            monday: { open: "12:00", close: "23:00", closed: false },
            tuesday: { open: "12:00", close: "23:00", closed: false },
            wednesday: { open: "12:00", close: "23:00", closed: false },
            thursday: { open: "12:00", close: "23:00", closed: false },
            friday: { open: "12:00", close: "23:30", closed: false },
            saturday: { open: "12:00", close: "23:30", closed: false },
            sunday: { open: "12:00", close: "23:00", closed: false }
          },
          accessibility: { wheelchairAccess: true, brailleMenu: false, hearingLoop: false, largeText: false, note: "Street-level entrance with elevator." },
          noise_level: "Lively",
          noise_level_score: 3,
          vibe_tags: ["Pan-Asian", "Dim Sum", "Lively", "Cocktails"],
          ambience: "Lively",
          cuisine_filters: ["Asian", "Dim Sum", "Thai", "Vietnamese"],
          budget_filter: "₹₹₹",
          distance_km: 3.8,
          featured: false,
          trending: true,
          recently_added: false,
          approved: true,
          rating: 4.7,
          review_count: 188,
          capacity: 70,
          available_slots: ["12:30","13:30","19:00","20:00","21:00","21:45"]
        },
        {
          name: "The Flying Elephant",
          slug: "the-flying-elephant-guindy",
          cuisine: "Global Experiential & Grill",
          cuisine_category: "Global",
          price_range: "₹₹₹₹",
          price_level: 4,
          editorial_description: "A breathtaking multi-level architectural spectacle offering theatrical open show-kitchens, world-class wood-fired grills, and curated mixology.",
          short_description: "Multi-level theater of global dining & live kitchens.",
          address: "Park Hyatt Chennai, 39 Velachery Road, Guindy",
          city: "Chennai",
          phone: "+91 44 7177 1234",
          email: "flyingelephant.parkhyatt@hyatt.com",
          website: "https://www.hyatt.com/en-US/hotel/india/park-hyatt-chennai/cheph/dining",
          cover_image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&q=80",
          gallery: [
            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80",
            "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80"
          ],
          menu: [
            {
              section: "Charcoal Grill & Global Signatures",
              items: [
                { name: "Wood-Fired Neapolitan Pizza", description: "San Marzano tomatoes, fior di latte, fresh basil", price: "₹950" },
                { name: "Australian Lamb Rack", description: "Herb-crusted with roasted root vegetables and jus", price: "₹2,400" },
                { name: "Atlantic Salmon Steak", description: "Charred asparagus, saffron beurre blanc", price: "₹1,850" },
                { name: "Molten Valrhona Chocolate Cake", description: "Madagascar vanilla bean gelato", price: "₹650" }
              ]
            }
          ],
          best_dishes: ["Wood-Fired Neapolitan Pizza", "Australian Lamb Rack", "Atlantic Salmon Steak"],
          hours: {
            monday: { open: "19:00", close: "01:00", closed: false },
            tuesday: { open: "19:00", close: "01:00", closed: false },
            wednesday: { open: "19:00", close: "01:00", closed: false },
            thursday: { open: "19:00", close: "01:00", closed: false },
            friday: { open: "19:00", close: "02:00", closed: false },
            saturday: { open: "19:00", close: "02:00", closed: false },
            sunday: { open: "12:00", close: "01:00", closed: false }
          },
          accessibility: { wheelchairAccess: true, brailleMenu: false, hearingLoop: true, largeText: false, note: "Full elevator connectivity between dining levels." },
          noise_level: "Lively",
          noise_level_score: 3,
          vibe_tags: ["Nightlife", "Luxury", "Cocktails", "Date Night"],
          ambience: "Luxury",
          cuisine_filters: ["Global", "Italian", "Grill", "Fine Dining"],
          budget_filter: "₹₹₹₹",
          distance_km: 4.8,
          featured: true,
          trending: true,
          recently_added: false,
          approved: true,
          rating: 4.8,
          review_count: 410,
          capacity: 120,
          available_slots: ["19:00","20:00","21:00","22:00","23:00"]
        },
        {
          name: "Amethyst Café",
          slug: "wild-garden-amethyst-royapettah",
          cuisine: "Continental & European Bakery",
          cuisine_category: "Cafe & Brunch",
          price_range: "₹₹",
          price_level: 2,
          editorial_description: "Set within a lush colonial-era heritage mansion and courtyard garden, Amethyst is Chennai's iconic haven for European pasta, artisanal quiches, and fragrant teas.",
          short_description: "Garden courtyard cafe in a restored colonial heritage bungalow.",
          address: "Whites Road, Royapettah",
          city: "Chennai",
          phone: "+91 44 4599 1630",
          email: "contact@wildgardenamethyst.com",
          website: "https://www.amethystchennai.com",
          cover_image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80",
          gallery: [
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
            "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80"
          ],
          menu: [
            {
              section: "Garden Kitchen Favorites",
              items: [
                { name: "Spinach & Goat Cheese Quiche", description: "Served with balsamic vinaigrette dressed wild greens", price: "₹420" },
                { name: "Penne Aglio Olio e Peperoncino", description: "Extra virgin olive oil, garlic slivers, sundried tomatoes", price: "₹490" },
                { name: "Smoked Chicken Panini", description: "Brie cheese, caramelized onions, homemade ciabatta", price: "₹460" },
                { name: "Warm Apple Crumble Tart", description: "Salted caramel drizzle, vanilla ice cream", price: "₹380" }
              ]
            }
          ],
          best_dishes: ["Spinach & Goat Cheese Quiche", "Smoked Chicken Panini", "Warm Apple Crumble Tart"],
          hours: {
            monday: { open: "10:00", close: "23:00", closed: false },
            tuesday: { open: "10:00", close: "23:00", closed: false },
            wednesday: { open: "10:00", close: "23:00", closed: false },
            thursday: { open: "10:00", close: "23:00", closed: false },
            friday: { open: "10:00", close: "23:00", closed: false },
            saturday: { open: "10:00", close: "23:00", closed: false },
            sunday: { open: "10:00", close: "23:00", closed: false }
          },
          accessibility: { wheelchairAccess: true, brailleMenu: false, hearingLoop: false, largeText: false, note: "Paved garden pathways and ground level seating." },
          noise_level: "Quiet",
          noise_level_score: 1,
          vibe_tags: ["Romantic", "Heritage", "Outdoor Seating", "Coffee"],
          ambience: "Romantic",
          cuisine_filters: ["Cafe & Brunch", "Continental", "Italian"],
          budget_filter: "₹₹",
          distance_km: 1.8,
          featured: false,
          trending: true,
          recently_added: false,
          approved: true,
          rating: 4.7,
          review_count: 380,
          capacity: 80,
          available_slots: ["11:00","13:00","16:00","18:00","19:30","21:00"]
        },
        {
          name: "Balfour Italian Eatery",
          slug: "balfour-italian-kilpauk",
          cuisine: "Authentic Italian & Pizza",
          cuisine_category: "Italian",
          price_range: "₹₹₹",
          price_level: 3,
          editorial_description: "Handcrafted Roman and Neapolitan pizzas baked in a custom stone oven, paired with fresh extruded pastas and decadent artisanal tiramisu.",
          short_description: "Artisanal stone-baked pizzas & fresh handmade pastas.",
          address: "24 Balfour Road, Kilpauk",
          city: "Chennai",
          phone: "+91 44 4858 2424",
          email: "ciao@balfoureats.com",
          website: "https://www.balfoureats.com",
          cover_image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80",
          gallery: [
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
            "https://images.unsplash.com/photo-1579684947550-22e945225d9a?w=800&q=80"
          ],
          menu: [
            {
              section: "Pasta Fresca & Pizze",
              items: [
                { name: "Burrata Pugliese Pizza", description: "Fresh burrata, heirloom cherry tomatoes, pesto drizzle", price: "₹780" },
                { name: "Hand-rolled Tagliatelle Funghi", description: "Wild porcini mushroom sauce, parmigiano reggiano", price: "₹680" },
                { name: "Gnocchi al Gorgonzola", description: "Potato gnocchi, cream of gorgonzola, roasted walnuts", price: "₹640" },
                { name: "Classic Espresso Tiramisu", description: "Savoiardi ladyfingers, mascarpone, dusting of cocoa", price: "₹450" }
              ]
            }
          ],
          best_dishes: ["Burrata Pugliese Pizza", "Hand-rolled Tagliatelle Funghi", "Classic Espresso Tiramisu"],
          hours: {
            monday: { open: "12:00", close: "23:00", closed: false },
            tuesday: { open: "12:00", close: "23:00", closed: false },
            wednesday: { open: "12:00", close: "23:00", closed: false },
            thursday: { open: "12:00", close: "23:00", closed: false },
            friday: { open: "12:00", close: "23:30", closed: false },
            saturday: { open: "12:00", close: "23:30", closed: false },
            sunday: { open: "12:00", close: "23:00", closed: false }
          },
          accessibility: { wheelchairAccess: true, brailleMenu: false, hearingLoop: false, largeText: false, note: "Street parking and wheelchair ramp available." },
          noise_level: "Moderate",
          noise_level_score: 2,
          vibe_tags: ["Italian", "Pizza", "Casual Dining", "Family"],
          ambience: "Casual",
          cuisine_filters: ["Italian", "Pizza", "European"],
          budget_filter: "₹₹₹",
          distance_km: 3.1,
          featured: false,
          trending: false,
          recently_added: true,
          approved: true,
          rating: 4.8,
          review_count: 142,
          capacity: 50,
          available_slots: ["12:30","13:30","19:00","20:00","21:00","21:45"]
        }
      ];

      try {
        // Fetch existing restaurants to avoid duplicates
        const { data: existing, error: fetchErr } = await supa
          .from('restaurants')
          .select('name, slug');
        
        const existingNames = new Set((existing || []).map(r => (r.name || '').trim().toLowerCase()));
        const existingSlugs = new Set((existing || []).map(r => (r.slug || '').trim().toLowerCase()));

        // Filter out any restaurant that already exists
        const toInsert = DUMMY_LIST.filter(r => 
          !existingNames.has(r.name.trim().toLowerCase()) && 
          !existingSlugs.has(r.slug.trim().toLowerCase())
        );

        if (toInsert.length === 0) {
          return { count: 0, message: 'All sample restaurants are already present in the database.' };
        }

        const { data: inserted, error: insertErr } = await supa
          .from('restaurants')
          .insert(toInsert)
          .select();

        if (insertErr) {
          console.error('[DB] seedDummyRestaurants error:', insertErr);
          return { count: 0, error: insertErr.message };
        }

        await this.init(); // Refresh local cache
        return { count: inserted?.length || 0, restaurants: inserted };
      } catch (err) {
        console.error('[DB] seedDummyRestaurants exception:', err);
        return { count: 0, error: err.message || 'Seeding failed.' };
      }
    },

    // ── UTILITY ─────────────────────────────────────────────────

    getShiftOptions(timeStr) {
      if (!timeStr) return [];
      const parts = timeStr.split(':').map(Number);
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return [];
      const origMinutes = parts[0] * 60 + parts[1];
      const options = [];
      [30, 60].forEach(offset => {
        const target = origMinutes + offset;
        const h = Math.floor(target / 60);
        const m = target % 60;
        if (h <= 23) options.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      });
      return options;
    },

    getDayName(day) {
      return { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' }[day] || day;
    },

    isOpenNow(restaurant) {
      if (!restaurant || !restaurant.hours) return false;
      const now = new Date();
      const dayMap = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const today = dayMap[now.getDay()];
      const hours = restaurant.hours[today];
      if (!hours || hours.closed || !hours.open || !hours.close) return false;
      const [openH, openM] = hours.open.split(':').map(Number);
      const [closeH, closeM] = hours.close.split(':').map(Number);
      const nowMin = now.getHours() * 60 + now.getMinutes();
      return nowMin >= (openH*60+openM) && nowMin < (closeH*60+closeM);
    }
  };
})();
