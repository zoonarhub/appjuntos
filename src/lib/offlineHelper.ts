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

  // Tenta salvar no Supabase
  try {
    let error: any = null;
    if (operation === 'INSERT') {
      const result = await supabase.from(tableName).insert([payload]);
      error = result.error;
    } else if (operation === 'UPDATE' && recordId) {
      const result = await supabase.from(tableName).update(payload).eq('id', recordId);
      error = result.error;
    }

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
    // Qualquer exceção de rede -> enfileira local
    await queueSyncOperation(tableName, operation, payload, recordId);
    return { success: true, savedLocally: true };
  }
}
