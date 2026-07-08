-- Drop objects if exist
drop table if exists visitas cascade;
drop table if exists eventos cascade;
drop table if exists turmas cascade;
drop table if exists projetos cascade;
drop table if exists nucleos cascade;
drop table if exists eleitores cascade;
drop table if exists coordenadores cascade;
drop table if exists usuarios cascade;

-- Tabela Usuários
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  user_id_auth uuid references auth.users(id) on delete cascade,
  cpf text unique not null,
  nome text not null,
  role text default 'Liderança',
  status_acesso boolean default false,
  created_at timestamp with time zone default now()
);

-- Tabela Coordenadores
create table coordenadores (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete cascade,
  nome text not null,
  cpf text unique not null,
  tipo text not null,
  regiao text not null,
  bairro text not null,
  municipio text not null default 'Rio de Janeiro',
  lat double precision,
  lng double precision,
  meta integer default 0,
  equipe integer default 0,
  votos integer default 0,
  link text,
  status text default 'ativo',
  created_at timestamp with time zone default now()
);

-- Tabela Eleitores
create table eleitores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text unique,
  telefone text,
  sexo text check (sexo in ('M', 'F')),
  idade integer,
  bairro text,
  municipio text default 'Rio de Janeiro',
  zona text,
  secao text,
  lat double precision,
  lng double precision,
  confirmou_voto text default 'indeciso',
  influencia integer default 0,
  votos_familia integer default 0,
  status text default 'pendente',
  coordenador_id uuid references coordenadores(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Tabela Núcleos
create table nucleos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  regiao text not null,
  bairro text not null,
  municipio text default 'Rio de Janeiro',
  lat double precision,
  lng double precision,
  responsavel text,
  coordenador_id uuid references coordenadores(id) on delete set null,
  descricao text,
  equipe integer default 0,
  participantes integer default 0,
  projetos_count integer default 0,
  eventos_count integer default 0,
  meta integer default 0,
  status text default 'ativo',
  created_at timestamp with time zone default now()
);

-- Tabela Projetos
create table projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nucleo_id uuid references nucleos(id) on delete cascade,
  categoria text not null,
  responsavel text,
  descricao text,
  status text default 'ativo',
  data_inicio text,
  data_termino text,
  created_at timestamp with time zone default now()
);

-- Tabela Turmas (Vinculada a Projetos)
create table turmas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid references projetos(id) on delete cascade,
  nome text not null,
  professor text,
  horario text,
  alunos_matriculados integer default 0,
  status text default 'ativa',
  created_at timestamp with time zone default now()
);

-- Tabela Eventos
create table eventos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null,
  data text,
  hora text,
  local text,
  bairro text,
  municipio text default 'Rio de Janeiro',
  responsavel text,
  descricao text,
  participantes integer default 0,
  custo numeric default 0,
  status text default 'agendado',
  created_at timestamp with time zone default now()
);

-- Tabela Visitas
create table visitas (
  id uuid primary key default gen_random_uuid(),
  endereco text not null,
  bairro text not null,
  data text,
  hora text,
  responsavel text,
  observacoes text,
  resultado text default 'pendente',
  proxima_visita text,
  created_at timestamp with time zone default now()
);

-- Policies & RLS
alter table usuarios enable row level security;
alter table coordenadores enable row level security;
alter table eleitores enable row level security;
alter table nucleos enable row level security;
alter table projetos enable row level security;
alter table turmas enable row level security;
alter table eventos enable row level security;
alter table visitas enable row level security;

-- Para fins de protótipo vamos permitir acesso anônimo inicial para leitura/escrita, 
-- depois iremos restringir por auth.uid() no sistema real
create policy "Allow all actions for authenticated and anon users" on usuarios for all using (true);
create policy "Allow all actions for authenticated and anon users" on coordenadores for all using (true);
create policy "Allow all actions for authenticated and anon users" on eleitores for all using (true);
create policy "Allow all actions for authenticated and anon users" on nucleos for all using (true);
create policy "Allow all actions for authenticated and anon users" on projetos for all using (true);
create policy "Allow all actions for authenticated and anon users" on turmas for all using (true);
create policy "Allow all actions for authenticated and anon users" on eventos for all using (true);
create policy "Allow all actions for authenticated and anon users" on visitas for all using (true);

-- Criar a trigger para inserir na tabela usuarios ao criar usuário no auth.users
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.usuarios (user_id_auth, cpf, nome, status_acesso)
  values (new.id, split_part(new.email, '@', 1), new.raw_user_meta_data->>'nome', false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
