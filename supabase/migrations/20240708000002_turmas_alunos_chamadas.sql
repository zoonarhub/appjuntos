create table if not exists turma_alunos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid references turmas(id) on delete cascade,
  nome text not null,
  telefone text,
  eleitor_id uuid references eleitores(id) on delete set null,
  created_at timestamp with time zone default now()
);

create table if not exists turma_chamadas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid references turmas(id) on delete cascade,
  data text not null,
  observacao text,
  created_at timestamp with time zone default now()
);

create table if not exists turma_chamada_alunos (
  chamada_id uuid references turma_chamadas(id) on delete cascade,
  turma_aluno_id uuid references turma_alunos(id) on delete cascade,
  presente boolean default false,
  primary key(chamada_id, turma_aluno_id)
);

alter table turma_alunos enable row level security;
alter table turma_chamadas enable row level security;
alter table turma_chamada_alunos enable row level security;

create policy "Allow all actions for authenticated and anon users" on turma_alunos for all using (true);
create policy "Allow all actions for authenticated and anon users" on turma_chamadas for all using (true);
create policy "Allow all actions for authenticated and anon users" on turma_chamada_alunos for all using (true);
