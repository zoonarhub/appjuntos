-- Migration: Add new fields to eleitores and coordenadores tables
-- Run this in Supabase SQL Editor

-- 1. Add new required + optional fields to eleitores
ALTER TABLE eleitores
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS titulo_eleitor TEXT,
  ADD COLUMN IF NOT EXISTS zona_eleitoral TEXT,
  ADD COLUMN IF NOT EXISTS secao_eleitoral TEXT,
  ADD COLUMN IF NOT EXISTS indicado_por UUID,
  ADD COLUMN IF NOT EXISTS nota_ruas INTEGER,
  ADD COLUMN IF NOT EXISTS nota_iluminacao INTEGER,
  ADD COLUMN IF NOT EXISTS nota_seguranca INTEGER,
  ADD COLUMN IF NOT EXISTS nota_saude INTEGER,
  ADD COLUMN IF NOT EXISTS necessidade_principal TEXT,
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual';

-- 2. Add link_token to coordenadores
ALTER TABLE coordenadores
  ADD COLUMN IF NOT EXISTS link_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS total_indicados INTEGER DEFAULT 0;

-- 3. Generate unique tokens for existing coordenadores
UPDATE coordenadores 
SET link_token = LOWER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 10))
WHERE link_token IS NULL;

-- 4. Also add link_token support for usuarios (lideranças etc)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS link_token TEXT UNIQUE;

UPDATE usuarios
SET link_token = LOWER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 10))
WHERE link_token IS NULL;
