-- =====================================================================
-- Nikah.App — Supabase veritabanı kurulumu (5.5.0)
-- Supabase panelinde: SQL Editor > New query > bu dosyanın tamamını yapıştır > Run.
-- Tekrar çalıştırmak güvenlidir; mevcut verileri silmez.
-- =====================================================================

-- ---------- 1. Ayarlar (Table Editor'dan değiştirilebilir) ----------
create table if not exists public.app_settings (
  id boolean primary key default true check (id),
  founder_limit int not null default 500,
  founder_discount_pct int not null default 30 check (founder_discount_pct between 0 and 90),
  payments_enabled boolean not null default false
);
insert into public.app_settings (id) values (true) on conflict (id) do nothing;

-- ---------- 2. Tablolar ----------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),   -- üyelerde auth.users.id ile aynıdır; örnek profillerde bağımsızdır
  kind text not null default 'member' check (kind in ('member','team','showcase')),
  first_name text not null default '' check (char_length(first_name) <= 60),
  last_name text not null default '' check (char_length(last_name) <= 60),
  birth_date date,
  gender text, seeking text, country text, city text,
  lang text default 'tr',
  intent text, children_plan text, family_role text, relocation text,
  occupation text check (occupation is null or char_length(occupation) <= 120),
  education text check (education is null or char_length(education) <= 120),
  bio text check (bio is null or char_length(bio) <= 1000),
  bio_translations jsonb not null default '{}'::jsonb,
  prompts jsonb not null default '[]'::jsonb,
  compat jsonb not null default '{}'::jsonb,
  languages text[] not null default '{}',
  photo_path text,
  phone text,
  discoverable boolean not null default true,
  profile_complete boolean not null default false,
  onboarding_step int not null default 1,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  age_confirmed boolean not null default false,
  legal_version text,
  legal_accepted_at timestamptz,
  consent_special_data boolean not null default false,
  founder boolean not null default false,
  founder_no int unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists profiles_discover_idx on public.profiles (profile_complete, discoverable, gender);

create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  min_age int not null default 18 check (min_age >= 18),
  max_age int not null default 99,
  region_scope text not null default 'Global',
  intent text, children_plan text,
  verified_only boolean not null default false,
  dealbreakers jsonb not null default '{}'::jsonb
);

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'tr',
  translation boolean not null default true,
  notifications boolean not null default true,
  quality_mode boolean not null default true,
  verified_chats_only boolean not null default false,
  photo_privacy boolean not null default true,
  safety_checkin boolean not null default true,
  trusted_contact text check (trusted_contact is null or char_length(trusted_contact) <= 200)
);

-- Doğrulama sonuçları: yalnızca yönetici / doğrulama servisi yazar, kullanıcı sadece okur.
create table if not exists public.verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selfie_verified boolean not null default false,
  identity_verified boolean not null default false,
  phone_verified boolean not null default false,
  email_verified boolean not null default false,
  last_status text,
  updated_at timestamptz not null default now()
);
create table if not exists public.verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_session_id text,
  status text not null default 'Not Started',
  created_at timestamptz not null default now()
);
create index if not exists verification_sessions_user_idx on public.verification_sessions (user_id, created_at desc);

create table if not exists public.marriage_journeys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stage int not null default 0 check (stage between 0 and 6),
  documents jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.likes (
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'like' check (kind in ('like','super')),
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now(),
  primary key (from_user, to_user)
);
create index if not exists likes_to_idx on public.likes (to_user);

create table if not exists public.passes (
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  unique (user_a, user_b),
  check (user_a < user_b)
);
create index if not exists matches_b_idx on public.matches (user_b);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists messages_match_idx on public.messages (match_id, created_at);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

-- Şikâyetler hesap silinse de saklanır (kimlik alanları boşalır).
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  reported_id uuid references public.profiles(id) on delete set null,
  reason text not null default 'user_report' check (char_length(reason) <= 60),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.verification_requests (
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (requester_id, target_id)
);

create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  caller_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('voice','video')),
  created_at timestamptz not null default now()
);

create table if not exists public.advisory_packages (
  code text primary key,
  name_key text not null,
  price_cents int not null check (price_cents >= 0),
  currency text not null default 'USD',
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order int not null default 0
);
insert into public.advisory_packages (code, name_key, price_cents, currency, features, sort_order) values
 ('basic','basic',14900,'USD','["feat_checklist","feat_doc_review","feat_email_support"]',1),
 ('full','full_support',39900,'USD','["feat_checklist","feat_doc_review","feat_sworn_translation","feat_apostille_guidance","feat_video_consult"]',2),
 ('vip','vip',89900,'USD','["feat_checklist","feat_doc_review","feat_sworn_translation","feat_apostille_guidance","feat_video_consult","feat_dedicated_advisor","feat_priority"]',3)
on conflict (code) do nothing;

create table if not exists public.advisory_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_code text not null references public.advisory_packages(code),
  list_price_cents int not null default 0,
  discount_pct int not null default 0,
  price_cents int not null default 0,
  currency text not null default 'USD',
  status text not null default 'new' check (status in ('new','awaiting_payment','paid','in_progress','completed','cancelled')),
  contact_email text, contact_phone text, contact_whatsapp text,
  country_from text, country_to text,
  notes text check (notes is null or char_length(notes) <= 2000),
  match_id uuid references public.matches(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists advisory_requests_user_idx on public.advisory_requests (user_id, created_at desc);

create table if not exists public.advisory_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.advisory_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,
  storage_path text not null,
  original_name text,
  created_at timestamptz not null default now()
);

-- ---------- 3. Tetikleyiciler ----------
-- Profil koruması: kullanıcı kendi rozetini (ekip / kurucu) değiştiremez, 18 yaş altı kayıt olamaz;
-- profilini ilk tamamlayan üyeler kurucu üye numarası alır.
create or replace function public.profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim int; n int;
begin
  new.updated_at := now();
  if auth.uid() is not null then                       -- uygulamadan gelen istek (yönetici değil)
    if tg_op = 'INSERT' then
      new.kind := 'member'; new.founder := false; new.founder_no := null;
    else
      new.id := old.id; new.kind := old.kind; new.founder := old.founder; new.founder_no := old.founder_no; new.created_at := old.created_at;
    end if;
    if new.birth_date is not null and new.birth_date > (current_date - interval '18 years')::date then
      raise exception 'Nikah.App is only for people aged 18 and over';
    end if;
  end if;
  if new.kind = 'member' and new.profile_complete and not new.founder
     and (tg_op = 'INSERT' or not old.profile_complete) then
    perform pg_advisory_xact_lock(471100);
    select founder_limit into lim from app_settings;
    select count(*) into n from profiles where founder;
    if n < coalesce(lim, 0) then new.founder := true; new.founder_no := n + 1; end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.profiles_guard();

-- Danışmanlık talebi: fiyat ve durum sunucuda belirlenir (kurucu üye indirimi dahil).
create or replace function public.advisory_requests_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare pkg advisory_packages; cfg app_settings; is_founder boolean;
begin
  if tg_op = 'INSERT' then
    select * into pkg from advisory_packages where code = new.package_code and active;
    if not found then raise exception 'Unknown advisory package'; end if;
    select * into cfg from app_settings;
    if auth.uid() is not null then
      new.user_id := auth.uid();
      select coalesce(p.founder, false) into is_founder from profiles p where p.id = auth.uid();
      new.list_price_cents := pkg.price_cents;
      new.discount_pct := case when coalesce(is_founder, false) then coalesce(cfg.founder_discount_pct, 0) else 0 end;
      new.price_cents := round(pkg.price_cents * (100 - new.discount_pct) / 100.0);
      new.currency := pkg.currency;
      new.status := case when coalesce(cfg.payments_enabled, false) then 'awaiting_payment' else 'new' end;
      new.created_at := now();
    end if;
    return new;
  end if;
  if auth.uid() is not null then                       -- kullanıcı yalnızca iptal edebilir
    if new.status = 'cancelled' and old.status in ('new','awaiting_payment') then
      old.status := 'cancelled'; return old;
    end if;
    raise exception 'Only cancelling an unpaid request is allowed';
  end if;
  return new;
end $$;
drop trigger if exists advisory_requests_guard on public.advisory_requests;
create trigger advisory_requests_guard before insert or update on public.advisory_requests
  for each row execute function public.advisory_requests_guard();

create or replace function public.messages_touch_match() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update matches set last_message_at = new.created_at where id = new.match_id;
  return new;
end $$;
drop trigger if exists messages_touch_match on public.messages;
create trigger messages_touch_match after insert on public.messages
  for each row execute function public.messages_touch_match();

-- Kullanıcı Supabase panelinden silinirse profili de silinir.
create or replace function public.handle_user_deleted() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end $$;
drop trigger if exists nikah_on_auth_user_deleted on auth.users;
create trigger nikah_on_auth_user_deleted after delete on auth.users
  for each row execute function public.handle_user_deleted();

-- ---------- 4. Yardımcı işlevler ----------
create or replace function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create or replace function public.is_match_member(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from matches where id = m and auth.uid() in (user_a, user_b));
$$;

create or replace function public.can_message(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from matches x where x.id = m and auth.uid() in (x.user_a, x.user_b)
                 and not public.is_blocked_between(x.user_a, x.user_b));
$$;

-- Fotoğraf görünürlüğü: sahibi, eşleşilen kişi ya da fotoğraf gizliliği kapalı olan profiller.
create or replace function public.can_view_photo(owner_id text) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    owner_id = auth.uid()::text
    or exists (select 1 from settings s where s.user_id::text = owner_id and not s.photo_privacy)
    or exists (select 1 from matches x where (x.user_a::text = owner_id and x.user_b = auth.uid())
                                           or (x.user_b::text = owner_id and x.user_a = auth.uid()))
  ) and not exists (select 1 from blocks b where (b.blocker_id::text = owner_id and b.blocked_id = auth.uid())
                                             or (b.blocked_id::text = owner_id and b.blocker_id = auth.uid()));
$$;

-- ---------- 5. Uygulamanın çağırdığı işlevler ----------
drop function if exists public.discover_candidates(int);
create function public.discover_candidates(max_results int default 20)
returns table (id uuid, kind text, name text, age int, gender text, lang text, country text, city text,
  intent text, children_plan text, family_role text, relocation text, occupation text, languages text[],
  compat jsonb, bio text, bio_translations jsonb, prompts jsonb,
  selfie_verified boolean, identity_verified boolean, phone_verified boolean,
  photo_path text, photo_blur boolean, match_id uuid, like_note text, last_message_at timestamptz)
language sql stable security definer set search_path = public as $$
  with me as (select p.* from profiles p where p.id = auth.uid() and p.profile_complete),
       pref as (select pr.* from preferences pr where pr.user_id = auth.uid())
  select p.id, p.kind, p.first_name, date_part('year', age(p.birth_date))::int, p.gender, p.lang, p.country, p.city,
         p.intent, p.children_plan, p.family_role, p.relocation, p.occupation, p.languages,
         p.compat, p.bio, p.bio_translations, p.prompts,
         coalesce(v.selfie_verified, false), coalesce(v.identity_verified, false), coalesce(v.phone_verified, false),
         p.photo_path, (p.kind = 'member' and coalesce(s.photo_privacy, true)),
         null::uuid, null::text, null::timestamptz
  from me
  join profiles p on p.id <> me.id and p.profile_complete and p.discoverable
  left join pref on true
  left join verifications v on v.user_id = p.id
  left join settings s on s.user_id = p.id
  where (p.seeking is null or p.seeking = 'Fark etmez' or p.seeking = me.gender)
    and (me.seeking is null or me.seeking = 'Fark etmez' or p.gender = me.seeking)
    and not exists (select 1 from passes x where x.from_user = me.id and x.to_user = p.id)
    and not exists (select 1 from likes  x where x.from_user = me.id and x.to_user = p.id)
    and not public.is_blocked_between(me.id, p.id)
    and (p.kind = 'team' or (
          (not coalesce(pref.verified_only, false) or coalesce(v.selfie_verified, false))
      and (not coalesce((pref.dealbreakers->>'age')::boolean, false) or p.birth_date is null
           or date_part('year', age(p.birth_date)) between pref.min_age and pref.max_age)
      and (not coalesce((pref.dealbreakers->>'intent')::boolean, false) or pref.intent is null
           or pref.intent = 'Fark etmez' or p.intent = pref.intent)
      and (not coalesce((pref.dealbreakers->>'children')::boolean, false) or pref.children_plan is null
           or pref.children_plan = 'Fark etmez' or p.children_plan = pref.children_plan)
      and (not coalesce((pref.dealbreakers->>'region')::boolean, false)
           or pref.region_scope = 'Global'
           or (pref.region_scope = 'Ülkem'  and p.country = me.country)
           or (pref.region_scope = 'Şehrim' and p.country = me.country and p.city = me.city))))
  order by case p.kind when 'member' then 0 when 'team' then 1 else 2 end,
           coalesce(v.selfie_verified, false) desc, p.created_at desc
  limit greatest(1, least(coalesce(max_results, 20), 50));
$$;

drop function if exists public.my_matches();
create function public.my_matches()
returns table (id uuid, kind text, name text, age int, gender text, lang text, country text, city text,
  intent text, children_plan text, family_role text, relocation text, occupation text, languages text[],
  compat jsonb, bio text, bio_translations jsonb, prompts jsonb,
  selfie_verified boolean, identity_verified boolean, phone_verified boolean,
  photo_path text, photo_blur boolean, match_id uuid, like_note text, last_message_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.kind, p.first_name, date_part('year', age(p.birth_date))::int, p.gender, p.lang, p.country, p.city,
         p.intent, p.children_plan, p.family_role, p.relocation, p.occupation, p.languages,
         p.compat, p.bio, p.bio_translations, p.prompts,
         coalesce(v.selfie_verified, false), coalesce(v.identity_verified, false), coalesce(v.phone_verified, false),
         p.photo_path, false, m.id, l.note, m.last_message_at
  from matches m
  join profiles p on p.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  left join verifications v on v.user_id = p.id
  left join likes l on l.from_user = p.id and l.to_user = auth.uid()
  where auth.uid() in (m.user_a, m.user_b)
    and not public.is_blocked_between(m.user_a, m.user_b)
  order by coalesce(m.last_message_at, m.created_at) desc;
$$;

create or replace function public.like_profile(target uuid, like_kind text default 'like', like_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); t profiles; mid uuid; a uuid; b uuid;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if target is null or target = me then raise exception 'Invalid profile'; end if;
  if not exists (select 1 from profiles where id = me and profile_complete) then raise exception 'Complete your profile first'; end if;
  select * into t from profiles where id = target and profile_complete;
  if not found then raise exception 'Profile not found'; end if;
  if t.kind = 'showcase' then return jsonb_build_object('matched', false, 'showcase', true); end if;
  if public.is_blocked_between(me, target) then raise exception 'Profile not available'; end if;
  insert into likes (from_user, to_user, kind, note)
    values (me, target, case when like_kind = 'super' then 'super' else 'like' end, nullif(left(like_note, 280), ''))
    on conflict (from_user, to_user) do update set kind = excluded.kind, note = excluded.note;
  if t.kind = 'team' or exists (select 1 from likes where from_user = target and to_user = me) then
    a := least(me, target); b := greatest(me, target);
    insert into matches (user_a, user_b) values (a, b) on conflict (user_a, user_b) do nothing;
    select m.id into mid from matches m where m.user_a = a and m.user_b = b;
    return jsonb_build_object('matched', true, 'match_id', mid);
  end if;
  return jsonb_build_object('matched', false, 'match_id', null);
end $$;

create or replace function public.block_user(target uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if target is null or target = auth.uid() then raise exception 'Invalid profile'; end if;
  insert into blocks (blocker_id, blocked_id) values (auth.uid(), target) on conflict do nothing;
  return true;
end $$;

create or replace function public.community_stats() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'members',        (select count(*) from profiles where kind = 'member' and profile_complete),
    'new_this_week',  (select count(*) from profiles where kind = 'member' and profile_complete and created_at > now() - interval '7 days'),
    'verified',       (select count(*) from verifications where selfie_verified),
    'team',           (select count(*) from profiles where kind = 'team' and profile_complete),
    'showcase',       (select count(*) from profiles where kind = 'showcase'),
    'founders_left',  greatest((select founder_limit from app_settings) - (select count(*) from profiles where founder), 0),
    'founder_discount_pct', (select founder_discount_pct from app_settings));
$$;

-- Hesabı kalıcı olarak siler (profil, eşleşmeler, mesajlar, talepler birlikte silinir).
create or replace function public.delete_my_account() returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in'; end if;
  delete from public.profiles where id = me;
  delete from auth.users where id = me;
  return true;
end $$;

-- ---------- 6. Satır düzeyi güvenlik (RLS) ----------
alter table public.app_settings          enable row level security;
alter table public.profiles              enable row level security;
alter table public.preferences           enable row level security;
alter table public.settings              enable row level security;
alter table public.verifications         enable row level security;
alter table public.verification_sessions enable row level security;
alter table public.marriage_journeys     enable row level security;
alter table public.likes                 enable row level security;
alter table public.passes                enable row level security;
alter table public.matches               enable row level security;
alter table public.messages              enable row level security;
alter table public.blocks                enable row level security;
alter table public.reports               enable row level security;
alter table public.verification_requests enable row level security;
alter table public.call_logs             enable row level security;
alter table public.advisory_packages     enable row level security;
alter table public.advisory_requests     enable row level security;
alter table public.advisory_documents    enable row level security;

-- Başka üyelerin profilleri yalnızca yukarıdaki işlevler üzerinden, sınırlı alanlarla görünür.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists preferences_own on public.preferences;
create policy preferences_own on public.preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists settings_own on public.settings;
create policy settings_own on public.settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists journeys_own on public.marriage_journeys;
create policy journeys_own on public.marriage_journeys for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists verifications_select_own on public.verifications;
create policy verifications_select_own on public.verifications for select to authenticated using (user_id = auth.uid());
drop policy if exists verification_sessions_select_own on public.verification_sessions;
create policy verification_sessions_select_own on public.verification_sessions for select to authenticated using (user_id = auth.uid());

drop policy if exists likes_select_own on public.likes;
create policy likes_select_own on public.likes for select to authenticated using (from_user = auth.uid());
drop policy if exists passes_own on public.passes;
create policy passes_own on public.passes for all to authenticated using (from_user = auth.uid()) with check (from_user = auth.uid());

drop policy if exists matches_select_member on public.matches;
create policy matches_select_member on public.matches for select to authenticated using (auth.uid() in (user_a, user_b));

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages for select to authenticated using (public.is_match_member(match_id));
drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.can_message(match_id));

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks for select to authenticated using (blocker_id = auth.uid());
drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own on public.blocks for delete to authenticated using (blocker_id = auth.uid());

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports for insert to authenticated with check (reporter_id = auth.uid());
drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports for select to authenticated using (reporter_id = auth.uid());

drop policy if exists verification_requests_own on public.verification_requests;
create policy verification_requests_own on public.verification_requests for all to authenticated
  using (requester_id = auth.uid()) with check (requester_id = auth.uid());

drop policy if exists call_logs_insert_member on public.call_logs;
create policy call_logs_insert_member on public.call_logs for insert to authenticated
  with check (caller_id = auth.uid() and public.is_match_member(match_id));
drop policy if exists call_logs_select_own on public.call_logs;
create policy call_logs_select_own on public.call_logs for select to authenticated using (caller_id = auth.uid());

drop policy if exists advisory_packages_read on public.advisory_packages;
create policy advisory_packages_read on public.advisory_packages for select to anon, authenticated using (active);

drop policy if exists advisory_requests_select_own on public.advisory_requests;
create policy advisory_requests_select_own on public.advisory_requests for select to authenticated using (user_id = auth.uid());
drop policy if exists advisory_requests_insert_own on public.advisory_requests;
create policy advisory_requests_insert_own on public.advisory_requests for insert to authenticated with check (user_id = auth.uid());
drop policy if exists advisory_requests_update_own on public.advisory_requests;
create policy advisory_requests_update_own on public.advisory_requests for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists advisory_documents_select_own on public.advisory_documents;
create policy advisory_documents_select_own on public.advisory_documents for select to authenticated using (user_id = auth.uid());
drop policy if exists advisory_documents_insert_own on public.advisory_documents;
create policy advisory_documents_insert_own on public.advisory_documents for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.advisory_requests r where r.id = request_id and r.user_id = auth.uid()));

-- ---------- 7. Yetkiler ----------
grant usage on schema public to anon, authenticated;
grant select on public.advisory_packages to anon, authenticated;
grant select, insert, update on public.profiles, public.preferences, public.settings, public.marriage_journeys to authenticated;
grant select on public.verifications, public.verification_sessions, public.likes, public.matches to authenticated;
grant select, insert, update, delete on public.passes to authenticated;
grant select, insert on public.messages, public.reports, public.call_logs, public.advisory_documents to authenticated;
grant select, delete on public.blocks to authenticated;
grant select, insert, update on public.verification_requests, public.advisory_requests to authenticated;

revoke execute on function public.discover_candidates(int), public.my_matches(), public.like_profile(uuid, text, text),
  public.block_user(uuid), public.delete_my_account(), public.community_stats(),
  public.is_blocked_between(uuid, uuid), public.is_match_member(uuid), public.can_message(uuid), public.can_view_photo(text) from public, anon;
grant execute on function public.discover_candidates(int), public.my_matches(), public.like_profile(uuid, text, text),
  public.block_user(uuid), public.delete_my_account(),
  public.is_match_member(uuid), public.can_message(uuid), public.can_view_photo(text) to authenticated;
grant execute on function public.community_stats() to anon, authenticated;
-- Sunucu tarafı (service_role) her şeye erişebilir; ileride eklenecek sunucu işlevleri için.
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ---------- 8. Dosya depolama ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('profile-photos', 'profile-photos', false, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('advisory-docs',  'advisory-docs',  false, 15728640, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists nikah_photos_read on storage.objects;
create policy nikah_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'profile-photos' and public.can_view_photo((storage.foldername(name))[1]));
drop policy if exists nikah_photos_insert on storage.objects;
create policy nikah_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists nikah_photos_update on storage.objects;
create policy nikah_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists nikah_photos_delete on storage.objects;
create policy nikah_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists nikah_docs_read on storage.objects;
create policy nikah_docs_read on storage.objects for select to authenticated
  using (bucket_id = 'advisory-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists nikah_docs_insert on storage.objects;
create policy nikah_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'advisory-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists nikah_docs_delete on storage.objects;
create policy nikah_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'advisory-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 9. Canlı mesajlaşma ----------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ---------- 10. Örnek profiller ----------
-- Gerçek kişi değildir; uygulamada "Örnek profil" etiketiyle görünür, beğenilemez ve mesaj alamaz.
-- Kaldırmak için:  delete from public.profiles where kind = 'showcase';
insert into public.profiles (id, kind, first_name, birth_date, gender, lang, country, city, intent, children_plan, family_role, relocation, occupation, languages, compat, bio, bio_translations, prompts, photo_path, discoverable, profile_complete, age_confirmed) values
('00000000-0000-4000-8000-000000000001','showcase','Ayu',make_date(extract(year from current_date)::int-31,1,15),'Kadın','id','Endonezya','Bandung','Evliliğe hazırım','İstiyorum','Çok önemli','Uygun','Mimar',array['Bahasa Indonesia','English'],'{"communication":"direct","planning":"planned","social":"balanced","conflict":"calm","money":"planned"}'::jsonb,'Saya dekat dengan keluarga. Saya suka bepergian, kopi, dan akhir pekan yang tenang.','{"tr":"Aile odaklıyım. Seyahat etmeyi, kahve ve sakin hafta sonlarını seviyorum.","en":"I am family-oriented. I enjoy travel, coffee and calm weekends.","zh":"我重视家庭，喜欢旅行、咖啡和安静的周末。","th":"ฉันให้ความสำคัญกับครอบครัว ชอบท่องเที่ยว กาแฟ และวันหยุดที่เงียบสงบ"}'::jsonb,'[["prompt_marriage",{"tr":"Saygı, açık iletişim ve iki ailenin de huzurlu hissetmesi.","id":"Rasa hormat, komunikasi terbuka, dan kedua keluarga merasa nyaman.","en":"Respect, open communication and both families feeling at ease.","zh":"尊重、坦诚沟通，以及双方家庭都感到安心。","th":"ความเคารพ การสื่อสารที่เปิดใจ และทั้งสองครอบครัวรู้สึกสบายใจ"}],["prompt_weekend",{"tr":"Yeni bir kahveci, kısa bir yürüyüş ve aileyle akşam yemeği.","id":"Mencoba kedai kopi baru, jalan santai, lalu makan malam bersama keluarga.","en":"A new coffee shop, a short walk and dinner with family.","zh":"一家新咖啡馆、一次散步，再和家人共进晚餐。","th":"ร้านกาแฟใหม่ เดินเล่นสั้นๆ แล้วทานข้าวเย็นกับครอบครัว"}]]'::jsonb,'/assets/showcase/p1.svg',true,true,true),
('00000000-0000-4000-8000-000000000002','showcase','Elif',make_date(extract(year from current_date)::int-34,1,15),'Kadın','tr','Türkiye','İzmir','Evliliğe hazırım','İstiyorum','Önemli','Kararsız','Diş Hekimi',array['Türkçe','English'],'{"communication":"gentle","planning":"planned","social":"home","conflict":"calm","money":"planned"}'::jsonb,'Hayatı paylaşabileceğim ciddi, sakin ve saygılı bir ilişki arıyorum.','{"id":"Saya mencari hubungan serius, tenang, dan saling menghormati untuk berbagi hidup.","en":"I am looking for a serious, calm and respectful relationship to share life with.","zh":"我希望找到一段认真、平和、彼此尊重并能共同生活的关系。","th":"ฉันมองหาความสัมพันธ์ที่จริงจัง สงบ และให้เกียรติกันเพื่อใช้ชีวิตร่วมกัน"}'::jsonb,'[["prompt_value",{"tr":"Güven ve sözünün arkasında durmak.","id":"Kepercayaan dan menepati janji.","en":"Trust and keeping your word.","zh":"信任，以及言出必行。","th":"ความไว้วางใจและการรักษาคำพูด"}]]'::jsonb,'/assets/showcase/p2.svg',true,true,true),
('00000000-0000-4000-8000-000000000003','showcase','Sari',make_date(extract(year from current_date)::int-29,1,15),'Kadın','id','Endonezya','Jakarta','Evliliğe hazırım','İstiyorum','Çok önemli','Uygun','Öğretmen',array['Bahasa Indonesia','English'],'{"communication":"direct","planning":"flexible","social":"balanced","conflict":"space","money":"planned"}'::jsonb,'Komunikasi terbuka, kesetiaan, dan keluarga sangat penting bagi saya.','{"tr":"Açık iletişim, sadakat ve aile benim için önemli.","en":"Open communication, loyalty and family matter a lot to me.","zh":"坦诚沟通、忠诚和家庭对我很重要。","th":"การสื่อสารที่เปิดใจ ความซื่อสัตย์ และครอบครัวสำคัญสำหรับฉัน"}'::jsonb,'[["prompt_marriage",{"tr":"Birbirinin hayatını kolaylaştıran iki iyi takım arkadaşı olmak.","id":"Menjadi dua rekan satu tim yang saling memudahkan hidup.","en":"Being two good teammates who make life easier for each other.","zh":"成为彼此扶持、让生活更轻松的好队友。","th":"เป็นทีมเดียวกันที่ช่วยให้ชีวิตของกันและกันง่ายขึ้น"}]]'::jsonb,'/assets/showcase/p3.svg',true,true,true),
('00000000-0000-4000-8000-000000000004','showcase','Maya',make_date(extract(year from current_date)::int-36,1,15),'Kadın','en','Malezya','Kuala Lumpur','Sadece tanışıyorum','Kararsız','Önemli','Uygun','Ürün Yöneticisi',array['English','Bahasa Melayu'],'{"communication":"gentle","planning":"flexible","social":"balanced","conflict":"calm","money":"flexible"}'::jsonb,'I believe in friendship and trust first, then more serious steps.','{"tr":"Önce iyi bir arkadaşlık ve güven, sonra ciddi adımlar.","id":"Saya percaya pada persahabatan dan kepercayaan dulu, lalu langkah yang lebih serius.","zh":"我相信先建立友谊和信任，再考虑更认真的下一步。","th":"ฉันเชื่อในการสร้างมิตรภาพและความไว้วางใจก่อน แล้วค่อยก้าวสู่ความจริงจัง"}'::jsonb,'[["prompt_weekend",{"tr":"Yeni bir şehir keşfetmek ve iyi yemek.","id":"Menjelajahi kota baru dan menikmati makanan enak.","en":"Exploring a new city and finding great food.","zh":"探索一座新城市，寻找美食。","th":"สำรวจเมืองใหม่และหาอาหารอร่อยๆ"}]]'::jsonb,'/assets/showcase/p4.svg',true,true,true),
('00000000-0000-4000-8000-000000000005','showcase','Ahmad',make_date(extract(year from current_date)::int-33,1,15),'Erkek','id','Endonezya','Jakarta','Evliliğe hazırım','İstiyorum','Çok önemli','Uygun','Mimar',array['Bahasa Indonesia','English'],'{"communication":"direct","planning":"planned","social":"balanced","conflict":"calm","money":"planned"}'::jsonb,'Saya insinyur, dekat dengan keluarga. Lari pagi dan kopi yang enak memulai hari saya.','{"tr":"Mühendisim, aileme yakınım. Sabah koşusu ve güzel bir kahve günümü başlatır.","en":"I am an engineer, close to my family. A morning run and good coffee start my day.","zh":"我是工程师，重视家庭。晨跑和一杯好咖啡开启我的一天。","th":"ผมเป็นวิศวกร ใกล้ชิดครอบครัว การวิ่งตอนเช้าและกาแฟดีๆ เริ่มต้นวันของผม"}'::jsonb,'[["prompt_marriage",{"tr":"Birbirine dua eden, birbirini büyüten iki kişi.","id":"Dua orang yang saling mendoakan dan saling menumbuhkan.","en":"Two people who pray for each other and help each other grow.","zh":"两个为彼此祈祷、共同成长的人。","th":"คนสองคนที่สวดภาวนาให้กันและช่วยกันเติบโต"}]]'::jsonb,'/assets/showcase/p5.svg',true,true,true),
('00000000-0000-4000-8000-000000000006','showcase','Mehmet',make_date(extract(year from current_date)::int-35,1,15),'Erkek','tr','Türkiye','Ankara','Evliliğe hazırım','İstiyorum','Önemli','Uygun','Öğretmen',array['Türkçe','English'],'{"communication":"gentle","planning":"planned","social":"home","conflict":"calm","money":"planned"}'::jsonb,'Öğretmenim; sakin, düzenli ve aile değerlerine bağlı biriyim.','{"id":"Saya guru; tenang, teratur, dan menjunjung nilai keluarga.","en":"I am a teacher; calm, organised and committed to family values.","zh":"我是老师，性格平和、有条理，重视家庭价值。","th":"ผมเป็นครู ใจเย็น มีระเบียบ และยึดมั่นในคุณค่าครอบครัว"}'::jsonb,'[["prompt_value",{"tr":"Dürüstlük ve sabır.","id":"Kejujuran dan kesabaran.","en":"Honesty and patience.","zh":"诚实与耐心。","th":"ความซื่อสัตย์และความอดทน"}]]'::jsonb,'/assets/showcase/p6.svg',true,true,true),
('00000000-0000-4000-8000-000000000007','showcase','Rizal',make_date(extract(year from current_date)::int-30,1,15),'Erkek','id','Endonezya','Surabaya','Sadece tanışıyorum','Kararsız','Önemli','Uygun','Ürün Yöneticisi',array['Bahasa Indonesia','English'],'{"communication":"direct","planning":"flexible","social":"social","conflict":"talk","money":"flexible"}'::jsonb,'Saya wirausaha dan senang mengenal budaya baru.','{"tr":"Girişimciyim, yeni kültürleri tanımayı seviyorum.","en":"I am an entrepreneur and love getting to know new cultures.","zh":"我是创业者，喜欢了解新的文化。","th":"ผมเป็นผู้ประกอบการ ชอบเรียนรู้วัฒนธรรมใหม่ๆ"}'::jsonb,'[["prompt_weekend",{"tr":"Deniz kenarında uzun bir yürüyüş.","id":"Jalan panjang di tepi pantai.","en":"A long walk by the sea.","zh":"在海边长长地散步。","th":"เดินเล่นริมทะเลนานๆ"}]]'::jsonb,'/assets/showcase/p7.svg',true,true,true),
('00000000-0000-4000-8000-000000000008','showcase','Zeynep',make_date(extract(year from current_date)::int-28,1,15),'Kadın','tr','Türkiye','İstanbul','Evliliğe hazırım','İstiyorum','Çok önemli','Kararsız','Öğretmen',array['Türkçe','English'],'{"communication":"gentle","planning":"planned","social":"home","conflict":"calm","money":"planned"}'::jsonb,'Okul öncesi öğretmeniyim. Sakin bir hayat, güçlü bir aile ve birlikte öğrenmek istiyorum.','{"id":"Saya guru PAUD. Saya ingin hidup tenang, keluarga yang kuat, dan belajar bersama.","en":"I am a preschool teacher. I want a calm life, a strong family and to keep learning together.","zh":"我是幼儿园老师。我想要平静的生活、牢固的家庭，并一起不断学习。","th":"ฉันเป็นครูอนุบาล อยากมีชีวิตที่สงบ ครอบครัวที่เข้มแข็ง และเรียนรู้ไปด้วยกัน"}'::jsonb,'[["prompt_weekend",{"tr":"Kahvaltı, uzun bir yürüyüş ve akşam aileyle yemek.","id":"Sarapan, jalan panjang, dan makan malam bersama keluarga.","en":"Breakfast, a long walk and dinner with family.","zh":"早餐、长时间散步，晚上与家人共进晚餐。","th":"อาหารเช้า เดินเล่นนานๆ และมื้อเย็นกับครอบครัว"}]]'::jsonb,'/assets/showcase/p8.svg',true,true,true),
('00000000-0000-4000-8000-000000000009','showcase','Nadia',make_date(extract(year from current_date)::int-27,1,15),'Kadın','id','Endonezya','Yogyakarta','Evliliğe hazırım','İstiyorum','Çok önemli','Uygun','Diş Hekimi',array['Bahasa Indonesia','English','Türkçe'],'{"communication":"direct","planning":"flexible","social":"balanced","conflict":"talk","money":"planned"}'::jsonb,'Saya sedang belajar bahasa Turki dan menyukai budaya Turki. Nilai yang sama adalah hal utama bagi saya.','{"tr":"Türkçe öğreniyorum ve Türkiye kültürünü seviyorum. Ortak değerler benim için her şeyden önce gelir.","en":"I am learning Turkish and love Turkish culture. Shared values come first for me.","zh":"我正在学习土耳其语，也喜欢土耳其文化。共同的价值观对我最重要。","th":"ฉันกำลังเรียนภาษาตุรกีและชอบวัฒนธรรมตุรกี ค่านิยมร่วมกันสำคัญที่สุดสำหรับฉัน"}'::jsonb,'[["prompt_value",{"tr":"Sabır ve sadakat.","id":"Kesabaran dan kesetiaan.","en":"Patience and loyalty.","zh":"耐心与忠诚。","th":"ความอดทนและความซื่อสัตย์"}]]'::jsonb,'/assets/showcase/p9.svg',true,true,true),
('00000000-0000-4000-8000-000000000010','showcase','Aisyah',make_date(extract(year from current_date)::int-32,1,15),'Kadın','en','Malezya','Johor Bahru','Evliliğe hazırım','Kararsız','Önemli','Uygun','Ürün Yöneticisi',array['Bahasa Melayu','English'],'{"communication":"gentle","planning":"planned","social":"balanced","conflict":"calm","money":"planned"}'::jsonb,'I work in tech. I am looking for an honest, kind partner to grow with.','{"tr":"Yazılım sektöründeyim. Birlikte büyüyebileceğim, dürüst ve nazik bir eş arıyorum.","id":"Saya bekerja di bidang teknologi. Saya mencari pasangan yang jujur dan lembut untuk tumbuh bersama.","zh":"我在科技行业工作。我在寻找一位诚实、善良、能共同成长的伴侣。","th":"ฉันทำงานด้านเทคโนโลยี มองหาคู่ชีวิตที่ซื่อสัตย์และอ่อนโยนเพื่อเติบโตไปด้วยกัน"}'::jsonb,'[["prompt_marriage",{"tr":"Birbirini dinleyen iki kişi.","id":"Dua orang yang saling mendengarkan.","en":"Two people who truly listen to each other.","zh":"两个真正倾听彼此的人。","th":"คนสองคนที่รับฟังกันอย่างแท้จริง"}]]'::jsonb,'/assets/showcase/p10.svg',true,true,true),
('00000000-0000-4000-8000-000000000011','showcase','Emre',make_date(extract(year from current_date)::int-34,1,15),'Erkek','tr','Türkiye','Bursa','Evliliğe hazırım','İstiyorum','Çok önemli','Uygun','Mimar',array['Türkçe','English','Bahasa Indonesia'],'{"communication":"direct","planning":"planned","social":"social","conflict":"talk","money":"planned"}'::jsonb,'Endonezya’da iki yıl çalıştım, kültürü yakından tanıyorum. Aile kurmaya hazırım.','{"id":"Saya pernah bekerja dua tahun di Indonesia dan mengenal budayanya dengan baik. Saya siap membangun keluarga.","en":"I worked in Indonesia for two years and know the culture well. I am ready to build a family.","zh":"我在印尼工作过两年，很了解当地文化。我已准备好组建家庭。","th":"ผมเคยทำงานในอินโดนีเซียสองปีและรู้จักวัฒนธรรมดี ผมพร้อมสร้างครอบครัว"}'::jsonb,'[["prompt_weekend",{"tr":"Pazar sabahı pazar alışverişi ve uzun bir kahvaltı.","id":"Belanja ke pasar Minggu pagi dan sarapan panjang.","en":"A Sunday market run and a long breakfast.","zh":"周日早晨去市场，然后吃一顿悠长的早餐。","th":"ไปตลาดเช้าวันอาทิตย์แล้วกินอาหารเช้านานๆ"}]]'::jsonb,'/assets/showcase/p11.svg',true,true,true),
('00000000-0000-4000-8000-000000000012','showcase','Fajar',make_date(extract(year from current_date)::int-31,1,15),'Erkek','id','Endonezya','Bandung','Evliliğe hazırım','İstiyorum','Önemli','Kararsız','Öğretmen',array['Bahasa Indonesia','English'],'{"communication":"gentle","planning":"flexible","social":"home","conflict":"space","money":"flexible"}'::jsonb,'Saya mengajar di universitas. Buku, alam, dan hidup sederhana.','{"tr":"Üniversitede ders veriyorum. Kitaplar, doğa ve sade bir hayat.","en":"I teach at a university. Books, nature and a simple life.","zh":"我在大学教书。喜欢书籍、自然和简单的生活。","th":"ผมสอนที่มหาวิทยาลัย ชอบหนังสือ ธรรมชาติ และชีวิตเรียบง่าย"}'::jsonb,'[["prompt_value",{"tr":"Şükür ve tevazu.","id":"Rasa syukur dan kerendahan hati.","en":"Gratitude and humility.","zh":"感恩与谦逊。","th":"ความกตัญญูและความถ่อมตน"}]]'::jsonb,'/assets/showcase/p12.svg',true,true,true)
on conflict (id) do nothing;
