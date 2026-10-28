-- Run in Supabase SQL Editor before enabling the admin invoice workspace.
-- The public/anon website has no access to invoices.
create sequence if not exists public.ozzsound_invoice_number_seq start 1;
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('OZZ-' || lpad(nextval('public.ozzsound_invoice_number_seq')::text, 6, '0')),
  invoice_date date not null default current_date,
  due_date date,
  enquiry_id uuid references public.enquiries(id) on delete set null,
  customer_name text not null,
  business_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  customer_address text not null default '',
  event_type text not null default '',
  event_date date,
  venue text not null default '',
  venue_address text not null default '',
  start_time text not null default '',
  finish_time text not null default '',
  items jsonb not null default '[]'::jsonb,
  deposit numeric(12,2) not null default 0 check (deposit >= 0),
  gst_enabled boolean not null default false,
  bank_name text not null default '',
  bsb text not null default '',
  account_number text not null default '',
  notes text not null default '',
  status text not null default 'draft' check (status in ('draft','sent','paid','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_items_array check (jsonb_typeof(items) = 'array'),
  constraint customer_name_present check (char_length(trim(customer_name)) > 0)
);
alter table public.invoices enable row level security;
revoke all on public.invoices from anon;
grant select,insert,update,delete on public.invoices to authenticated;
grant usage,select on sequence public.ozzsound_invoice_number_seq to authenticated;
drop policy if exists "Invoice management restricted to administrators" on public.invoices;
create policy "Invoice management restricted to administrators"
on public.invoices for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
-- Updated timestamp for edits
create or replace function public.ozzsound_touch_invoice_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists touch_ozzsound_invoice_updated_at on public.invoices;
create trigger touch_ozzsound_invoice_updated_at before update on public.invoices
for each row execute function public.ozzsound_touch_invoice_updated_at();
