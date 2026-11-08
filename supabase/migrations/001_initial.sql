-- Wedding Legacy 2.0 / initial schema (apply only after review in a new Supabase project)
create extension if not exists pgcrypto;
create table if not exists public.guests (
 id uuid primary key default gen_random_uuid(),
 display_name text not null check(length(display_name) between 1 and 120),
 category text not null default 'general' check(category in ('general','friends','colleagues','family','vip')),
 greeting text,
 letter_template text,
 letter_override text,
 chamber_id uuid,
 token_hash text unique not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.blessings (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 80),
 message text not null check(length(message) between 1 and 1200),
 kind text not null default 'blessing' check(kind in ('blessing','memory','advice')),
 approved boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.capsule_messages (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 1 and 80),
 message text not null check(length(message) between 1 and 1800),
 kind text not null default 'wish' check(kind in ('wish','prediction','memory','advice')),
 created_at timestamptz not null default now()
);
create table if not exists public.story_chapters (
 id uuid primary key default gen_random_uuid(),
 title text not null, body text not null default '',
 image_path text, sort_order integer not null default 0,
 published boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.gallery_media (
 id uuid primary key default gen_random_uuid(),
 event text not null check(event in ('mehendi','sangeet','haldi','wedding')),
 storage_path text not null, caption text,
 approved boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.family_chambers (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 letter text, media_path text,
 created_at timestamptz not null default now()
);
alter table public.guests add constraint guests_chamber_fk foreign key (chamber_id) references public.family_chambers(id);
create table if not exists public.site_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create or replace function public.is_site_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.site_admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;
alter table public.guests enable row level security;
alter table public.blessings enable row level security;
alter table public.capsule_messages enable row level security;
alter table public.story_chapters enable row level security;
alter table public.gallery_media enable row level security;
alter table public.family_chambers enable row level security;
alter table public.site_admins enable row level security;
create policy "admins read guests" on public.guests for select to authenticated using (public.is_site_admin());
create policy "admins manage guests" on public.guests for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "admins manage blessings" on public.blessings for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "admins manage capsule" on public.capsule_messages for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "admins manage chapters" on public.story_chapters for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "admins manage media" on public.gallery_media for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "admins manage chambers" on public.family_chambers for all to authenticated using (public.is_site_admin()) with check (public.is_site_admin());
create policy "admins read admins" on public.site_admins for select to authenticated using (public.is_site_admin());
create policy "public chapters" on public.story_chapters for select to anon,authenticated using (published);
create policy "public approved media" on public.gallery_media for select to anon,authenticated using (approved);
create or replace view public.public_blessings with (security_invoker = true) as
 select id,name,message,kind,created_at from public.blessings where approved = true;
-- Public approved blessing read is intentionally permitted; unapproved records remain private.
create policy "public approved blessings" on public.blessings for select to anon,authenticated using (approved = true);
-- IMPORTANT: No anonymous insert policies: public writes must pass through rate-limited
-- server-side endpoints (Edge Functions), which validate inputs and use service credentials.
-- No public read policy on capsule_messages, guests, or family_chambers.
-- Anniversary content must be released by server-side policy after 2027-12-05
-- in the agreed timezone; never expose raw capsule records through a public table.
