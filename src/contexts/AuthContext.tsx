import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { setAuditUser } from '../hooks/useAudit';

interface AuthContextType {
  dbUser: any | null;
  isLoading: boolean;
  signIn: (cpf: string, senha: string) => Promise<{ error?: string }>;
  signOut: () => void;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType>({
  dbUser: null,
  isLoading: true,
  signIn: async () => ({}),
  signOut: () => {},
  updatePassword: async () => ({}),
  theme: 'dark',
  toggleTheme: () => {},
});

const SESSION_KEY = 'crm_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('crm_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setDbUser(user);
        setAuditUser(user.id, user.nome);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('crm_theme', theme);
  }, [theme]);

  const signIn = async (cpf: string, senha: string): Promise<{ error?: string }> => {
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      return { error: 'CPF deve ter 11 dígitos.' };
    }

    const { data: existingUser, error: fetchError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('cpf', cleanCpf)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { error: 'Erro ao verificar usuário: ' + fetchError.message };
    }

    if (existingUser) {
      if (existingUser.senha !== senha) {
        return { error: 'CPF ou senha incorretos.' };
      }
      if (!existingUser.status_acesso) {
        return { error: 'PENDING' };
      }
      setDbUser(existingUser);
      setAuditUser(existingUser.id, existingUser.nome);
      localStorage.setItem(SESSION_KEY, JSON.stringify(existingUser));
      // If first login with temp password, signal it
      if (existingUser.senha === '123456' || existingUser.senha_temporaria) {
        return { error: 'CHANGE_PASSWORD' };
      }
      return {};
    } else {
      if (senha !== '123456') {
        return { error: 'Usuário não encontrado. Se é seu primeiro acesso, a senha padrão é 123456.' };
      }
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert([{ cpf: cleanCpf, nome: `Usuário ${cleanCpf}`, senha, status_acesso: false, role: 'Liderança', senha_temporaria: true }])
        .select()
        .single();

      if (createError) {
        return { error: 'Erro ao criar cadastro: ' + createError.message };
      }

      return { error: 'PENDING' };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error?: string }> => {
    if (!dbUser) return { error: 'Não autenticado.' };
    if (newPassword.length < 6) return { error: 'A senha deve ter pelo menos 6 caracteres.' };

    const { error } = await supabase
      .from('usuarios')
      .update({ senha: newPassword, senha_temporaria: false })
      .eq('id', dbUser.id);

    if (error) return { error: 'Erro ao atualizar senha: ' + error.message };

    const updated = { ...dbUser, senha: newPassword, senha_temporaria: false };
    setDbUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return {};
  };

  const signOut = () => {
    setDbUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <AuthContext.Provider value={{ dbUser, isLoading, signIn, signOut, updatePassword, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
