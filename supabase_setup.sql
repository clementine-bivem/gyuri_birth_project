-- Gyuri Orange Birthday Mailbox setup
-- 1) Replace YOUR_EMAIL@example.com with the email address you will use to log in at /letters.
-- 2) Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists birthday_messages (
  id uuid primary key default gen_random_uuid(),

  identity_type text not null,
  display_name text,

  met_from text not null,
  met_from_detail text,

  wants_letter boolean not null default false,
  wants_coupon boolean not null default false,

  coupon_type text,
  coupon_detail text,

  letter_message text,

  created_at timestamptz not null default now(),

  constraint display_name_length check (
    display_name is null or char_length(display_name) <= 80
  ),

  constraint met_from_detail_length check (
    met_from_detail is null or char_length(met_from_detail) <= 200
  ),

  constraint coupon_detail_length check (
    coupon_detail is null or char_length(coupon_detail) <= 200
  ),

  constraint letter_message_length check (
    letter_message is null or char_length(letter_message) <= 2000
  ),

  constraint at_least_one_content check (
    wants_letter = true or wants_coupon = true
  )
);

alter table birthday_messages enable row level security;

drop policy if exists "Anyone can submit birthday message" on birthday_messages;
drop policy if exists "Only Gyuri can read birthday messages" on birthday_messages;

create policy "Anyone can submit birthday message"
on birthday_messages
for insert
to anon, authenticated
with check (
  wants_letter = true or wants_coupon = true
);

create policy "Only Gyuri can read birthday messages"
on birthday_messages
for select
to authenticated
using (
  (auth.jwt() ->> 'email') = 'greenorange705@gmail.com'
);
