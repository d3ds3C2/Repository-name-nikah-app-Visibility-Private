-- =====================================================================
-- Nikah.App 5.2 — Showcase profiles, team profiles, founder members,
-- community stats. Run AFTER schema.sql (idempotent).
-- Showcase profiles are ALWAYS labelled in the UI; they cannot be liked,
-- matched or messaged. Team profiles are real accounts of staff, labelled
-- "Nikah.App team", and auto-accept likes so early users get a real
-- conversation partner.
-- =====================================================================

-- app-wide settings (public read)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings(key,value) values
 ('founder_limit','500'),           -- first N completed profiles become founders
 ('founder_discount_pct','30')      -- advisory discount for founders
on conflict (key) do nothing;
alter table public.app_settings enable row level security;
drop policy if exists "settings_public_read" on public.app_settings;
create policy "settings_public_read" on public.app_settings for select to anon, authenticated using (true);

-- profile kind + founder flag
alter table public.profiles add column if not exists kind text not null default 'member' check (kind in ('member','team'));
alter table public.profiles add column if not exists team_auto_accept boolean not null default true;
alter table public.profiles add column if not exists founder boolean not null default false;
alter table public.profiles add column if not exists founder_no int;
-- kind/founder are set by the operator / triggers only: strip them from client updates
create or replace function public.protect_profile_flags()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' then
    new.kind := old.kind; new.team_auto_accept := old.team_auto_accept;
    new.founder := old.founder; new.founder_no := old.founder_no;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_flags on public.profiles;
create trigger profiles_protect_flags before update on public.profiles
  for each row execute function public.protect_profile_flags();

-- founder assignment when a profile becomes complete
create or replace function public.assign_founder()
returns trigger language plpgsql security definer set search_path = public as $$
declare lim int; n int;
begin
  if new.profile_complete and not coalesce(old.profile_complete,false) and not new.founder then
    select (value#>>'{}')::int into lim from public.app_settings where key='founder_limit';
    select count(*) into n from public.profiles where founder;
    if n < coalesce(lim,0) then new.founder := true; new.founder_no := n+1; end if;
  end if;
  return new;
end $$;
drop trigger if exists profiles_assign_founder on public.profiles;
create trigger profiles_assign_founder before update on public.profiles
  for each row execute function public.assign_founder();

-- founder discount in advisory pricing
alter table public.advisory_requests add column if not exists list_price_cents int;
alter table public.advisory_requests add column if not exists discount_pct int not null default 0;
create or replace function public.set_advisory_price()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.advisory_packages; pct int := 0; is_founder boolean;
begin
  select * into p from public.advisory_packages where code = new.package_code and active;
  if not found then raise exception 'Unknown or inactive package %', new.package_code; end if;
  select founder into is_founder from public.profiles where id = new.user_id;
  if coalesce(is_founder,false) then
    select coalesce((value#>>'{}')::int,0) into pct from public.app_settings where key='founder_discount_pct';
  end if;
  new.list_price_cents := p.price_cents;
  new.discount_pct := pct;
  new.price_cents := round(p.price_cents * (100 - pct) / 100.0);
  new.currency := p.currency;
  new.status := case when new.price_cents = 0 then 'paid' else 'awaiting_payment' end;
  return new;
end $$;

-- showcase profiles: NOT users, no auth row; public display data only
create table if not exists public.showcase_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age int not null check (age >= 18),
  gender text not null check (gender in ('Kadın','Erkek')),
  seeking text not null default 'Fark etmez',
  country text, city text, lang text not null default 'en',
  intent text, children_plan text, family_role text, relocation text, occupation text,
  bio_translations jsonb not null default '{}'::jsonb,   -- {tr,id,en,zh,th}
  prompts jsonb not null default '[]'::jsonb,            -- [[key,{tr,id,en,zh,th}]]
  compat jsonb not null default '{}'::jsonb,
  languages text[] not null default '{}',
  photo_path text,
  active boolean not null default true,
  sort_order int not null default 0
);
alter table public.showcase_profiles enable row level security;
drop policy if exists "showcase_read" on public.showcase_profiles;
create policy "showcase_read" on public.showcase_profiles for select to authenticated using (active);

-- discovery: real members → team → showcase (labelled)
drop function if exists public.discover_candidates(int);
create or replace function public.discover_candidates(max_results int default 20)
returns table (
  id uuid, kind text, name text, age int, gender text, country text, city text, lang text,
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
  (
  select p.id, p.kind, p.first_name, public.age_of(p.birth_date), p.gender, p.country, p.city, p.lang,
         p.intent, p.children_plan, p.family_role, p.relocation,
         p.occupation, p.bio, p.bio_translations, p.prompts, p.compat,
         p.languages, p.photo_path,
         coalesce(v.selfie_verified,false), coalesce(v.identity_verified,false), coalesce(v.phone_verified,false)
  from public.profiles p
  left join public.verifications v on v.user_id = p.id
  where p.id <> me.id
    and p.discoverable and p.profile_complete and p.birth_date is not null
    and (me.seeking is null or me.seeking = 'Fark etmez' or p.gender = me.seeking)
    and (p.seeking is null or p.seeking = 'Fark etmez' or me.gender = p.seeking)
    and (p.kind = 'team' or (   -- team profiles bypass dealbreakers (gender still applies)
         (pref.user_id is null or coalesce((pref.dealbreakers->>'age')::boolean,true) = false
          or public.age_of(p.birth_date) between pref.min_age and pref.max_age)
     and (pref.user_id is null or coalesce((pref.dealbreakers->>'intent')::boolean,false) = false
          or pref.intent is null or pref.intent = 'Fark etmez' or p.intent = pref.intent)
     and (pref.user_id is null or coalesce((pref.dealbreakers->>'children')::boolean,false) = false
          or pref.children_plan is null or pref.children_plan = 'Fark etmez' or p.children_plan = pref.children_plan)
     and (pref.user_id is null or coalesce((pref.dealbreakers->>'region')::boolean,false) = false
          or pref.region_scope = 'Global'
          or (pref.region_scope = 'Ülkem' and p.country = me.country)
          or (pref.region_scope = 'Şehrim' and p.country = me.country and p.city = me.city))
     and (pref.user_id is null or pref.verified_only = false or coalesce(v.selfie_verified,false))
    ))
    and not public.blocked_either_way(me.id, p.id)
    and not exists (select 1 from public.passes ps where ps.from_user = me.id and ps.to_user = p.id)
    and not exists (select 1 from public.likes l where l.from_user = me.id and l.to_user = p.id)
    and not exists (select 1 from public.matches m where m.user_a = least(me.id,p.id) and m.user_b = greatest(me.id,p.id))
  order by (p.kind='member') desc, coalesce(v.selfie_verified,false) desc, p.updated_at desc
  limit max_results
  )
  union all
  (
  select s.id, 'showcase', s.name, s.age, s.gender, s.country, s.city, s.lang,
         s.intent, s.children_plan, s.family_role, s.relocation, s.occupation,
         null::text, s.bio_translations, s.prompts, s.compat, s.languages, s.photo_path, false, false, false
  from public.showcase_profiles s
  where s.active
    and (me.seeking is null or me.seeking = 'Fark etmez' or s.gender = me.seeking)
    and (s.seeking = 'Fark etmez' or me.gender = s.seeking)
    and not exists (select 1 from public.passes ps where ps.from_user = me.id and ps.to_user = s.id)
  order by s.sort_order
  limit max_results
  );
end $$;
revoke all on function public.discover_candidates(int) from public;
grant execute on function public.discover_candidates(int) to authenticated;

-- passes may reference showcase ids → drop FK on to_user
alter table public.passes drop constraint if exists passes_to_user_fkey;

-- likes: refuse showcase, auto-accept team
create or replace function public.like_profile(target uuid, like_kind text default 'like', like_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare mid uuid; matched boolean := false; tkind text; tauto boolean;
begin
  if target = auth.uid() then raise exception 'cannot like self'; end if;
  if exists (select 1 from public.showcase_profiles where id = target) then
    return jsonb_build_object('matched', false, 'showcase', true);
  end if;
  select kind, team_auto_accept into tkind, tauto from public.profiles where id = target;
  if tkind is null then raise exception 'profile not found'; end if;
  if public.blocked_either_way(auth.uid(), target) then raise exception 'blocked'; end if;
  insert into public.likes(from_user,to_user,kind,note) values (auth.uid(), target, like_kind, nullif(like_note,''))
  on conflict (from_user,to_user) do update set kind = excluded.kind, note = coalesce(excluded.note, likes.note);
  if (tkind = 'team' and coalesce(tauto,true))
     or exists (select 1 from public.likes where from_user = target and to_user = auth.uid()) then
    insert into public.matches(user_a,user_b,like_note) values (least(auth.uid(),target), greatest(auth.uid(),target), nullif(like_note,''))
    on conflict (user_a,user_b) do update set status='active'
    returning id into mid;
    matched := true;
  end if;
  return jsonb_build_object('matched', matched, 'match_id', mid);
end $$;

-- my_matches: expose partner kind
drop function if exists public.my_matches();
create or replace function public.my_matches()
returns table (
  match_id uuid, matched_at timestamptz, like_note text,
  id uuid, kind text, name text, age int, gender text, country text, city text, lang text,
  intent text, children_plan text, family_role text, relocation text, occupation text,
  bio text, bio_translations jsonb, prompts jsonb, compat jsonb, languages text[], photo_path text,
  selfie_verified boolean, identity_verified boolean, phone_verified boolean,
  last_message_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select m.id, m.created_at, m.like_note,
         p.id, p.kind, p.first_name, public.age_of(p.birth_date), p.gender, p.country, p.city, p.lang,
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

-- community stats: REAL aggregates only, callable by anon (auth page) and users
create or replace function public.community_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'members',        (select count(*) from public.profiles where profile_complete and kind='member'),
    'new_this_week',  (select count(*) from public.profiles where profile_complete and kind='member' and created_at > now() - interval '7 days'),
    'verified',       (select count(*) from public.verifications v join public.profiles p on p.id=v.user_id where v.selfie_verified and p.kind='member'),
    'team',           (select count(*) from public.profiles where kind='team' and profile_complete),
    'showcase',       (select count(*) from public.showcase_profiles where active),
    'founders_left',  greatest(0, coalesce((select (value#>>'{}')::int from public.app_settings where key='founder_limit'),0) - (select count(*) from public.profiles where founder)),
    'founder_discount_pct', coalesce((select (value#>>'{}')::int from public.app_settings where key='founder_discount_pct'),0),
    'countries',      (select coalesce(jsonb_object_agg(country, c),'{}'::jsonb) from (select country, count(*) c from public.profiles where profile_complete and kind='member' and country is not null group by country order by c desc limit 6) t)
  )
$$;
revoke all on function public.community_stats() from public;
grant execute on function public.community_stats() to anon, authenticated;

-- how to make a staff account a team profile (run as operator):
--   update public.profiles set kind='team' where id='<uuid>';
