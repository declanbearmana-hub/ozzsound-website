-- Ozzsound V1.8 enquiry schema alignment
-- Safe to run on the existing project. It adds any missing columns and aligns the public INSERT policy.

create table if not exists public.enquiries (
  id uuid primary key,
  created_at timestamptz not null default now()
);

alter table public.enquiries
  add column if not exists enquiry_ref text,
  add column if not exists enquiry_type text,
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists event_type text,
  add column if not exists event_date date,
  add column if not exists venue_suburb text,
  add column if not exists approx_guests integer,
  add column if not exists event_times text,
  add column if not exists message text,
  add column if not exists upload_folder text,
  add column if not exists upload_paths jsonb not null default '[]'::jsonb,
  add column if not exists upload_count integer not null default 0,
  add column if not exists attachment_paths jsonb not null default '[]'::jsonb,
  add column if not exists display_photo_paths jsonb not null default '[]'::jsonb,
  add column if not exists enquiry_data jsonb not null default '{}'::jsonb,
  add column if not exists source text not null default 'website',
  add column if not exists status text not null default 'new';

-- Older test schemas may have NOT NULL fields the early website did not populate.
-- V1.8 now populates these fields, while keeping the migration tolerant of existing test rows.
alter table public.enquiries alter column enquiry_ref drop not null;
alter table public.enquiries alter column enquiry_type drop not null;
alter table public.enquiries alter column name drop not null;
alter table public.enquiries alter column phone drop not null;
alter table public.enquiries alter column event_type drop not null;
alter table public.enquiries alter column event_date drop not null;
alter table public.enquiries alter column venue_suburb drop not null;

alter table public.enquiries enable row level security;

grant insert on table public.enquiries to anon;
revoke select, update, delete on table public.enquiries from anon;

drop policy if exists "Allow public enquiry submissions" on public.enquiries;
create policy "Allow public enquiry submissions"
on public.enquiries
for insert
to anon
with check (
  coalesce(char_length(name),0) between 1 and 120
  and coalesce(char_length(phone),0) between 1 and 60
  and coalesce(char_length(event_type),0) between 1 and 80
  and coalesce(char_length(venue_suburb),0) between 1 and 200
  and upload_count between 0 and 100
);

-- Helpful uniqueness for real enquiry references, while allowing old NULL test rows.
create unique index if not exists enquiries_enquiry_ref_unique
on public.enquiries (enquiry_ref)
where enquiry_ref is not null;
