-- ============================================================
-- WhatWatch — Watchlist (Quero assistir / Assistido)
-- ============================================================

-- Tabela única: cada título tem um status por vez.
-- "Quero assistir" e "Assistido" são estados mutuamente exclusivos:
-- marcar como Assistido remove automaticamente da lista "Quero assistir".
create table if not exists public.watchlist (
  user_id       uuid not null references auth.users (id) on delete cascade,
  media_id      integer not null,
  media_type    text not null check (media_type in ('movie', 'tv')),
  status        text not null check (status in ('want', 'watched')),
  title         text not null,
  poster_path   text,
  backdrop_path text,
  vote_average  numeric,
  release_date  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (user_id, media_id, media_type)
);

alter table public.watchlist enable row level security;

create policy "Leitura propria na watchlist" on public.watchlist
  for select using (auth.uid() = user_id);

create policy "Inserir na propria watchlist" on public.watchlist
  for insert with check (auth.uid() = user_id);

create policy "Atualizar a propria watchlist" on public.watchlist
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Remover da propria watchlist" on public.watchlist
  for delete using (auth.uid() = user_id);

create index if not exists watchlist_user_idx
  on public.watchlist (user_id, status, updated_at desc);
