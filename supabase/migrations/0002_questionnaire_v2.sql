-- Questionnaire V2: isolated, additive storage.
--
-- The legacy V1 tables created by 0001 are deliberately not altered. V1 is
-- stored as questionnaire version 2.4.0 and remains readable/resumable through
-- its existing code path. All new participant writes go to the tables below.

create sequence interview_v2_participant_code_seq;

create table interview_v2_questionnaire_versions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references studies (id) on delete restrict,
  questionnaire_version text not null check (questionnaire_version = 'v2'),
  definition jsonb not null,
  definition_hash text not null,
  published_at timestamptz not null default now(),
  unique (study_id, questionnaire_version)
);

create table interview_v2_questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_version_id uuid not null
    references interview_v2_questionnaire_versions (id) on delete restrict,
  question_id text not null check (question_id like 'v2\_%' escape '\'),
  question_version text not null default '1',
  position integer not null check (position >= 0),
  section text not null,
  constructs text[] not null check (cardinality(constructs) > 0),
  response_type text not null,
  definition jsonb not null,
  unique (questionnaire_version_id, question_id)
);

create index interview_v2_questions_version_position_idx
  on interview_v2_questions (questionnaire_version_id, position);

create table interview_v2_sessions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references studies (id) on delete restrict,
  questionnaire_version_id uuid not null
    references interview_v2_questionnaire_versions (id) on delete restrict,
  participant_code text not null unique check (participant_code ~ '^V2P[0-9]{3,}$'),
  questionnaire_version text not null default 'v2'
    check (questionnaire_version = 'v2'),
  study_stage text not null default 'pilot_v2'
    check (study_stage in ('pilot_v2', 'formal_v2')),
  response_mode response_mode not null default 'asynchronous_form',
  status session_status not null default 'in_progress',
  resume_token_hash text not null unique,
  resume_expires_at timestamptz not null default now() + interval '30 days',
  current_step_id text not null default 'welcome',
  return_to_review boolean not null default false,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  researcher_notes text,
  updated_at timestamptz not null default now(),
  unique (id, participant_code)
);

create index interview_v2_sessions_status_idx
  on interview_v2_sessions (status);
create index interview_v2_sessions_last_activity_idx
  on interview_v2_sessions (last_activity_at desc);
create index interview_v2_sessions_stage_idx
  on interview_v2_sessions (study_stage);

create table interview_v2_consents (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  participant_code text not null,
  questionnaire_version text not null default 'v2'
    check (questionnaire_version = 'v2'),
  consent_version text not null,
  participation_consent boolean not null check (participation_consent),
  recording_consent boolean,
  consented_at timestamptz not null default now(),
  recorded_by uuid references auth.users (id) on delete set null,
  withdrawn_at timestamptz,
  withdrawal_note text,
  unique (session_id),
  foreign key (session_id, participant_code)
    references interview_v2_sessions (id, participant_code) on delete restrict
);

create table interview_v2_responses (
  response_id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  participant_code text not null,
  questionnaire_version text not null default 'v2'
    check (questionnaire_version = 'v2'),
  question_definition_id uuid not null
    references interview_v2_questions (id) on delete restrict,
  question_id text not null check (question_id like 'v2\_%' escape '\'),
  question_version text not null,
  section text not null,
  constructs text[] not null check (cardinality(constructs) > 0),
  response_type text not null,
  response_value jsonb,
  optional_elaboration text,
  text_value text,
  skipped boolean not null default false,
  method response_method not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, question_id),
  foreign key (session_id, participant_code)
    references interview_v2_sessions (id, participant_code) on delete restrict
);

create index interview_v2_responses_session_idx
  on interview_v2_responses (session_id);
create index interview_v2_responses_question_idx
  on interview_v2_responses (question_id);
create index interview_v2_responses_constructs_idx
  on interview_v2_responses using gin (constructs);

create trigger interview_v2_sessions_set_updated_at
  before update on interview_v2_sessions
  for each row execute function set_updated_at();

create trigger interview_v2_responses_set_updated_at
  before update on interview_v2_responses
  for each row execute function set_updated_at();

create or replace function next_interview_v2_participant_code()
returns text
language sql
security definer
set search_path = public
as $$
  select 'V2P' || lpad(nextval('interview_v2_participant_code_seq')::text, 3, '0');
$$;

-- Publish the V2 definition and question rows atomically. It cannot write to
-- any legacy table and refuses to replace an existing definition.
create or replace function publish_interview_v2_questionnaire(
  p_study_slug text,
  p_definition jsonb,
  p_definition_hash text,
  p_questions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_study_id uuid;
  v_version_id uuid;
  v_existing_hash text;
  v_existing_questions integer;
  v_item jsonb;
begin
  if p_definition ->> 'version' <> 'v2' then
    raise exception 'Only questionnaire version v2 can be published here';
  end if;

  select id into v_study_id from studies where slug = p_study_slug;
  if v_study_id is null then
    raise exception 'Study % not found', p_study_slug;
  end if;

  select id, definition_hash into v_version_id, v_existing_hash
    from interview_v2_questionnaire_versions
    where study_id = v_study_id and questionnaire_version = 'v2';

  if v_version_id is not null then
    select count(*) into v_existing_questions
      from interview_v2_questions
      where questionnaire_version_id = v_version_id;
    if v_existing_hash = p_definition_hash
       and v_existing_questions = jsonb_array_length(p_questions) then
      return v_version_id;
    end if;
    raise exception 'Questionnaire v2 is already published with different or incomplete content';
  end if;

  insert into interview_v2_questionnaire_versions (
    study_id, questionnaire_version, definition, definition_hash
  ) values (v_study_id, 'v2', p_definition, p_definition_hash)
  returning id into v_version_id;

  for v_item in select value from jsonb_array_elements(p_questions)
  loop
    insert into interview_v2_questions (
      questionnaire_version_id,
      question_id,
      question_version,
      position,
      section,
      constructs,
      response_type,
      definition
    ) values (
      v_version_id,
      v_item ->> 'question_id',
      v_item ->> 'question_version',
      (v_item ->> 'position')::integer,
      v_item ->> 'section',
      array(select jsonb_array_elements_text(v_item -> 'constructs')),
      v_item ->> 'response_type',
      v_item -> 'definition'
    );
  end loop;

  return v_version_id;
end;
$$;

alter table interview_v2_questionnaire_versions enable row level security;
alter table interview_v2_questions enable row level security;
alter table interview_v2_sessions enable row level security;
alter table interview_v2_consents enable row level security;
alter table interview_v2_responses enable row level security;

create policy "researchers read v2 questionnaire versions"
  on interview_v2_questionnaire_versions for select to authenticated
  using (is_researcher());
create policy "researchers read v2 questions"
  on interview_v2_questions for select to authenticated
  using (is_researcher());
create policy "researchers read v2 sessions"
  on interview_v2_sessions for select to authenticated
  using (is_researcher());
create policy "researchers read v2 consents"
  on interview_v2_consents for select to authenticated
  using (is_researcher());
create policy "researchers read v2 responses"
  on interview_v2_responses for select to authenticated
  using (is_researcher());

revoke all on function next_interview_v2_participant_code() from public, anon, authenticated;
grant execute on function next_interview_v2_participant_code() to service_role;
revoke all on function publish_interview_v2_questionnaire(text, jsonb, text, jsonb)
  from public, anon, authenticated;
grant execute on function publish_interview_v2_questionnaire(text, jsonb, text, jsonb)
  to service_role;
