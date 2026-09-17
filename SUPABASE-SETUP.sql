-- Ozzsound website enquiry storage
-- Run this once in Supabase > SQL Editor for the Ozzsound Website project.
-- It creates a private enquiry table that public website visitors can INSERT into,
-- but cannot SELECT, UPDATE or DELETE from.

create table if not exists public.enquiries (
  id uuid primary key,
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text,
  event_type text not null,
  event_date date not null,
  venue_suburb text not null,
  approx_guests integer,
  event_times text,
  message text,
  upload_folder text,
  upload_paths jsonb not null default '[]'::jsonb,
  upload_count integer not null default 0,
  source text not null default 'website',
  status text not null default 'new'
);

alter table public.enquiries enable row level security;

grant insert on table public.enquiries to anon;
revoke select, update, delete on table public.enquiries from anon;

drop policy if exists "Allow public enquiry submissions" on public.enquiries;
create policy "Allow public enquiry submissions"
on public.enquiries
for insert
to anon
with check (
  char_length(name) between 1 and 120
  and char_length(phone) between 1 and 60
  and char_length(event_type) between 1 and 80
  and char_length(venue_suburb) between 1 and 200
  and upload_count between 0 and 100
);

-- No public SELECT policy is created. Enquiries stay unreadable to website visitors.
