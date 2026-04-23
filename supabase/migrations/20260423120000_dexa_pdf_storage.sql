-- Private bucket for DEXA PDFs uploaded by members (not required for the row to exist; optional archive).
-- Path: {auth.uid()}/{object_name} — RLS on storage.objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dexa-reports',
  'dexa-reports',
  false,
  12582912,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated: read/write only inside own folder (first path segment = user id)
drop policy if exists "dexa_reports_read_own" on storage.objects;
drop policy if exists "dexa_reports_insert_own" on storage.objects;
drop policy if exists "dexa_reports_update_own" on storage.objects;
drop policy if exists "dexa_reports_delete_own" on storage.objects;

create policy "dexa_reports_read_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'dexa-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "dexa_reports_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'dexa-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "dexa_reports_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'dexa-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'dexa-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "dexa_reports_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'dexa-reports'
    and split_part(name, '/', 1) = auth.uid()::text
  );
