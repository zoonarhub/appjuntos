/**
 * Helper para salvar dados com fallback offline.
 * 
 * Tenta salvar no Supabase. Se não houver conexão ou ocorrer erro de rede,
 * salva na fila local do IndexedDB (Dexie) para sincronização posterior.
 */

import { supabase } from './supabase';
import { queueSyncOperation } from './db';

type OfflineSaveResult = {
  success: boolean;
  savedLocally: boolean;
  error?: string;
};

export async function saveWithOfflineFallback(
  tableName: string,
  payload: any,
  recordId?: string,
  operation: 'INSERT' | 'UPDATE' = 'INSERT'
): Promise<OfflineSaveResult> {

  // Se estiver offline, salva direto na fila local
  if (!navigator.onLine) {
    await queueSyncOperation(tableName, operation, payload, recordId);
    return { success: true, savedLocally: true };
  }

  // Tenta salvar no Supabase com um limite de tempo (Timeout) de 5 segundos
  // Isso previne que o aplicativo fique em "loading infinito" se o banco estiver pausado
  try {
    const timeoutPromise = new Promise<{ error: any }>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_ERROR')), 5000);
    });

    let queryPromise;
    if (operation === 'INSERT') {
      queryPromise = supabase.from(tableName).insert([payload]);
    } else if (operation === 'UPDATE' && recordId) {
      queryPromise = supabase.from(tableName).update(payload).eq('id', recordId);
    }

    // Espera quem resolver primeiro: a query ou o timeout
    const result = await Promise.race([queryPromise, timeoutPromise]);
    const error = (result as any)?.error;

    if (error) {
      // Verifica se é erro de rede (não de dados inválidos)
      const isNetworkError =
        error.message?.toLowerCase().includes('failed to fetch') ||
        error.message?.toLowerCase().includes('networkerror') ||
        error.message?.toLowerCase().includes('network request failed') ||
        error.code === 'ERR_NETWORK';

      if (isNetworkError) {
        await queueSyncOperation(tableName, operation, payload, recordId);
        return { success: true, savedLocally: true };
      }
      return { success: false, savedLocally: false, error: error.message };
    }

    return { success: true, savedLocally: false };
  } catch (err: any) {
    // Se caiu aqui, provavelmente foi o TIMEOUT_ERROR ou erro catastrófico de rede
    await queueSyncOperation(tableName, operation, payload, recordId);
    return { success: true, savedLocally: true };
  }
}

/**
 * Resolve an inviter's link_token or ID to their actual UUID.
 */
export async function resolveInviterId(token: string): Promise<string | null> {
  if (!token || token === 'publico' || token === 'admin') return null;

  try {
    const timeoutPromise = new Promise<string | null>((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT_ERROR')), 4000);
    });

    const fetchTask = async () => {
      // Check coordenadores by link_token
      const { data: coordByToken } = await supabase.from('coordenadores').select('id').eq('link_token', token).single();
      if (coordByToken?.id) return coordByToken.id;

      // Check usuarios by link_token
      const { data: userByToken } = await supabase.from('usuarios').select('id').eq('link_token', token).single();
      if (userByToken?.id) return userByToken.id;

      // Check liderancas by link_token
      const { data: liderByToken } = await supabase.from('liderancas').select('id').eq('link_token', token).single();
      if (liderByToken?.id) return liderByToken.id;

      // Fallback: check if the token is already a valid UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      if (isUUID) {
        const { data: coordById } = await supabase
          .from('coordenadores')
          .select('id')
          .or(`id.eq.${token},usuario_id.eq.${token}`)
          .maybeSingle();
        if (coordById?.id) return coordById.id;

        return token;
      }
      
      return null;
    };

    return await Promise.race([fetchTask(), timeoutPromise]);
  } catch {
    // Em caso de erro de rede ou timeout, retornamos o token original pra não perder a referência local
    return token;
  }
}
