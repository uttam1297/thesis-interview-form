-- Phase 3: research data model.
--
-- Principles:
--   * Participants are pseudonymous (participant_code) and never hold an account.
--   * Participant traffic reaches the database only through server route
--     handlers using the service role; the anon role has no table access.
--   * Researchers authenticate with Supabase Auth; membership in
--     researcher_profiles grants read access and live-interview writes.
--   * Responses pin the exact question row (wording) they answered, so a
--     new questionnaire version never rewrites collected data.

create extension if not exists pgcrypto;

-- ---------- enums ----------
create type response_mode as enum ('asynchronous_form', 'live_interview');
create type session_status as enum ('in_progress', 'completed', 'abandoned', 'withdrawn');
create type response_method as enum ('selected', 'typed', 'voice', 'researcher');

-- ---------- researchers ----------
create table researcher_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function is_researcher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from researcher_profiles where user_id = auth.uid()
  );
$$;

-- ---------- studies & questionnaire versions ----------
create table studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  participant_counter integer not null default 0,
  created_at timestamptz not null default now()
);

create table questionnaire_versions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references studies (id) on delete restrict,
  version text not null,
  -- Frozen copy of the validated InterviewConfig at publish time.
  definition jsonb not null,
  definition_hash text not null,
  published_at timestamptz not null default now(),
  unique (study_id, version)
);

create table questionnaire_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_version_id uuid not null references questionnaire_versions (id) on delete cascade,
  question_key text not null,
  position integer not null,
  section_id text not null,
  construct text not null,
  response_type text not null,
  -- Frozen copy of the InterviewQuestion (prompt, options, validation...).
  definition jsonb not null,
  unique (questionnaire_version_id, question_key)
);

create index questionnaire_questions_version_position_idx
  on questionnaire_questions (questionnaire_version_id, position);

-- ---------- participants & sessions ----------
create table participants (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references studies (id) on delete restrict,
  participant_code text not null,
  created_at timestamptz not null default now(),
  unique (study_id, participant_code)
);

-- Mints P001, P002, ... per study atomically.
create or replace function next_participant_code(p_study_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update studies
    set participant_counter = participant_counter + 1
    where id = p_study_id
    returning participant_counter into n;
  if n is null then
    raise exception 'Unknown study %', p_study_id;
  end if;
  return 'P' || lpad(n::text, 3, '0');
end;
$$;

create table sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants (id) on delete restrict,
  questionnaire_version_id uuid not null references questionnaire_versions (id) on delete restrict,
  response_mode response_mode not null,
  status session_status not null default 'in_progress',
  -- sha256 of the resume token; the token itself is never stored.
  resume_token_hash text not null unique,
  resume_expires_at timestamptz not null default now() + interval '30 days',
  current_step_id text not null default 'welcome',
  return_to_review boolean not null default false,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Live interviews only: the researcher who entered the data.
  created_by uuid references auth.users (id) on delete set null,
  researcher_notes text,
  updated_at timestamptz not null default now()
);

create index sessions_participant_idx on sessions (participant_id);
create index sessions_status_idx on sessions (status);
create index sessions_last_activity_idx on sessions (last_activity_at desc);

-- ---------- consents ----------
create table consents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  participant_id uuid not null references participants (id) on delete restrict,
  consent_version text not null,
  participation_consent boolean not null,
  -- Null means "not asked"; never inferred from participation consent.
  recording_consent boolean,
  consented_at timestamptz not null default now(),
  -- Live mode: consent was obtained verbally and recorded by the researcher.
  recorded_by uuid references auth.users (id) on delete set null,
  withdrawn_at timestamptz,
  withdrawal_note text
);

create index consents_session_idx on consents (session_id);

-- ---------- responses ----------
create table responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  question_id uuid not null references questionnaire_questions (id) on delete restrict,
  question_key text not null,
  construct text not null,
  response_type text not null,
  -- Typed ResponseValue: {kind:'single'|'multi'|'scale'|'ranking'|'text', ...}
  value jsonb,
  -- Denormalised free text (text answers, "Other" entries) for search/export.
  text_value text,
  skipped boolean not null default false,
  method response_method not null,
  recorded_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_id)
);

create index responses_session_idx on responses (session_id);
create index responses_question_idx on responses (question_id);
create index responses_construct_idx on responses (construct);

-- ---------- updated_at maintenance ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sessions_set_updated_at
  before update on sessions
  for each row execute function set_updated_at();

create trigger responses_set_updated_at
  before update on responses
  for each row execute function set_updated_at();

-- ---------- row level security ----------
alter table researcher_profiles enable row level security;
alter table studies enable row level security;
alter table questionnaire_versions enable row level security;
alter table questionnaire_questions enable row level security;
alter table participants enable row level security;
alter table sessions enable row level security;
alter table consents enable row level security;
alter table responses enable row level security;

-- No policies exist for the anon role: anonymous clients cannot read or
-- write any research table. Participant traffic goes through server route
-- handlers that authenticate a resume token and use the service role.

create policy "researchers read own profile"
  on researcher_profiles for select to authenticated
  using (user_id = auth.uid());

create policy "researchers read studies"
  on studies for select to authenticated using (is_researcher());

create policy "researchers read questionnaire versions"
  on questionnaire_versions for select to authenticated using (is_researcher());

create policy "researchers read questionnaire questions"
  on questionnaire_questions for select to authenticated using (is_researcher());

create policy "researchers read participants"
  on participants for select to authenticated using (is_researcher());
create policy "researchers create participants"
  on participants for insert to authenticated with check (is_researcher());

create policy "researchers read sessions"
  on sessions for select to authenticated using (is_researcher());
create policy "researchers create live sessions"
  on sessions for insert to authenticated
  with check (is_researcher() and response_mode = 'live_interview' and created_by = auth.uid());
create policy "researchers update sessions"
  on sessions for update to authenticated
  using (is_researcher()) with check (is_researcher());

create policy "researchers read consents"
  on consents for select to authenticated using (is_researcher());
create policy "researchers record live consents"
  on consents for insert to authenticated
  with check (is_researcher() and recorded_by = auth.uid());

create policy "researchers read responses"
  on responses for select to authenticated using (is_researcher());
create policy "researchers write live responses"
  on responses for insert to authenticated
  with check (
    is_researcher()
    and exists (
      select 1 from sessions s
      where s.id = session_id and s.response_mode = 'live_interview'
    )
  );
create policy "researchers update live responses"
  on responses for update to authenticated
  using (
    is_researcher()
    and exists (
      select 1 from sessions s
      where s.id = session_id and s.response_mode = 'live_interview'
    )
  )
  with check (is_researcher());

-- Lock down function execution to what each role needs.
revoke all on function next_participant_code(uuid) from public, anon;
grant execute on function next_participant_code(uuid) to authenticated, service_role;
grant execute on function is_researcher() to authenticated, anon, service_role;
