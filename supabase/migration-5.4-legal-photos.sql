-- =====================================================================
-- Nikah.App 5.4 — legal acceptance record, explicit-consent flag,
-- photo privacy in discovery, showcase photo paths. Run after 5.3.
-- =====================================================================
alter table public.profiles add column if not exists legal_version text;
alter table public.profiles add column if not exists legal_accepted_at timestamptz;
alter table public.profiles add column if not exists consent_special_data boolean not null default false; -- religion inference + transfer (consent doc A, C)

-- discovery: expose partner's photo-privacy preference so the client blurs until matched
drop function if exists public.discover_candidates(int);
create or replace function public.discover_candidates(max_results int default 20)
returns table (
  id uuid, kind text, name text, age int, gender text, country text, city text, lang text,
  intent text, children_plan text, family_role text, relocation text,
  occupation text, bio text, bio_translations jsonb, prompts jsonb, compat jsonb,
  languages text[], photo_path text, photo_blur boolean,
  selfie_verified boolean, identity_verified boolean, phone_verified boolean
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
         p.languages, p.photo_path, coalesce(st.photo_privacy,true),
         coalesce(v.selfie_verified,false), coalesce(v.identity_verified,false), coalesce(v.phone_verified,false)
  from public.profiles p
  left join public.verifications v on v.user_id = p.id
  left join public.settings st on st.user_id = p.id
  where p.id <> me.id
    and p.discoverable and p.profile_complete and p.birth_date is not null
    and (me.seeking is null or me.seeking = 'Fark etmez' or p.gender = me.seeking)
    and (p.seeking is null or p.seeking = 'Fark etmez' or me.gender = p.seeking)
    and (p.kind = 'team' or (
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
         null::text, s.bio_translations, s.prompts, s.compat, s.languages, s.photo_path, false, false, false, false
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

-- showcase photos: static illustrations shipped with the app (clearly non-photographic)
update public.showcase_profiles s set photo_path = '/assets/showcase/p' || s.sort_order || '.svg' where s.photo_path is null;
