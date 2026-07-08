import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { localDb } from '../lib/db';
import { useNotifications } from '../contexts/NotificationContext';

export function useSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addNotification('Conexão restabelecida. Sincronizando dados...', 'info');
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addNotification('Você está offline. Os dados serão salvos localmente.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check
    if (navigator.onLine) {
      syncData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);

    try {
      // Get pending operations
      const pendingOps = await localDb.syncQueue.where('status').equals('pending').toArray();
      if (pendingOps.length === 0) {
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const op of pendingOps) {
        try {
          if (op.operation === 'INSERT') {
            const { error } = await supabase.from(op.tableName).insert([op.payload]);
            if (error) throw error;
          } else if (op.operation === 'UPDATE' && op.recordId) {
            const { error } = await supabase.from(op.tableName).update(op.payload).eq('id', op.recordId);
            if (error) throw error;
          } else if (op.operation === 'DELETE' && op.recordId) {
            const { error } = await supabase.from(op.tableName).delete().eq('id', op.recordId);
            if (error) throw error;
          }
          
          // Delete operation from queue upon success
          await localDb.syncQueue.delete(op.id!);
          successCount++;
        } catch (err: any) {
          console.error(`Failed to sync operation ${op.id}`, err);
          await localDb.syncQueue.update(op.id!, { 
            status: 'error', 
            errorMessage: err?.message || 'Erro desconhecido'
          });
          errorCount++;
        }
      }

      if (successCount > 0) {
        addNotification(`${successCount} registros sincronizados com sucesso.`, 'success');
      }
      if (errorCount > 0) {
        addNotification(`Erro ao sincronizar ${errorCount} registros. Verifique mais tarde.`, 'error');
      }

    } catch (err) {
      console.error('Erro na rotina de sincronização', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return { isOnline, isSyncing, syncData };
}
