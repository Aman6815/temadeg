-- 03: tutor documents (metadata table + private storage bucket)

create type public.document_type as enum (
  'national_id', 'student_id', 'transcript', 'grade8_result',
  'grade12_result', 'degree', 'certificate', 'other'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.tutor_applications (id) on delete cascade,
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  doc_type public.document_type not null,
  storage_path text not null unique,
  original_name text not null check (char_length(original_name) between 1 and 200),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now(),
  -- the file must be inside the tutor's own folder, with no path tricks
  constraint path_in_tutor_folder check (
    storage_path like (tutor_id::text || '/%')
    and storage_path not like '%..%'
  )
);

alter table public.documents enable row level security;

revoke all on public.documents from anon, authenticated;
grant select, delete on public.documents to authenticated;
grant insert (
  application_id, tutor_id, doc_type, storage_path,
  original_name, mime_type, size_bytes
) on public.documents to authenticated;

create policy "Tutors read their own documents"
  on public.documents for select to authenticated
  using (tutor_id = (select auth.uid()));

create policy "Admins read all documents"
  on public.documents for select to authenticated
  using (public.is_admin());

create policy "Tutors add documents while their application is open"
  on public.documents for insert to authenticated
  with check (
    tutor_id = (select auth.uid())
    and exists (
      select 1 from public.tutor_applications a
      where a.id = application_id
        and a.tutor_id = (select auth.uid())
        and a.status in ('draft', 'needs_info')
    )
  );

create policy "Tutors delete documents while their application is open"
  on public.documents for delete to authenticated
  using (
    tutor_id = (select auth.uid())
    and exists (
      select 1 from public.tutor_applications a
      where a.id = application_id
        and a.tutor_id = (select auth.uid())
        and a.status in ('draft', 'needs_info')
    )
  );

-- Private storage bucket: 5 MB limit, PDF / JPEG / PNG only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tutor-documents', 'tutor-documents', false, 5242880,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do nothing;

-- Storage access rules
create policy "Tutors upload to their own folder while application is open"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tutor-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.my_role() = 'tutor'
    and exists (
      select 1 from public.tutor_applications a
      where a.tutor_id = (select auth.uid())
        and a.status in ('draft', 'needs_info')
    )
  );

create policy "Tutors read their own files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tutor-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Admins read all tutor files"
  on storage.objects for select to authenticated
  using (bucket_id = 'tutor-documents' and public.is_admin());

create policy "Tutors delete their own files while application is open"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tutor-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.tutor_applications a
      where a.tutor_id = (select auth.uid())
        and a.status in ('draft', 'needs_info')
    )
  );