-- Lotus Business - table des infos publiees par les administrateurs
-- A executer dans Supabase SQL Editor avant d'utiliser /api/admin/infos.

create extension if not exists "pgcrypto";

create table if not exists public.infos (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  content text not null,
  "imageUrl" text,
  "imageFileId" text,
  "imageFilePath" text,
  "thumbnailUrl" text,
  published boolean not null default true,
  "publishedAt" timestamp(3) without time zone not null default current_timestamp,
  "createdAt" timestamp(3) without time zone not null default current_timestamp,
  "updatedAt" timestamp(3) without time zone not null default current_timestamp
);

alter table public.infos add column if not exists "imageFileId" text;
alter table public.infos add column if not exists "imageFilePath" text;
alter table public.infos add column if not exists "thumbnailUrl" text;

create index if not exists infos_published_published_at_idx
  on public.infos (published, "publishedAt" desc);

create or replace function public.set_infos_updated_at()
returns trigger as $$
begin
  new."updatedAt" = current_timestamp;
  return new;
end;
$$ language plpgsql;

drop trigger if exists infos_set_updated_at on public.infos;

create trigger infos_set_updated_at
before update on public.infos
for each row
execute function public.set_infos_updated_at();
