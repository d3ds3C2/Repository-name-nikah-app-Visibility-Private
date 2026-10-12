-- =====================================================================
-- Nikah.App 5.3 — Selfie / ID verification via Didit (free tier)
-- Run AFTER schema.sql and migration-5.2-showcase.sql (idempotent).
-- Flow: client → edge fn verify-start (creates Didit session, stores row)
--       → user completes hosted flow → Didit → edge fn didit-webhook
--       → verifications.selfie_verified / identity_verified (service role).
-- The client never writes verification flags.
-- =====================================================================

create table if not exists public.verification_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'didit',
  status text not null default 'Not Started',   -- Didit status strings, verbatim
  url text,
  consent_at timestamptz,                        -- biometric-processing consent (KVKK / UU PDP)
  decision_summary jsonb,                        -- sanitised: no document numbers, no images
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists verification_sessions_user_idx on public.verification_sessions(user_id, created_at desc);
drop trigger if exists verification_sessions_updated_at on public.verification_sessions;
create trigger verification_sessions_updated_at before update on public.verification_sessions
  for each row execute function public.set_updated_at();

-- webhook idempotency
create table if not exists public.verification_events (
  event_id uuid primary key,
  session_id uuid,
  webhook_type text,
  status text,
  received_at timestamptz not null default now()
);

alter table public.verification_sessions enable row level security;
alter table public.verification_events enable row level security;
drop policy if exists "versess_own_read" on public.verification_sessions;
create policy "versess_own_read" on public.verification_sessions for select to authenticated using (user_id = auth.uid());
-- no client insert/update; edge functions use the service role

-- extra columns on verifications for transparency
alter table public.verifications add column if not exists dob_matches boolean;
alter table public.verifications add column if not exists document_country text;
alter table public.verifications add column if not exists verified_at timestamptz;
alter table public.verifications add column if not exists last_status text;

-- how to revoke manually: update public.verifications set selfie_verified=false, identity_verified=false where user_id='<uuid>';
