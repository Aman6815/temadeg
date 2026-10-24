-- 01: user roles and profiles

create type public.user_role as enum ('parent', 'tutor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null check (char_length(full_name) between 1 and 100),
  phone text check (phone is null or char_length(phone) <= 30),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users may change only their own name and phone, never their role.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Helper used by security rules: is the current user an admin?
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Security rules (RLS)
create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Admins read all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Create a profile automatically when someone signs up.
-- Only 'parent' or 'tutor' can be requested; anything else becomes 'parent'.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    case when requested = 'tutor' then 'tutor'::public.user_role
         else 'parent'::public.user_role end,
    coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 100), ''), 'New user')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();