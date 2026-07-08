-- Adiciona coluna senha e remove dependência de auth.users
-- Também cria o primeiro usuário administrador

-- Adicionar coluna de senha na tabela usuarios (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'senha'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN senha text;
  END IF;
END $$;

-- Remove a constraint de user_id_auth se existir (para auth customizado)
ALTER TABLE usuarios ALTER COLUMN user_id_auth DROP NOT NULL;

-- Inserir usuário administrador padrão (CPF: 000.000.000-00 / senha: 123456)
INSERT INTO usuarios (cpf, nome, role, status_acesso, senha)
VALUES ('00000000000', 'Administrador do Sistema', 'Administrador', true, '123456')
ON CONFLICT (cpf) DO NOTHING;
