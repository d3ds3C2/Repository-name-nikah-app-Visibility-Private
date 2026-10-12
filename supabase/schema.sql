-- =====================================================================
-- Nikah.App 5.1.0 — Supabase / Postgres schema (v2, hardened)
-- Apply to a FRESH Supabase project: SQL Editor → paste → Run.
--
-- Changes vs 5.0.1 starter schema
--  * gender + seeking stored and enforced in discovery (both directions)
--  * verification flags moved to a separate table the client can only READ
--    (previously users could set selfie_verified=true on themselves)
--  * profiles are no longer readable by every authenticated user:
--    discovery goes through discover_candidates() which applies gender,
--    age range, blocks (both directions), passes and likes server-side and
--    returns age instead of birth_date
--  * like_profile() creates matches server-side (mutual check in SQL)
--  * blocks close the match and hide both users from each other
--  * passes table (previously only in localStorage)
--  * advisory module: packages (server-side pricing), requests, documents,
--    payments — the first revenue path
--  * delete_my_account() — real account deletion
--  * updated_at triggers, 18+ check, storage bucket policies
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.age_of(d date)
returns int language sql stable as $$
  select date_part('year', age(current_date, d))::int
$$;

-- ---------------------------------------------------------------------
-- profiles (owned by user; NOT globally readable)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  birth_date date check (birth_date is null or birth_date <= current_date - interval '18 years'),
  gender text check (gender in ('Kadın','Erkek','Diğer')),
  seeking text check (seeking in ('Kadın','Erkek','Fark etmez')),
  country text,
  city text,
  lang text not null default 'tr' check (lang in ('tr','id','en','zh','th')),
  intent text,
  children_plan text,
  family_role text,
  relocation text,
  occupation text,
  education text,
  bio text check (bio is null or char_length(bio) <= 500),
  bio_translations jsonb not null default '{}'::jsonb,
  prompts jsonb not null default '[]'::jsonb,       -- [[prompt_key, text], ...]
  compat jsonb not null default '{}'::jsonb,        -- {communication, planning, social, conflict, money}
  languages text[] not null default '{}',
  photo_path text,                                   -- object path in bucket profile-photos
  discoverable boolean not null default true,
  profile_complete boolean not null default false,
  onboarding_step int not null default 1 check (onboarding_step between 1 and 6),
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  age_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- verifications — written ONLY by service role / edge functions
-- ---------------------------------------------------------------------
create table if not exists public.verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_verified boolean not null default false,
  email_verified boolean not null default false,
  selfie_verified boolean not null default false,
  identity_verified boolean not null default false,
  provider text,
  provider_ref text,
  updated_at timestamptz not null default now()
);
drop trigger if exists verifications_updated_at on public.verifications;
create trigger verifications_updated_at before update on public.verifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- preferences / settings
-- ---------------------------------------------------------------------
create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  min_age int not null default 18 check (min_age between 18 and 100),
  max_age int not null default 80 check (max_age between 18 and 100),
  region_scope text not null default 'Global' check (region_scope in ('Global','Ülkem','Şehrim')),
  intent text,
  children_plan text,
  verified_only boolean not null default false,
  dealbreakers jsonb not null default '{"age":true,"intent":true,"children":false,"region":false}'::jsonb,
  updated_at timestamptz not null default now(),
  check (min_age <= max_age)
);
drop trigger if exists preferences_updated_at on public.preferences;
create trigger preferences_updated_at before update on public.preferences
  for each row execute function public.set_updated_at();

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'tr' check (language in ('tr','id','en','zh','th')),
  translation boolean not null default true,
  notifications boolean not null default true,
  quality_mode boolean not null default true,
  verified_chats_only boolean not null default false,
  photo_privacy boolean not null default true,
  safety_checkin boolean not null default true,
  trusted_contact text,
  updated_at timestamptz not null default now()
);
drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- marriage journey (per user; optionally tied to a match)
-- ---------------------------------------------------------------------
create table if not exists public.marriage_journeys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  match_id uuid,
  stage int not null default 0 check (stage between 0 and 6),
  documents jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
drop trigger if exists journeys_updated_at on public.marriage_journeys;
create trigger journeys_updated_at before update on public.marriage_journeys
  for each row execute function public.set_updated_at();

-- auto-create satellite rows when a profile is created
create or replace function public.on_profile_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.verifications(user_id) values (new.id) on conflict do nothing;
  insert into public.settings(user_id) values (new.id) on conflict do nothing;
  insert into public.preferences(user_id) values (new.id) on conflict do nothing;
  insert into public.marriage_journeys(user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists profiles_after_insert on public.profiles;
create trigger profiles_after_insert after insert on public.profiles
  for each row execute function public.on_profile_created();

-- mark phone/email verified from auth state (OTP confirmed by Supabase Auth)
create or replace function public.sync_auth_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.verifications(user_id, phone_verified, email_verified)
  values (new.id, new.phone_confirmed_at is not null, new.email_confirmed_at is not null)
  on conflict (user_id) do update
    set phone_verified = excluded.phone_verified or public.verifications.phone_verified,
        email_verified = excluded.email_verified or public.verifications.email_verified;
  return new;
end $$;
drop trigger if exists on_auth_user_verified on auth.users;
create trigger on_auth_user_verified after insert or update of phone_confirmed_at, email_confirmed_at on auth.users
  for each row execute function public.sync_auth_verification();

-- ---------------------------------------------------------------------
-- discovery graph
-- ---------------------------------------------------------------------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'like' check (kind in ('like','super')),
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now(),
  unique (from_user,to_user),
  check (from_user <> to_user)
);
create index if not exists likes_to_user_idx on public.likes(to_user);

create table if not exists public.passes (
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user,to_user)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','closed','blocked')),
  like_note text,
  created_at timestamptz not null default now(),
  check (user_a < user_b)   -- always stored ordered so the pair is unique
);
create unique index if not exists matches_pair_unique on public.matches (user_a, user_b);

alter table public.marriage_journeys
  drop constraint if exists marriage_journeys_match_id_fkey;
alter table public.marriage_journeys
  add constraint marriage_journeys_match_id_fkey foreign key (match_id) references public.matches(id) on delete set null;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists messages_match_created_idx on public.messages(match_id,created_at);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id,blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on public.blocks(blocked_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','closed')),
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);

create table if not exists public.verification_requests (
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requester_id,target_id)
);

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  caller_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('voice','video')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- ADVISORY MODULE (revenue) — packages priced server-side
-- ---------------------------------------------------------------------
create table if not exists public.advisory_packages (
  code text primary key,                 -- 'basic' | 'full' | 'vip'
  name_key text not null,                -- i18n key in the frontend
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'USD',
  features jsonb not null default '[]'::jsonb,   -- array of i18n keys
  sort_order int not null default 0,
  active boolean not null default true
);
-- Prices are placeholders — edit here, the frontend reads them from this table.
insert into public.advisory_packages(code,name_key,price_cents,currency,features,sort_order) values
 ('basic','basic',14900,'USD','["feat_checklist","feat_doc_review","feat_email_support"]',1),
 ('full','full_support',39900,'USD','["feat_checklist","feat_doc_review","feat_sworn_translation","feat_apostille_guidance","feat_video_consult"]',2),
 ('vip','vip',89900,'USD','["feat_checklist","feat_doc_review","feat_sworn_translation","feat_apostille_guidance","feat_video_consult","feat_dedicated_advisor","feat_priority"]',3)
on conflict (code) do update set price_cents=excluded.price_cents, features=excluded.features, name_key=excluded.name_key;

create table if not exists public.advisory_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  package_code text not null references public.advisory_packages(code),
  price_cents int not null default 0,                -- copied by trigger, never trusted from client
  currency text not null default 'USD',
  contact_email text,
  contact_phone text,
  contact_whatsapp text,
  country_from text,
  country_to text,
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'new'
    check (status in ('new','awaiting_payment','paid','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists advisory_requests_user_idx on public.advisory_requests(user_id, created_at desc);
drop trigger if exists advisory_updated_at on public.advisory_requests;
create trigger advisory_updated_at before update on public.advisory_requests
  for each row execute function public.set_updated_at();

create or replace function public.set_advisory_price()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.advisory_packages;
begin
  select * into p from public.advisory_packages where code = new.package_code and active;
  if not found then raise exception 'Unknown or inactive package %', new.package_code; end if;
  new.price_cents := p.price_cents;
  new.currency := p.currency;
  new.status := case when p.price_cents = 0 then 'paid' else 'awaiting_payment' end;
  return new;
end $$;
drop trigger if exists advisory_set_price on public.advisory_requests;
create trigger advisory_set_price before insert on public.advisory_requests
  for each row execute function public.set_advisory_price();

create table if not exists public.advisory_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.advisory_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,                 -- passport, birth, single, apostille, translation, kua, other
  storage_path text not null,             -- bucket advisory-docs
  original_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.advisory_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,                 -- stripe | iyzico | manual
  provider_ref text,
  amount_cents int not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists payments_provider_ref_idx on public.payments(provider, provider_ref) where provider_ref is not null;
drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.verifications enable row level security;
alter table public.preferences enable row level security;
alter table public.settings enable row level security;
alter table public.likes enable row level security;
alter table public.passes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.verification_requests enable row level security;
alter table public.call_logs enable row level security;
alter table public.marriage_journeys enable row level security;
alter table public.advisory_packages enable row level security;
alter table public.advisory_requests enable row level security;
alter table public.advisory_documents enable row level security;
alter table public.payments enable row level security;

create or replace function public.is_match_participant(mid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.matches m where m.id = mid and (m.user_a = auth.uid() or m.user_b = auth.uid()))
$$;
create or replace function public.blocked_either_way(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where (blocker_id=a and blocked_id=b) or (blocker_id=b and blocked_id=a))
$$;

-- profiles: own row, plus rows of active match partners (not blocked)
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.matches m
    where m.status = 'active'
      and ((m.user_a = auth.uid() and m.user_b = profiles.id) or (m.user_b = auth.uid() and m.user_a = profiles.id))
      and not public.blocked_either_way(auth.uid(), profiles.id)
  )
);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

-- verifications: read own + match partners'; NO client write policy at all
drop policy if exists "verifications_read" on public.verifications;
create policy "verifications_read" on public.verifications for select to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.matches m where m.status='active'
             and ((m.user_a=auth.uid() and m.user_b=verifications.user_id) or (m.user_b=auth.uid() and m.user_a=verifications.user_id)))
);

drop policy if exists "preferences_own" on public.preferences;
create policy "preferences_own" on public.preferences for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "settings_own" on public.settings;
create policy "settings_own" on public.settings for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- likes: sender can read own; inserts only via like_profile()
drop policy if exists "likes_own_read" on public.likes;
create policy "likes_own_read" on public.likes for select to authenticated using (from_user = auth.uid());
drop policy if exists "passes_own" on public.passes;
create policy "passes_own" on public.passes for all to authenticated
using (from_user = auth.uid()) with check (from_user = auth.uid());

drop policy if exists "matches_participant_read" on public.matches;
create policy "matches_participant_read" on public.matches for select to authenticated
using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists "messages_participant_read" on public.messages;
create policy "messages_participant_read" on public.messages for select to authenticated
using (public.is_match_participant(match_id));
drop policy if exists "messages_participant_insert" on public.messages;
create policy "messages_participant_insert" on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (select 1 from public.matches m where m.id = match_id and m.status = 'active'
              and (m.user_a = auth.uid() or m.user_b = auth.uid())
              and not public.blocked_either_way(m.user_a, m.user_b))
);

drop policy if exists "blocks_own" on public.blocks;
create policy "blocks_own" on public.blocks for all to authenticated
using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

drop policy if exists "reports_own_read" on public.reports;
create policy "reports_own_read" on public.reports for select to authenticated using (reporter_id = auth.uid());
drop policy if exists "reports_own_insert" on public.reports;
create policy "reports_own_insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists "verreq_own" on public.verification_requests;
create policy "verreq_own" on public.verification_requests for all to authenticated
using (requester_id = auth.uid()) with check (requester_id = auth.uid());

drop policy if exists "calls_participant" on public.call_logs;
create policy "calls_participant" on public.call_logs for all to authenticated
using (public.is_match_participant(match_id)) with check (caller_id = auth.uid() and public.is_match_participant(match_id));

drop policy if exists "journey_own" on public.marriage_journeys;
create policy "journey_own" on public.marriage_journeys for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- advisory
drop policy if exists "packages_read" on public.advisory_packages;
create policy "packages_read" on public.advisory_packages for select to authenticated using (active);
drop policy if exists "advisory_own_read" on public.advisory_requests;
create policy "advisory_own_read" on public.advisory_requests for select to authenticated using (user_id = auth.uid());
drop policy if exists "advisory_own_insert" on public.advisory_requests;
create policy "advisory_own_insert" on public.advisory_requests for insert to authenticated
with check (user_id = auth.uid());                    -- price/status are overwritten by trigger
drop policy if exists "advisory_own_cancel" on public.advisory_requests;
create policy "advisory_own_cancel" on public.advisory_requests for update to authenticated
using (user_id = auth.uid() and status in ('new','awaiting_payment'))
with check (user_id = auth.uid() and status in ('awaiting_payment','cancelled'));
drop policy if exists "advisory_docs_own" on public.advisory_documents;
create policy "advisory_docs_own" on public.advisory_documents for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and exists (select 1 from public.advisory_requests r where r.id = request_id and r.user_id = auth.uid()));
drop policy if exists "payments_own_read" on public.payments;
create policy "payments_own_read" on public.payments for select to authenticated using (user_id = auth.uid());
-- payments are inserted/updated only by edge functions (service role)

-- ---------------------------------------------------------------------
-- RPC: discovery (server-side filtering, returns age not birth_date)
-- ---------------------------------------------------------------------
create or replace function public.discover_candidates(max_results int default 20)
returns table (
  id uuid, name text, age int, gender text, country text, city text, lang text,
  intent text, children_plan text, family_role text, relocation text,
  occupation text, bio text, bio_translations jsonb, prompts jsonb, compat jsonb,
  languages text[], photo_path text, selfie_verified boolean, identity_verified boolean, phone_verified boolean
)
language plpgsql stable security definer set search_path = public as $$
declare me public.profiles; pref public.preferences;
begin
  select * into me from public.profiles where profiles.id = auth.uid();
  if not found then return; end if;
  select * into pref from public.preferences where user_id = auth.uid();
  return query
  select p.id, p.first_name, public.age_of(p.birth_date), p.gender, p.country, p.city, p.lang,
         p.intent, p.children_plan, p.family_role, p.relocation,
         p.occupation, p.bio, p.bio_translations, p.prompts, p.compat,
         p.languages, p.photo_path,
         coalesce(v.selfie_verified,false), coalesce(v.identity_verified,false), coalesce(v.phone_verified,false)
  from public.profiles p
  left join public.verifications v on v.user_id = p.id
  where p.id <> me.id
    and p.discoverable and p.profile_complete and p.birth_date is not null
    -- gender both ways
    and (me.seeking is null or me.seeking = 'Fark etmez' or p.gender = me.seeking)
    and (p.seeking is null or p.seeking = 'Fark etmez' or me.gender = p.seeking)
    -- age dealbreaker
    and (pref.user_id is null or coalesce((pref.dealbreakers->>'age')::boolean,true) = false
         or public.age_of(p.birth_date) between pref.min_age and pref.max_age)
    -- intent dealbreaker
    and (pref.user_id is null or coalesce((pref.dealbreakers->>'intent')::boolean,false) = false
         or pref.intent is null or pref.intent = 'Fark etmez' or p.intent = pref.intent)
    -- children dealbreaker
    and (pref.user_id is null or coalesce((pref.dealbreakers->>'children')::boolean,false) = false
         or pref.children_plan is null or pref.children_plan = 'Fark etmez' or p.children_plan = pref.children_plan)
    -- region dealbreaker
    and (pref.user_id is null or coalesce((pref.dealbreakers->>'region')::boolean,false) = false
         or pref.region_scope = 'Global'
         or (pref.region_scope = 'Ülkem' and p.country = me.country)
         or (pref.region_scope = 'Şehrim' and p.country = me.country and p.city = me.city))
    -- verified only
    and (pref.user_id is null or pref.verified_only = false or coalesce(v.selfie_verified,false))
    -- blocks both ways, passes, likes, existing matches
    and not public.blocked_either_way(me.id, p.id)
    and not exists (select 1 from public.passes ps where ps.from_user = me.id and ps.to_user = p.id)
    and not exists (select 1 from public.likes l where l.from_user = me.id and l.to_user = p.id)
    and not exists (select 1 from public.matches m where m.user_a = least(me.id,p.id) and m.user_b = greatest(me.id,p.id))
  order by coalesce(v.selfie_verified,false) desc, p.updated_at desc
  limit max_results;
end $$;
revoke all on function public.discover_candidates(int) from public;
grant execute on function public.discover_candidates(int) to authenticated;

-- ---------------------------------------------------------------------
-- RPC: like → match (mutual check server-side)
-- ---------------------------------------------------------------------
create or replace function public.like_profile(target uuid, like_kind text default 'like', like_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare mid uuid; matched boolean := false;
begin
  if target = auth.uid() then raise exception 'cannot like self'; end if;
  if public.blocked_either_way(auth.uid(), target) then raise exception 'blocked'; end if;
  insert into public.likes(from_user,to_user,kind,note) values (auth.uid(), target, like_kind, nullif(like_note,''))
  on conflict (from_user,to_user) do update set kind = excluded.kind, note = coalesce(excluded.note, likes.note);
  if exists (select 1 from public.likes where from_user = target and to_user = auth.uid()) then
    insert into public.matches(user_a,user_b,like_note) values (least(auth.uid(),target), greatest(auth.uid(),target), nullif(like_note,''))
    on conflict (user_a,user_b) do update set status='active'
    returning id into mid;
    matched := true;
  end if;
  return jsonb_build_object('matched', matched, 'match_id', mid);
end $$;
revoke all on function public.like_profile(uuid,text,text) from public;
grant execute on function public.like_profile(uuid,text,text) to authenticated;

-- ---------------------------------------------------------------------
-- RPC: my matches with partner summary
-- ---------------------------------------------------------------------
create or replace function public.my_matches()
returns table (
  match_id uuid, matched_at timestamptz, like_note text,
  id uuid, name text, age int, gender text, country text, city text, lang text,
  intent text, children_plan text, family_role text, relocation text, occupation text,
  bio text, bio_translations jsonb, prompts jsonb, compat jsonb, languages text[], photo_path text,
  selfie_verified boolean, identity_verified boolean, phone_verified boolean,
  last_message_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select m.id, m.created_at, m.like_note,
         p.id, p.first_name, public.age_of(p.birth_date), p.gender, p.country, p.city, p.lang,
         p.intent, p.children_plan, p.family_role, p.relocation, p.occupation,
         p.bio, p.bio_translations, p.prompts, p.compat, p.languages, p.photo_path,
         coalesce(v.selfie_verified,false), coalesce(v.identity_verified,false), coalesce(v.phone_verified,false),
         (select max(created_at) from public.messages x where x.match_id = m.id)
  from public.matches m
  join public.profiles p on p.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  left join public.verifications v on v.user_id = p.id
  where (m.user_a = auth.uid() or m.user_b = auth.uid())
    and m.status = 'active'
    and not public.blocked_either_way(m.user_a, m.user_b)
  order by coalesce((select max(created_at) from public.messages x where x.match_id = m.id), m.created_at) desc
$$;
revoke all on function public.my_matches() from public;
grant execute on function public.my_matches() to authenticated;

-- ---------------------------------------------------------------------
-- RPC: block (also closes match)
-- ---------------------------------------------------------------------
create or replace function public.block_user(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.blocks(blocker_id,blocked_id) values (auth.uid(), target) on conflict do nothing;
  update public.matches set status = 'blocked'
   where user_a = least(auth.uid(),target) and user_b = greatest(auth.uid(),target);
end $$;
revoke all on function public.block_user(uuid) from public;
grant execute on function public.block_user(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RPC: delete own account (cascades everything)
-- ---------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos','profile-photos', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('advisory-docs','advisory-docs', false, 15728640, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

-- profile photos: owner writes into <uid>/..., any authenticated user can read (served via signed URL)
drop policy if exists "photos_owner_write" on storage.objects;
create policy "photos_owner_write" on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos_owner_update" on storage.objects;
create policy "photos_owner_update" on storage.objects for update to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos_owner_delete" on storage.objects;
create policy "photos_owner_delete" on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "photos_read" on storage.objects;
create policy "photos_read" on storage.objects for select to authenticated
using (bucket_id = 'profile-photos');

-- advisory docs: strictly owner only (advisor reads with service role)
drop policy if exists "advisory_docs_owner" on storage.objects;
create policy "advisory_docs_owner" on storage.objects for all to authenticated
using (bucket_id = 'advisory-docs' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'advisory-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='matches') then
    alter publication supabase_realtime add table public.matches;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- NOTES
--  * Selfie / ID verification: write to public.verifications ONLY from an
--    edge function using the service role after the provider callback.
--  * Payments: see supabase/functions/create-checkout and stripe-webhook.
--  * Advisor notification: Database Webhook on advisory_requests INSERT →
--    supabase/functions/advisory-notify.
-- ---------------------------------------------------------------------
