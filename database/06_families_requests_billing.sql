-- 06: children, tutor requests, assignments, billing, payment proofs, payouts

-- Children (minimal data: first name and grade only)
create table public.students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 50),
  grade smallint not null check (grade between 0 and 12),
  created_at timestamptz not null default now()
);

-- A family's request for a tutor
create table public.tutoring_requests (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id),
  subject_ids smallint[] not null check (cardinality(subject_ids) between 1 and 14),
  mode text not null check (mode in ('online', 'in_person', 'either')),
  area text check (char_length(area) <= 100),
  preferred_days smallint[] not null default '{}'
    check (preferred_days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  time_of_day text not null default 'any'
    check (time_of_day in ('morning', 'afternoon', 'evening', 'any')),
  max_hourly_rate numeric(10,2) check (max_hourly_rate >= 0),
  preferred_tutor_id uuid references public.profiles (id) on delete set null,
  note text check (char_length(note) <= 1000),
  status text not null default 'open' check (status in ('open', 'matched', 'cancelled')),
  created_at timestamptz not null default now()
);

-- A confirmed tutor-student arrangement. The commission rate is frozen here.
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.tutoring_requests (id),
  parent_id uuid not null references public.profiles (id),
  student_id uuid not null references public.students (id),
  tutor_id uuid not null references public.profiles (id),
  monthly_fee numeric(12,2) not null check (monthly_fee > 0),
  commission_rate numeric(4,3) not null check (commission_rate between 0 and 0.5),
  status text not null default 'active' check (status in ('active', 'ended')),
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  constraint dates_in_order check (end_date is null or end_date >= start_date)
);

-- Monthly bills. The split is calculated and frozen when the bill is created.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id),
  parent_id uuid not null references public.profiles (id),
  tutor_id uuid not null references public.profiles (id),
  period date not null check (extract(day from period) = 1),
  amount_due numeric(12,2) not null check (amount_due > 0),
  commission_amount numeric(12,2) not null check (commission_amount >= 0),
  tutor_amount numeric(12,2) not null check (tutor_amount >= 0),
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (assignment_id, period),
  constraint split_adds_up check (commission_amount + tutor_amount = amount_due)
);

-- Payments reported by parents. Only 'confirmed' payments count as money received.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id),
  parent_id uuid not null references public.profiles (id),
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('telebirr', 'cbe', 'bank_transfer', 'cash', 'other')),
  reference text check (char_length(reference) <= 100),
  proof_path text not null unique,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  review_note text check (char_length(review_note) <= 500),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint proof_in_parent_folder check (
    proof_path like (parent_id::text || '/%') and proof_path not like '%..%'
  )
);

-- Money paid out to tutors
create table public.tutor_payouts (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null unique references public.invoices (id),
  tutor_id uuid not null references public.profiles (id),
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('telebirr', 'cbe', 'bank_transfer', 'cash', 'other')),
  reference text check (char_length(reference) <= 100),
  paid_at timestamptz not null default now(),
  recorded_by uuid references public.profiles (id)
);

-- Row Level Security
alter table public.students enable row level security;
alter table public.tutoring_requests enable row level security;
alter table public.assignments enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.tutor_payouts enable row level security;

revoke all on public.students, public.tutoring_requests, public.assignments,
  public.invoices, public.payments, public.tutor_payouts from anon, authenticated;

grant select, delete on public.students to authenticated;
grant insert (parent_id, first_name, grade) on public.students to authenticated;
grant update (first_name, grade) on public.students to authenticated;

grant select on public.tutoring_requests to authenticated;
grant insert (
  parent_id, student_id, subject_ids, mode, area, preferred_days,
  time_of_day, max_hourly_rate, preferred_tutor_id, note
) on public.tutoring_requests to authenticated;
grant update (status) on public.tutoring_requests to authenticated;

grant select on public.assignments, public.invoices, public.tutor_payouts to authenticated;

grant select on public.payments to authenticated;
grant insert (invoice_id, parent_id, amount, method, reference, proof_path)
  on public.payments to authenticated;

-- students
create policy "Parents read their children"
  on public.students for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Admins read all children"
  on public.students for select to authenticated
  using (public.is_admin());

create policy "Tutors read the children they teach"
  on public.students for select to authenticated
  using (exists (
    select 1 from public.assignments a
    where a.student_id = students.id
      and a.tutor_id = (select auth.uid())
      and a.status = 'active'
  ));

create policy "Parents add children"
  on public.students for insert to authenticated
  with check (parent_id = (select auth.uid()) and public.my_role() = 'parent');

create policy "Parents edit their children"
  on public.students for update to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

create policy "Parents remove their children"
  on public.students for delete to authenticated
  using (parent_id = (select auth.uid()));

-- tutoring_requests
create policy "Parents read their requests"
  on public.tutoring_requests for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Admins read all requests"
  on public.tutoring_requests for select to authenticated
  using (public.is_admin());

create policy "Tutors read requests they were assigned to"
  on public.tutoring_requests for select to authenticated
  using (exists (
    select 1 from public.assignments a
    where a.request_id = tutoring_requests.id
      and a.tutor_id = (select auth.uid())
  ));

create policy "Parents create requests for their own children"
  on public.tutoring_requests for insert to authenticated
  with check (
    parent_id = (select auth.uid())
    and public.my_role() = 'parent'
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.parent_id = (select auth.uid())
    )
  );

-- Parents can only cancel an open request (the only column they may update is status).
create policy "Parents cancel their open requests"
  on public.tutoring_requests for update to authenticated
  using (parent_id = (select auth.uid()) and status = 'open')
  with check (parent_id = (select auth.uid()) and status in ('open', 'cancelled'));

-- assignments, invoices, payouts (read only from the website)
create policy "Parents read their assignments"
  on public.assignments for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Tutors read their assignments"
  on public.assignments for select to authenticated
  using (tutor_id = (select auth.uid()));

create policy "Admins read all assignments"
  on public.assignments for select to authenticated
  using (public.is_admin());

create policy "Parents read their invoices"
  on public.invoices for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Admins read all invoices"
  on public.invoices for select to authenticated
  using (public.is_admin());

create policy "Tutors read their payouts"
  on public.tutor_payouts for select to authenticated
  using (tutor_id = (select auth.uid()));

create policy "Admins read all payouts"
  on public.tutor_payouts for select to authenticated
  using (public.is_admin());

-- payments
create policy "Parents read their payments"
  on public.payments for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Admins read all payments"
  on public.payments for select to authenticated
  using (public.is_admin());

create policy "Parents report a payment for their own unpaid invoice"
  on public.payments for insert to authenticated
  with check (
    parent_id = (select auth.uid())
    and public.my_role() = 'parent'
    and exists (
      select 1 from public.invoices i
      where i.id = invoice_id
        and i.parent_id = (select auth.uid())
        and i.status = 'unpaid'
    )
  );

-- Private bucket for payment proofs (screenshots or receipts)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs', 'payment-proofs', false, 5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create policy "Parents upload payment proof to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.my_role() = 'parent'
  );

create policy "Parents read their own payment proofs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Admins read all payment proofs"
  on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- Admin actions. Each one checks the caller is an admin and writes the audit log.

create function public.assign_tutor(
  p_request_id uuid,
  p_tutor_id uuid,
  p_monthly_fee numeric,
  p_commission_rate numeric,
  p_start_date date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  req public.tutoring_requests%rowtype;
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  select * into req from public.tutoring_requests
  where id = p_request_id and status = 'open'
  for update;
  if not found then
    raise exception 'request is not open';
  end if;

  if not exists (
    select 1 from public.tutor_public_profiles
    where tutor_id = p_tutor_id and is_active
  ) then
    raise exception 'tutor is not active';
  end if;

  insert into public.assignments (
    request_id, parent_id, student_id, tutor_id,
    monthly_fee, commission_rate, start_date
  )
  values (
    req.id, req.parent_id, req.student_id, p_tutor_id,
    p_monthly_fee, p_commission_rate, p_start_date
  )
  returning id into new_id;

  update public.tutoring_requests set status = 'matched' where id = req.id;

  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values (
    (select auth.uid()), 'assign_tutor', 'assignments', new_id,
    jsonb_build_object('request_id', req.id, 'tutor_id', p_tutor_id)
  );

  return new_id;
end;
$$;

create function public.end_assignment(p_assignment_id uuid, p_end_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  update public.assignments
  set status = 'ended', end_date = p_end_date
  where id = p_assignment_id and status = 'active';
  if not found then
    raise exception 'assignment is not active';
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id)
  values ((select auth.uid()), 'end_assignment', 'assignments', p_assignment_id);
end;
$$;

create function public.create_invoice(p_assignment_id uuid, p_period date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.assignments%rowtype;
  month_start date := (date_trunc('month', p_period::timestamp))::date;
  commission numeric(12,2);
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  select * into a from public.assignments
  where id = p_assignment_id and status = 'active';
  if not found then
    raise exception 'assignment is not active';
  end if;

  commission := round(a.monthly_fee * a.commission_rate, 2);

  insert into public.invoices (
    assignment_id, parent_id, tutor_id, period,
    amount_due, commission_amount, tutor_amount
  )
  values (
    a.id, a.parent_id, a.tutor_id, month_start,
    a.monthly_fee, commission, a.monthly_fee - commission
  )
  returning id into new_id;

  insert into public.audit_log (actor_id, action, entity, entity_id)
  values ((select auth.uid()), 'create_invoice', 'invoices', new_id);

  return new_id;
end;
$$;

create function public.confirm_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pay public.payments%rowtype;
  inv public.invoices%rowtype;
  total numeric;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  select * into pay from public.payments
  where id = p_payment_id and status = 'pending'
  for update;
  if not found then
    raise exception 'payment is not pending';
  end if;

  update public.payments
  set status = 'confirmed', reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = pay.id;

  select * into inv from public.invoices where id = pay.invoice_id for update;

  select coalesce(sum(amount), 0) into total
  from public.payments
  where invoice_id = inv.id and status = 'confirmed';

  if total >= inv.amount_due and inv.status = 'unpaid' then
    update public.invoices set status = 'paid' where id = inv.id;
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id)
  values ((select auth.uid()), 'confirm_payment', 'payments', pay.id);
end;
$$;

create function public.reject_payment(p_payment_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  update public.payments
  set status = 'rejected', review_note = p_note,
      reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = p_payment_id and status = 'pending';
  if not found then
    raise exception 'payment is not pending';
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id)
  values ((select auth.uid()), 'reject_payment', 'payments', p_payment_id);
end;
$$;

create function public.record_payout(p_invoice_id uuid, p_method text, p_reference text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.invoices%rowtype;
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;

  select * into inv from public.invoices where id = p_invoice_id and status = 'paid';
  if not found then
    raise exception 'invoice is not paid';
  end if;

  insert into public.tutor_payouts (invoice_id, tutor_id, amount, method, reference, recorded_by)
  values (inv.id, inv.tutor_id, inv.tutor_amount, p_method, p_reference, (select auth.uid()))
  returning id into new_id;

  insert into public.audit_log (actor_id, action, entity, entity_id)
  values ((select auth.uid()), 'record_payout', 'tutor_payouts', new_id);

  return new_id;
end;
$$;

revoke execute on function public.assign_tutor(uuid, uuid, numeric, numeric, date) from public, anon;
revoke execute on function public.end_assignment(uuid, date) from public, anon;
revoke execute on function public.create_invoice(uuid, date) from public, anon;
revoke execute on function public.confirm_payment(uuid) from public, anon;
revoke execute on function public.reject_payment(uuid, text) from public, anon;
revoke execute on function public.record_payout(uuid, text, text) from public, anon;
grant execute on function public.assign_tutor(uuid, uuid, numeric, numeric, date) to authenticated;
grant execute on function public.end_assignment(uuid, date) to authenticated;
grant execute on function public.create_invoice(uuid, date) to authenticated;
grant execute on function public.confirm_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;
grant execute on function public.record_payout(uuid, text, text) to authenticated;
