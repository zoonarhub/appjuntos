-- Migration: Create liderancas table
-- This table was missing from the initial schema but is referenced by the application

CREATE TABLE IF NOT EXISTS liderancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  whatsapp TEXT,
  tipo TEXT DEFAULT 'Liderança',
  regiao TEXT,
  bairro TEXT,
  municipio TEXT DEFAULT 'Rio de Janeiro',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  meta INTEGER DEFAULT 50,
  votos INTEGER DEFAULT 0,
  indicado_por TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE liderancas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all actions for authenticated and anon users" ON liderancas FOR ALL USING (true);
