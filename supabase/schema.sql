-- ==============================================================================
-- HUÍOS - RETIRO ESPIRITUAL
-- Script de Banco de Dados e Regras de Segurança (RLS) para Inscrições e Área Administrativa
-- Executar no SQL Editor do Dashboard do Supabase (https://app.supabase.com)
-- ==============================================================================

-- 1. Criação ou Atualização da Tabela de Inscrições
create table if not exists public.inscricoes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  nome text not null,
  email text not null,
  telefone text,
  data_nascimento date,
  idade integer,
  batizado text,
  membro_igreja text,
  igreja text,
  retiro text default 'Retiro Huíos' not null,
  status text default 'pendente' check (status in ('pendente', 'confirmada')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migração para adicionar colunas caso a tabela já tenha sido criada anteriormente
alter table public.inscricoes add column if not exists data_nascimento date;
alter table public.inscricoes add column if not exists retiro text default 'Retiro Huíos';
alter table public.inscricoes add column if not exists status text default 'pendente' check (status in ('pendente', 'confirmada'));

-- Índices de performance
create index if not exists idx_inscricoes_user_id on public.inscricoes(user_id);
create index if not exists idx_inscricoes_status on public.inscricoes(status);
create index if not exists idx_inscricoes_created_at on public.inscricoes(created_at desc);

-- 2. Tabela de Perfis e Permissões (public.profiles)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text default 'participante' check (role in ('participante', 'adm')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Política RLS para profiles: O usuário autenticado pode consultar seu próprio perfil
drop policy if exists "Permitir leitura ao próprio perfil" on public.profiles;
create policy "Permitir leitura ao próprio perfil"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Concede permissões para as roles de API do Supabase
grant select on public.profiles to authenticated, anon;

-- Função de segurança no banco para verificar se o usuário autenticado é ADM
-- 'security definer' garante que a consulta ao profiles seja feita de forma confiável
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'adm'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- 3. Habilitação de Row Level Security (RLS) na Tabela de Inscrições
alter table public.inscricoes enable row level security;

-- Política 1 (INSERT): Participante pode criar apenas sua própria inscrição, obrigatoriamente com status 'pendente'
drop policy if exists "Usuário pode criar sua própria inscrição" on public.inscricoes;
create policy "Usuário pode criar sua própria inscrição"
  on public.inscricoes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id 
    and (status is null or status = 'pendente')
  );

-- Política 2 (SELECT): Participante pode ver apenas sua própria inscrição OU Administrador pode ver todas
drop policy if exists "Usuário pode consultar sua própria inscrição" on public.inscricoes;
drop policy if exists "Usuário ou Admin pode consultar inscrições" on public.inscricoes;
create policy "Usuário ou Admin pode consultar inscrições"
  on public.inscricoes
  for select
  to authenticated
  using (
    auth.uid() = user_id 
    or public.is_admin()
  );

-- Política 3 (UPDATE): Apenas administradores podem atualizar inscrições (como confirmar status)
-- Participantes comuns NÃO podem alterar status nem dados de inscrições
drop policy if exists "Usuário pode atualizar sua própria inscrição" on public.inscricoes;
drop policy if exists "Admin pode atualizar inscrições" on public.inscricoes;
create policy "Admin pode atualizar inscrições"
  on public.inscricoes
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- COMO TORNAR UM USUÁRIO ADMINISTRADOR:
-- Para atribuir perfil de administrador a um usuário existente:
--
-- update public.profiles
-- set role = 'adm'
-- where id in (select id from auth.users where email = 'seu_email@exemplo.com');
-- ==============================================================================
