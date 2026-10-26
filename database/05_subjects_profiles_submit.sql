-- 05: subjects, languages, public tutor profiles, agreement, submit

create type public.teaching_mode as enum ('online', 'in_person', 'both');

-- Subjects (English and Amharic names; edit later with SQL if needed)
create table public.subjects (
  id smallint generated always as identity primary key,
  name_en text not null unique,
  name_am text not null,
  sort_order smallint not null default 0
);

alter table public.subjects enable row level security;
revoke all on public.subjects from anon, authenticated;
grant select on public.subjects to authenticated;

create policy "Signed-in users read subjects"
  on public.subjects for select to authenticated using (true);

insert into public.subjects (name_en, name_am, sort_order) values
  ('Mathematics', 'ሒሳብ', 1),
  ('English', 'እንግሊዝኛ', 2),
  ('Amharic', 'አማርኛ', 3),
  ('General Science', 'አጠቃላይ ሳይንስ', 4),
  ('Environmental Science', 'የአካባቢ ሳይንስ', 5),
  ('Physics', 'ፊዚክስ', 6),
  ('Chemistry', 'ኬሚስትሪ', 7),
  ('Biology', 'ባዮሎጂ', 8),
  ('Social Studies', 'ማህበራዊ ጥናት', 9),
  ('Civics', 'ሥነ ዜጋ', 10),
  ('History', 'ታሪክ', 11),
  ('Geography', 'ጂኦግራፊ', 12),
  ('Economics', 'ኢኮኖሚክስ', 13),
  ('ICT', 'አይሲቲ', 14);

-- New application fields
alter table public.tutor_applications
  add column headline text check (char_length(headline) <= 100),
  add column bio text check (char_length(bio) <= 600),
  add column years_experience smallint check (years_experience between 0 and 60),
  add column telegram_username text check (char_length(telegram_username) <= 64),
  add column teaching_languages text[] not null default '{}'
    check (teaching_languages <@ array['amharic','english','oromo','tigrinya','wolaita','other']),
  add column service_areas text[] not null default '{}'
    check (cardinality(service_areas) <= 10
           and char_length(array_to_string(service_areas, ',')) <= 600),
  add column teaching_mode public.teaching_mode,
  add column agreement_version text,
  add column agreed_at timestamptz;

grant update (
  headline, bio, years_experience, telegram_username,
  teaching_languages, service_areas, teaching_mode
) on public.tutor_applications to authenticated;

-- Tutors can no longer change their own status: submitting goes through a function.
revoke update (status) on public.tutor_applications from authenticated;

alter table public.tutor_applications drop constraint complete_when_submitted;
alter table public.tutor_applications add constraint complete_when_submitted check (
  status = 'draft' or (
    city is not null
    and education_level is not null
    and grade_min is not null
    and grade_max is not null
    and teaching_mode is not null
    and agreed_at is not null
  )
);

-- What parents are allowed to see about an approved tutor (no private data)
create table public.tutor_public_profiles (
  tutor_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text not null,
  headline text,
  bio text,
  years_experience smallint,
  teaching_languages text[] not null default '{}',
  service_areas text[] not null default '{}',
  teaching_mode public.teaching_mode not null,
  grade_min smallint not null,
  grade_max smallint not null,
  hourly_rate numeric(10,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tutor_public_profiles enable row level security;
revoke all on public.tutor_public_profiles from anon, authenticated;
grant select on public.tutor_public_profiles to authenticated;

create policy "Signed-in users read active tutor profiles"
  on public.tutor_public_profiles for select to authenticated
  using (is_active or public.is_admin());

-- Subjects each tutor teaches
create table public.tutor_subjects (
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  subject_id smallint not null references public.subjects (id),
  primary key (tutor_id, subject_id)
);

alter table public.tutor_subjects enable row level security;
revoke all on public.tutor_subjects from anon, authenticated;
grant select, insert, delete on public.tutor_subjects to authenticated;

create policy "Tutors read their own subjects"
  on public.tutor_subjects for select to authenticated
  using (tutor_id = (select auth.uid()));

create policy "Admins read all tutor subjects"
  on public.tutor_subjects for select to authenticated
  using (public.is_admin());

create policy "Signed-in users read subjects of active tutors"
  on public.tutor_subjects for select to authenticated
  using (exists (
    select 1 from public.tutor_public_profiles p
    where p.tutor_id = tutor_subjects.tutor_id and p.is_active
  ));

create policy "Tutors add their own subjects"
  on public.tutor_subjects for insert to authenticated
  with check (tutor_id = (select auth.uid()) and public.my_role() = 'tutor');

create policy "Tutors remove their own subjects"
  on public.tutor_subjects for delete to authenticated
  using (tutor_id = (select auth.uid()));

-- Parents may also see the schedules of active tutors
create policy "Signed-in users read availability of active tutors"
  on public.tutor_availability for select to authenticated
  using (exists (
    select 1 from public.tutor_public_profiles p
    where p.tutor_id = tutor_availability.tutor_id and p.is_active
  ));

-- Replace the tutor's subjects in one go
create function public.set_my_subjects(p_subject_ids smallint[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'not allowed';
  end if;

  delete from public.tutor_subjects where tutor_id = (select auth.uid());

  insert into public.tutor_subjects (tutor_id, subject_id)
  select (select auth.uid()), s
  from (select distinct unnest(p_subject_ids) as s) q;
end;
$$;

revoke execute on function public.set_my_subjects(smallint[]) from public, anon;
grant execute on function public.set_my_subjects(smallint[]) to authenticated;

-- Submit: checks everything and returns the list of missing items (empty = submitted)
create function public.submit_application(p_agreement_version text)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  app public.tutor_applications%rowtype;
  missing text[] := '{}';
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'not allowed';
  end if;

  select * into app from public.tutor_applications where tutor_id = uid;
  if not found or app.status not in ('draft', 'needs_info') then
    raise exception 'application is not open';
  end if;

  if not exists (select 1 from public.profiles where id = uid and phone is not null) then
    missing := array_append(missing, 'phone');
  end if;
  if app.city is null then missing := array_append(missing, 'city'); end if;
  if app.education_level is null then missing := array_append(missing, 'education'); end if;
  if app.headline is null or app.bio is null then missing := array_append(missing, 'profile'); end if;
  if cardinality(app.teaching_languages) = 0 then missing := array_append(missing, 'languages'); end if;
  if app.grade_min is null or app.grade_max is null then missing := array_append(missing, 'grades'); end if;
  if app.teaching_mode is null then missing := array_append(missing, 'teaching_mode'); end if;
  if not exists (select 1 from public.tutor_subjects where tutor_id = uid) then
    missing := array_append(missing, 'subjects');
  end if;
  if not exists (select 1 from public.tutor_availability where tutor_id = uid) then
    missing := array_append(missing, 'availability');
  end if;
  if not exists (select 1 from public.documents where tutor_id = uid and doc_type = 'national_id') then
    missing := array_append(missing, 'national_id');
  end if;
  if not exists (
    select 1 from public.documents
    where tutor_id = uid and doc_type in ('transcript', 'grade12_result', 'degree')
  ) then
    missing := array_append(missing, 'education_document');
  end if;
  if app.is_student and not exists (
    select 1 from public.documents where tutor_id = uid and doc_type = 'student_id'
  ) then
    missing := array_append(missing, 'student_id');
  end if;
  if coalesce(trim(p_agreement_version), '') = '' then
    missing := array_append(missing, 'agreement');
  end if;

  if cardinality(missing) > 0 then
    return missing;
  end if;

  update public.tutor_applications
  set status = 'submitted',
      agreement_version = p_agreement_version,
      agreed_at = now()
  where id = app.id;

  insert into public.audit_log (actor_id, action, entity, entity_id)
  values (uid, 'submit_application', 'tutor_applications', app.id);

  return '{}';
end;
$$;

revoke execute on function public.submit_application(text) from public, anon;
grant execute on function public.submit_application(text) to authenticated;

-- Approving a tutor now also publishes their public profile
create or replace function public.review_application(
  p_application_id uuid,
  p_status public.application_status,
  p_feedback text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  if p_status not in ('approved', 'rejected', 'needs_info') then
    raise exception 'invalid status';
  end if;

  update public.tutor_applications
  set status = p_status,
      admin_feedback = p_feedback,
      reviewed_by = (select auth.uid()),
      reviewed_at = now()
  where id = p_application_id and status = 'submitted';

  if not found then
    raise exception 'application not found or not awaiting review';
  end if;

  if p_status = 'approved' then
    insert into public.tutor_public_profiles (
      tutor_id, display_name, headline, bio, years_experience,
      teaching_languages, service_areas, teaching_mode,
      grade_min, grade_max, hourly_rate, is_active
    )
    select a.tutor_id, p.full_name, a.headline, a.bio, a.years_experience,
           a.teaching_languages, a.service_areas, a.teaching_mode,
           a.grade_min, a.grade_max, a.expected_hourly_fee, true
    from public.tutor_applications a
    join public.profiles p on p.id = a.tutor_id
    where a.id = p_application_id
    on conflict (tutor_id) do update set
      display_name = excluded.display_name,
      headline = excluded.headline,
      bio = excluded.bio,
      years_experience = excluded.years_experience,
      teaching_languages = excluded.teaching_languages,
      service_areas = excluded.service_areas,
      teaching_mode = excluded.teaching_mode,
      grade_min = excluded.grade_min,
      grade_max = excluded.grade_max,
      hourly_rate = excluded.hourly_rate,
      is_active = true;
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (
    (select auth.uid()),
    'review_application',
    'tutor_applications',
    p_application_id,
    jsonb_build_object('status', p_status)
  );
end;
$$;