-- ============================================================
-- App de torneos de tenis · esquema para Supabase
-- Correr una vez en SQL Editor. Luego correr seed.sql.
-- ============================================================

-- Todos los datos viven como documentos JSON con una ruta:
--   config/app                          -> torneo activo
--   torneos/{id}                        -> datos y convocatoria del torneo
--   torneos/{id}/cuadros/{SV|SF|DV|DF}  -> jugadores, grupos, partidos y llaves
--   torneos/{id}/res/{partido}          -> resultado de cada partido
create table if not exists public.docs (
  path       text primary key,
  coleccion  text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists docs_coleccion_idx on public.docs (coleccion);

-- Seguridad: cualquiera puede LEER; solo usuarios con sesión (editores) pueden ESCRIBIR.
alter table public.docs enable row level security;

drop policy if exists "lectura publica"     on public.docs;
drop policy if exists "editores insertan"   on public.docs;
drop policy if exists "editores actualizan" on public.docs;
drop policy if exists "editores borran"     on public.docs;

create policy "lectura publica"     on public.docs for select to anon, authenticated using (true);
create policy "editores insertan"   on public.docs for insert to authenticated with check (true);
create policy "editores actualizan" on public.docs for update to authenticated using (true) with check (true);
create policy "editores borran"     on public.docs for delete to authenticated using (true);

grant select on public.docs to anon, authenticated;
grant insert, update, delete on public.docs to authenticated;

-- Tiempo real: la vista pública se actualiza sola cuando capturas un resultado.
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- Almacenamiento para pósters de torneos (lectura pública, subida solo editores).
insert into storage.buckets (id, name, public) values ('publico', 'publico', true)
on conflict (id) do nothing;

drop policy if exists "publico lectura" on storage.objects;
drop policy if exists "publico subir"   on storage.objects;
drop policy if exists "publico cambiar" on storage.objects;
create policy "publico lectura" on storage.objects for select using (bucket_id = 'publico');
create policy "publico subir"   on storage.objects for insert to authenticated with check (bucket_id = 'publico');
create policy "publico cambiar" on storage.objects for update to authenticated using (bucket_id = 'publico');
