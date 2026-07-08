-- Migration: Add tables for campanhas, documentos, and logs_auditoria

-- 1. Create table for Campanhas
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- WhatsApp, SMS, E-mail
  enviados INTEGER DEFAULT 0,
  abertos INTEGER DEFAULT 0,
  convertidos INTEGER DEFAULT 0,
  data TEXT NOT NULL,
  status TEXT DEFAULT 'ativo', -- ativo, agendado, rascunho
  mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Populate mock data for campanhas
INSERT INTO campanhas (nome, tipo, enviados, abertos, convertidos, data, status, mensagem)
VALUES 
('Campanha Boas-Vindas Lideranças', 'WhatsApp', 150, 142, 45, '12/04/2026', 'ativo', 'Olá! Seja bem-vindo ao grupo Juntos pelo Rio!'),
('Informativo Reunião Geral', 'SMS', 1200, 980, 110, '15/04/2026', 'ativo', 'Lembrete: Reunião do núcleo geral amanhã às 19h no Centro.'),
('Informativo de Saúde Comunitária', 'E-mail', 3200, 1850, 420, '20/04/2026', 'ativo', 'Confira as ações de saúde e exames gratuitos neste sábado.');

-- 2. Create table for Documentos
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- pdf, doc, imagem, video
  tamanho TEXT NOT NULL,
  autor TEXT NOT NULL,
  url TEXT,
  data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Populate mock data for documentos
INSERT INTO documentos (nome, tipo, tamanho, autor, data, url)
VALUES 
('Plano_Mobilizacao_Tijuca.pdf', 'pdf', '2.4 MB', 'Ana Silva', '12/05/2026', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'),
('Ata_Reuniao_CampoGrande.docx', 'doc', '542 KB', 'Bruno Santos', '15/05/2026', '#'),
('Foto_Evento_Bangu.jpg', 'imagem', '4.8 MB', 'Tatiana Gomes', '18/05/2026', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'),
('Projeto_Lei_Social_Aprovado.pdf', 'pdf', '1.2 MB', 'Ana Silva', '22/05/2026', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');

-- 3. Create table for Logs Auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario TEXT NOT NULL,
  acao TEXT NOT NULL,
  modulo TEXT NOT NULL,
  ip TEXT NOT NULL,
  data TEXT NOT NULL,
  hora TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Populate mock data for logs_auditoria
INSERT INTO logs_auditoria (usuario, acao, modulo, ip, data, hora)
VALUES 
('Admin (18201716710)', 'Realizou login no sistema', 'Login', '187.23.45.102', '07/07/2026', '18:30:15'),
('Admin (18201716710)', 'Criou novo coordenador: Carlos Souza', 'Pessoas', '187.23.45.102', '07/07/2026', '18:35:42'),
('Admin (18201716710)', 'Atualizou dados do eleitor: João da Silva', 'Eleitores', '187.23.45.102', '07/07/2026', '18:42:01'),
('Coordenador Tijuca', 'Gerou link de convite personalizado', 'Links', '179.84.12.3', '07/07/2026', '18:45:10');

