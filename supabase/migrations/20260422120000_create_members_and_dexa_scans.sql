-- Members (1:1 with auth.users) and DEXA scan results for the Member Dashboard.
-- RLS: members can only read/write their own data (MemberGPT can use service role or later coach policies).
-- Apply: Supabase Dashboard -> SQL -> New query -> paste, or `supabase db push` with the Supabase CLI linked to this project.

-- ---------------------------------------------------------------------------
-- public.members
-- ---------------------------------------------------------------------------
create table if not exists public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists members_email_idx on public.members (email);

-- ---------------------------------------------------------------------------
-- public.dexa_scans
-- ---------------------------------------------------------------------------
-- Core metrics: units chosen to match common DEXA / PDF output (assessment sample PDF).
create table if not exists public.dexa_scans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  scanned_at date not null,
  total_mass_kg numeric(8, 3) not null,
  body_fat_pct numeric(6, 2) not null,
  lean_mass_kg numeric(8, 3) not null,
  fat_mass_kg numeric(8, 3) not null,
  bmc_g numeric(8, 1),
  visceral_fat_area_cm2 numeric(8, 1),
  source text not null default 'seed'
    check (source in ('seed', 'upload', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists dexa_scans_member_scanned_at_idx
  on public.dexa_scans (member_id, scanned_at desc);

-- ---------------------------------------------------------------------------
-- New auth signups: create a member row with email + name from user metadata.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      split_part(coalesce(new.email, 'member'), '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.members enable row level security;
alter table public.dexa_scans enable row level security;

-- members: self read/update
create policy "Members can read own row"
  on public.members
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Members can update own row"
  on public.members
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- dexa_scans: self CRUD
create policy "Members can read own scans"
  on public.dexa_scans
  for select
  to authenticated
  using (auth.uid() = member_id);

create policy "Members can insert own scans"
  on public.dexa_scans
  for insert
  to authenticated
  with check (auth.uid() = member_id);

create policy "Members can update own scans"
  on public.dexa_scans
  for update
  to authenticated
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

create policy "Members can delete own scans"
  on public.dexa_scans
  for delete
  to authenticated
  using (auth.uid() = member_id);

-- ---------------------------------------------------------------------------
-- Grants: authenticated can use RLS; anon has no direct table access
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select, update on public.members to authenticated;
grant all on public.members to service_role;

grant select, insert, update, delete on public.dexa_scans to authenticated;
grant all on public.dexa_scans to service_role;
