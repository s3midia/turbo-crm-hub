-- Cache de scraping do Instagram para evitar gastar créditos de proxy a cada visita.
create table if not exists public.instagram_cache (
  username text primary key,
  posts jsonb not null,
  fetched_at timestamptz not null default now()
);

create index if not exists instagram_cache_fetched_at_idx
  on public.instagram_cache (fetched_at desc);

alter table public.instagram_cache enable row level security;

-- Leitura pública (galerias renderizadas em sites publicados).
create policy "instagram_cache_read_all"
  on public.instagram_cache for select
  using (true);

-- Escrita só via service_role (Edge Function).
create policy "instagram_cache_write_service"
  on public.instagram_cache for all
  to service_role
  using (true) with check (true);
