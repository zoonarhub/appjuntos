import { supabase } from '../lib/supabase';

let cachedUserId: string | null = null;
let cachedUserName: string | null = null;

export const setAuditUser = (id: string, nome: string) => {
  cachedUserId = id;
  cachedUserName = nome;
};

export const auditLog = async (acao: string, modulo: string, status = 'sucesso') => {
  try {
    await supabase.from('auditoria_logs').insert([{
      usuario_id: cachedUserId,
      usuario_nome: cachedUserName || 'Sistema',
      acao,
      modulo,
      ip: '—',
      status,
      created_at: new Date().toISOString(),
    }]);
  } catch {
    // silently fail — audit should never break the app
  }
};
