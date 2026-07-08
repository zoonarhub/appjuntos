-- Update admin CPF from 00000000000 to 18201716710
UPDATE public.usuarios SET cpf = '18201716710', nome = 'Administrador do Sistema' WHERE cpf = '00000000000';

-- If not exists, insert the new admin
INSERT INTO public.usuarios (cpf, nome, role, status_acesso, senha)
VALUES ('18201716710', 'Administrador do Sistema', 'Administrador', true, '123456')
ON CONFLICT (cpf) DO UPDATE SET 
  nome = 'Administrador do Sistema',
  role = 'Administrador',
  status_acesso = true,
  senha = '123456';
