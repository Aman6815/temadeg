-- 02: tutor applications, audit log, admin review

create type public.application_status as enum
  ('draft', 'submitted', 'needs_info', 'approved', 'rejected');

create type public.education_level as enum
  ('high_school', 'diploma', 'bachelor', 'master', 'doctorate');

-- Helper: the role of the current user
create function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- Audit log: only written by controlled functions, readable by admins
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy "Admins read the audit log"
  on public.audit_log for select to authenticated
  using (public.is_admin());

-- Tutor applications (private information)
create table public.tutor_applications (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null unique references public.profiles (id) on delete cascade,
  status public.application_status not null default 'draft',

  city text check (char_length(city) <= 100),
  sub_city text check (char_length(sub_city) <= 100),
  is_student boolean not null default false,
  education_level public.education_level,
  institution text check (char_length(institution) <= 200),
  tutoring_experience text check (char_length(tutoring_experience) <= 2000),
  child_teaching_experience text check (char_length(child_teaching_experience) <= 2000),
  grade_min smallint check (grade_min between 0 and 12),
  grade_max smallint check (grade_max between 0 and 12),
  availability_note text check (char_length(availability_note) <= 1000),
  expected_monthly_fee numeric(10,2) check (expected_monthly_fee >= 0),

  admin_feedback text check (char_length(admin_feedback) <= 2000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint grades_in_order
    check (grade_min is null or grade_max is null or grade_min <= grade_max),
  constraint complete_when_submitted check (
    status = 'draft' or (
      city is not null
      and education_level is not null
      and grade_min is not null
      and grade_max is not null
      and availability_note is not null
    )
  )
);

alter table public.tutor_applications enable row level security;

-- Tutors may only touch the columns they fill in themselves.
revoke all on public.tutor_applications from anon, authenticated;
grant select on public.tutor_applications to authenticated;

grant insert (
  tutor_id, city, sub_city, is_student, education_level, institution,
  tutoring_experience, child_teaching_experience, grade_min, grade_max,
  availability_note, expected_monthly_fee
) on public.tutor_applications to authenticated;

grant update (
  city, sub_city, is_student, education_level, institution,
  tutoring_experience, child_teaching_experience, grade_min, grade_max,
  availability_note, expected_monthly_fee, status
) on public.tutor_applications to authenticated;

create policy "Tutors read their own application"
  on public.tutor_applications for select to authenticated
  using (tutor_id = (select auth.uid()));

create policy "Admins read all applications"
  on public.tutor_applications for select to authenticated
  using (public.is_admin());

create policy "Tutors create their own application"
  on public.tutor_applications for insert to authenticated
  with check (
    tutor_id = (select auth.uid())
    and status = 'draft'
    and public.my_role() = 'tutor'
  );

create policy "Tutors edit their application while it is open"
  on public.tutor_applications for update to authenticated
  using (
    tutor_id = (select auth.uid())
    and status in ('draft', 'needs_info')
  )
  with check (
    tutor_id = (select auth.uid())
    and status in ('draft', 'needs_info', 'submitted')
  );

-- Keep timestamps correct automatically
create function public.application_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'submitted' and old.status is distinct from 'submitted' then
    new.submitted_at := now();
  end if;
  return new;
end;
$$;

create trigger application_before_update
  before update on public.tutor_applications
  for each row execute function public.application_before_update();

-- The only way to approve, reject or request changes: admins call this.
create function public.review_application(
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

revoke execute on function public.review_application(uuid, public.application_status, text)
  from public, anon;
grant execute on function public.review_application(uuid, public.application_status, text)
  to authenticated;
  