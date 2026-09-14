-- V2 session and consent are created atomically. This function only writes to
-- V2 tables; the legacy V1 participants, sessions and consents remain untouched.

create or replace function start_interview_v2_session(
  p_study_slug text,
  p_study_stage text,
  p_response_mode response_mode,
  p_resume_token_hash text,
  p_current_step_id text,
  p_consent_version text,
  p_recording_consent boolean,
  p_created_by uuid default null
)
returns table (
  session_id uuid,
  participant_code text,
  current_step_id text,
  return_to_review boolean,
  started_at timestamptz,
  completed_at timestamptz,
  status session_status,
  study_stage text,
  consented_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_study_id uuid;
  v_questionnaire_id uuid;
  v_session interview_v2_sessions%rowtype;
  v_consent interview_v2_consents%rowtype;
  v_participant_code text;
begin
  if p_study_stage not in ('pilot_v2', 'formal_v2') then
    raise exception 'Invalid V2 study stage';
  end if;

  select id into v_study_id from studies where slug = p_study_slug;
  if v_study_id is null then
    raise exception 'Study % not found', p_study_slug;
  end if;

  select id into v_questionnaire_id
    from interview_v2_questionnaire_versions
    where study_id = v_study_id and questionnaire_version = 'v2';
  if v_questionnaire_id is null then
    raise exception 'Questionnaire V2 is not published';
  end if;

  v_participant_code := next_interview_v2_participant_code();

  insert into interview_v2_sessions (
    study_id,
    questionnaire_version_id,
    participant_code,
    questionnaire_version,
    study_stage,
    response_mode,
    resume_token_hash,
    current_step_id,
    created_by
  ) values (
    v_study_id,
    v_questionnaire_id,
    v_participant_code,
    'v2',
    p_study_stage,
    p_response_mode,
    p_resume_token_hash,
    p_current_step_id,
    p_created_by
  ) returning * into v_session;

  insert into interview_v2_consents (
    session_id,
    participant_code,
    questionnaire_version,
    consent_version,
    participation_consent,
    recording_consent,
    recorded_by
  ) values (
    v_session.id,
    v_participant_code,
    'v2',
    p_consent_version,
    true,
    p_recording_consent,
    p_created_by
  ) returning * into v_consent;

  return query select
    v_session.id,
    v_session.participant_code,
    v_session.current_step_id,
    v_session.return_to_review,
    v_session.started_at,
    v_session.completed_at,
    v_session.status,
    v_session.study_stage,
    v_consent.consented_at;
end;
$$;

revoke all on function start_interview_v2_session(
  text, text, response_mode, text, text, text, boolean, uuid
) from public, anon, authenticated;
grant execute on function start_interview_v2_session(
  text, text, response_mode, text, text, text, boolean, uuid
) to service_role;
