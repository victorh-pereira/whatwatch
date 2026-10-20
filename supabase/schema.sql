-- ============================================================
-- WhatWatch — Schema do Supabase
-- Execute este script no Editor SQL do painel do Supabase
-- (https://supabase.com/dashboard -> SQL Editor -> New query)
-- ============================================================

-- ------------------------------------------------------------
-- Tabela de favoritos (lista pessoal)
-- ------------------------------------------------------------
create table if not exists public.favorites (
  user_id     uuid not null references auth.users (id) on delete cascade,
  media_id    integer not null,
  media_type  text not null check (media_type in ('movie', 'tv')),
  title       text not null,
  poster_path text,
  backdrop_path text,
  vote_average numeric,
  release_date text,
  created_at  timestamptz not null default now(),
  primary key (user_id, media_id, media_type)
);

-- ------------------------------------------------------------
-- Tabela de avaliações (estrelas 1 a 5)
-- ------------------------------------------------------------
create table if not exists public.ratings (
  user_id    uuid not null references auth.users (id) on delete cascade,
  media_id   integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title      text not null,
  poster_path text,
  stars      integer not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, media_id, media_type)
);

-- ------------------------------------------------------------
-- Tabela de histórico de visualizações
-- ------------------------------------------------------------
create table if not exists public.watch_history (
  user_id     uuid not null references auth.users (id) on delete cascade,
  media_id    integer not null,
  media_type  text not null check (media_type in ('movie', 'tv')),
  title       text not null,
  poster_path text,
  backdrop_path text,
  viewed_at   timestamptz not null default now(),
  primary key (user_id, media_id, media_type)
);

-- ------------------------------------------------------------
-- Row Level Security: cada usuário só acessa os próprios dados
-- ------------------------------------------------------------
alter table public.favorites enable row level security;
alter table public.ratings enable row level security;
alter table public.watch_history enable row level security;

-- Favorites
create policy "Leitura própria nos favoritos"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Inserir nos próprios favoritos"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Remover dos próprios favoritos"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- Ratings
create policy "Leitura própria nas avaliações"
  on public.ratings for select
  using (auth.uid() = user_id);

create policy "Inserir nas próprias avaliações"
  on public.ratings for insert
  with check (auth.uid() = user_id);

create policy "Atualizar as próprias avaliações"
  on public.ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Remover as próprias avaliações"
  on public.ratings for delete
  using (auth.uid() = user_id);

-- Watch history
create policy "Leitura própria no histórico"
  on public.watch_history for select
  using (auth.uid() = user_id);

create policy "Inserir no próprio histórico"
  on public.watch_history for insert
  with check (auth.uid() = user_id);

create policy "Atualizar o próprio histórico"
  on public.watch_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Limpar o próprio histórico"
  on public.watch_history for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Índices para performance
-- ------------------------------------------------------------
create index if not exists favorites_user_idx
  on public.favorites (user_id, created_at desc);

create index if not exists ratings_user_idx
  on public.ratings (user_id, updated_at desc);

create index if not exists history_user_idx
  on public.watch_history (user_id, viewed_at desc);
