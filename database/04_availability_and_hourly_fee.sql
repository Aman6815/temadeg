-- 04: hourly fee, structured availability

-- The expected fee is per hour, not per month
alter table public.tutor_applications
  rename column expected_monthly_fee to expected_hourly_fee;

-- Availability now comes from lists (tutor_availability below),
-- so the free-text note is no longer required to submit.
alter table public.tutor_applications
  drop constraint complete_when_submitted;

alter table public.tutor_applications
  add constraint complete_when_submitted check (
    status = 'draft' or (
      city is not null
      and education_level is not null
      and grade_min is not null
      and grade_max is not null
    )
  );

-- One available time window per tutor per day (1 = Monday ... 7 = Sunday)
create table public.tutor_availability (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  start_hour smallint not null check (start_hour between 0 and 23),
  end_hour smallint not null check (end_hour between 1 and 24),
  constraint hours_in_order check (start_hour < end_hour),
  unique (tutor_id, day_of_week)
);

alter table public.tutor_availability enable row level security;

revoke all on public.tutor_availability from anon, authenticated;
grant select, insert, delete on public.tutor_availability to authenticated;

create policy "Tutors read their own availability"
  on public.tutor_availability for select to authenticated
  using (tutor_id = (select auth.uid()));

create policy "Admins read all availability"
  on public.tutor_availability for select to authenticated
  using (public.is_admin());

create policy "Tutors add their own availability"
  on public.tutor_availability for insert to authenticated
  with check (tutor_id = (select auth.uid()) and public.my_role() = 'tutor');

create policy "Tutors delete their own availability"
  on public.tutor_availability for delete to authenticated
  using (tutor_id = (select auth.uid()));

-- Replaces the tutor's whole schedule in one go (all or nothing).
-- Runs with the caller's rights, so the rules above still apply.
create function public.set_my_availability(p_slots jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if public.my_role() is distinct from 'tutor' then
    raise exception 'not allowed';
  end if;

  delete from public.tutor_availability
  where tutor_id = (select auth.uid());

  insert into public.tutor_availability (tutor_id, day_of_week, start_hour, end_hour)
  select
    (select auth.uid()),
    (s ->> 'day')::smallint,
    (s ->> 'start')::smallint,
    (s ->> 'end')::smallint
  from jsonb_array_elements(p_slots) as s;
end;
$$;

revoke execute on function public.set_my_availability(jsonb) from public, anon;
grant execute on function public.set_my_availability(jsonb) to authenticated;