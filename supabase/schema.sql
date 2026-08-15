-- ============================================================
-- TABLD — Supabase Schema
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── 1. PROFILES TABLE ─────────────────────────────────────────
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  name                  text not null default '',
  email                 text not null default '',
  role                  text not null default 'user' check (role in ('user', 'owner', 'admin')),
  phone                 text default '',
  avatar                text default '',
  onboarding_completed  boolean default false,
  taste_profile         jsonb default null,
  saved_restaurants     int[] default '{}',
  restaurant_id         int default null,
  joined_at             date default now()
);

-- Auto profile creation trigger on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 2. RESTAURANTS TABLE ──────────────────────────────────────
create table if not exists public.restaurants (
  id                    serial primary key,
  name                  text not null,
  slug                  text unique,
  cuisine               text default '',
  cuisine_category      text default '',
  price_range           text default '₹₹',
  price_level           int default 2,
  editorial_description text default '',
  short_description     text default '',
  address               text default '',
  city                  text default 'Chennai',
  phone                 text default '',
  email                 text default '',
  website               text default '',
  cover_image           text default '',
  gallery               text[] default '{}',
  menu                  jsonb default '[]',
  best_dishes           text[] default '{}',
  hours                 jsonb default '{}',
  accessibility         jsonb default '{}',
  noise_level           text default 'Moderate',
  noise_level_score     int default 2,
  vibe_tags             text[] default '{}',
  ambience              text default 'Casual',
  cuisine_filters       text[] default '{}',
  budget_filter         text default '₹₹',
  distance_km           numeric default 0,
  featured              boolean default false,
  trending              boolean default false,
  recently_added        boolean default true,
  approved              boolean default false,
  owner_id              uuid references public.profiles(id) on delete set null,
  google_maps_url       text default '',
  available_slots       text[] default '{}',
  slot_capacities       jsonb default '{}',
  rating                numeric default 4.8,
  review_count          int default 0,
  capacity              int default 30,
  created_at            date default now()
);

-- ─── 3. RESERVATIONS TABLE ─────────────────────────────────────
create table if not exists public.reservations (
  id              serial primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  restaurant_id   int references public.restaurants(id) on delete cascade,
  restaurant_name text default '',
  date            date not null,
  time            text not null,
  guests          int not null default 2,
  status          text default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  notes           text default '',
  cancel_reason   text default '',
  cancelled_by    text default '',
  cancelled_at    timestamptz default null,
  shift_reason    text default '',
  shifted_by      text default '',
  shifted_at      timestamptz default null,
  original_time   text default '',
  created_at      timestamptz default now()
);

-- ─── 4. REVIEWS TABLE ──────────────────────────────────────────
create table if not exists public.reviews (
  id              serial primary key,
  user_id         uuid references public.profiles(id) on delete cascade,
  restaurant_id   int references public.restaurants(id) on delete cascade,
  user_name       text default '',
  user_avatar     text default '',
  rating          int not null check (rating between 1 and 5),
  comment         text default '',
  created_at      timestamptz default now()
);

-- ─── 5. LISTING APPLICATIONS TABLE ─────────────────────────────
create table if not exists public.listing_applications (
  id                serial primary key,
  user_id           uuid references public.profiles(id) on delete cascade,
  user_name         text default '',
  user_email        text default '',
  name              text not null,
  cuisine           text default '',
  city              text default 'Chennai',
  address           text default '',
  phone             text default '',
  email             text default '',
  price_range       text default '₹₹',
  short_description text default '',
  cover_image       text default '',
  status            text default 'pending' check (status in ('pending','approved','rejected')),
  created_at        date default now()
);

-- ─── 6. ROW LEVEL SECURITY ─────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.reservations enable row level security;
alter table public.reviews enable row level security;
alter table public.listing_applications enable row level security;

-- PROFILES POLICIES
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Authenticated users can view all profiles" on public.profiles;
create policy "Authenticated users can view all profiles"
  on public.profiles for select using (auth.role() = 'authenticated');

drop policy if exists "Allow profile insertion on signup" on public.profiles;
create policy "Allow profile insertion on signup"
  on public.profiles for insert with check (auth.uid() = id);

-- RESTAURANTS POLICIES
drop policy if exists "Anyone can view approved restaurants" on public.restaurants;
create policy "Anyone can view approved restaurants"
  on public.restaurants for select using (approved = true);

drop policy if exists "Owners can view their own restaurant" on public.restaurants;
create policy "Owners can view their own restaurant"
  on public.restaurants for select using (auth.uid() = owner_id);

drop policy if exists "Authenticated users can insert restaurants" on public.restaurants;
create policy "Authenticated users can insert restaurants"
  on public.restaurants for insert with check (auth.role() = 'authenticated');

drop policy if exists "Owners can update their own restaurant" on public.restaurants;
create policy "Owners can update their own restaurant"
  on public.restaurants for update using (auth.uid() = owner_id);

drop policy if exists "Admins can manage all restaurants" on public.restaurants;
create policy "Admins can manage all restaurants"
  on public.restaurants for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- RESERVATIONS POLICIES
drop policy if exists "Users can view their own reservations" on public.reservations;
create policy "Users can view their own reservations"
  on public.reservations for select using (auth.uid() = user_id);

drop policy if exists "Users can insert reservations" on public.reservations;
create policy "Users can insert reservations"
  on public.reservations for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own reservations" on public.reservations;
create policy "Users can update their own reservations"
  on public.reservations for update using (auth.uid() = user_id);

drop policy if exists "Owners can view reservations for their restaurant" on public.reservations;
create policy "Owners can view reservations for their restaurant"
  on public.reservations for select using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can update reservations for their restaurant" on public.reservations;
create policy "Owners can update reservations for their restaurant"
  on public.reservations for update using (
    exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id and r.owner_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage all reservations" on public.reservations;
create policy "Admins can manage all reservations"
  on public.reservations for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- REVIEWS POLICIES
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
  on public.reviews for select using (true);

drop policy if exists "Authenticated users can insert reviews" on public.reviews;
create policy "Authenticated users can insert reviews"
  on public.reviews for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can update their own reviews"
  on public.reviews for update using (auth.uid() = user_id);

-- LISTING APPLICATIONS POLICIES
drop policy if exists "Users can view their own applications" on public.listing_applications;
create policy "Users can view their own applications"
  on public.listing_applications for select using (auth.uid() = user_id);

drop policy if exists "Authenticated users can submit applications" on public.listing_applications;
create policy "Authenticated users can submit applications"
  on public.listing_applications for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can manage all applications" on public.listing_applications;
create policy "Admins can manage all applications"
  on public.listing_applications for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
