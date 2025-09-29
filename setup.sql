-- ============================================
-- FOCUSONIT - DATABASE SETUP
-- ============================================
-- Ejecutar este script en tu Supabase SQL Editor

-- Tabla principal de tareas
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  due_date timestamptz,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Para futura integración con Google Calendar
  google_event_id text unique,
  synced_with_calendar boolean default false
);

-- Row Level Security (RLS)
alter table tasks enable row level security;

-- Políticas: usuarios solo ven sus tareas
create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Índices para performance
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists tasks_due_date_idx on tasks(due_date);
create index if not exists tasks_completed_idx on tasks(completed);

-- Función para actualizar updated_at automáticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para updated_at
drop trigger if exists update_tasks_updated_at on tasks;
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute procedure update_updated_at_column();

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================
-- Descomenta las siguientes líneas para crear tareas de ejemplo
-- Nota: Reemplaza 'USER_ID_AQUI' con tu UUID de usuario real

/*
insert into tasks (user_id, title, description, due_date, completed) values
  ('USER_ID_AQUI', 'Configurar Supabase', 'Crear cuenta y configurar proyecto', now(), true),
  ('USER_ID_AQUI', 'Crear primera tarea', 'Probar el sistema de tareas', now(), false),
  ('USER_ID_AQUI', 'Revisar emails', null, now() + interval '1 day', false),
  ('USER_ID_AQUI', 'Llamar al cliente', 'Seguimiento de proyecto X', now() + interval '2 days', false),
  ('USER_ID_AQUI', 'Preparar presentación', 'Para reunión del viernes', now() + interval '5 days', false);
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas queries para verificar que todo está correcto

-- Ver todas las tablas
select table_name from information_schema.tables where table_schema = 'public';

-- Ver políticas de RLS
select * from pg_policies where tablename = 'tasks';

-- Ver índices
select indexname, indexdef from pg_indexes where tablename = 'tasks';