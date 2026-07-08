import Dexie, { type Table } from 'dexie';

export interface SyncOperation {
  id?: number; // Auto-increment primary key in IndexedDB
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  recordId?: string; // ID for UPDATE/DELETE operations
  status: 'pending' | 'error';
  errorMessage?: string;
  createdAt: number;
}

export class AppDatabase extends Dexie {
  syncQueue!: Table<SyncOperation, number>;

  constructor() {
    super('AppJuntosLocalDB');
    this.version(1).stores({
      syncQueue: '++id, tableName, operation, status, createdAt'
    });
  }
}

export const localDb = new AppDatabase();

/**
 * Adds an operation to the sync queue.
 */
export async function queueSyncOperation(
  tableName: string, 
  operation: 'INSERT' | 'UPDATE' | 'DELETE', 
  payload: any, 
  recordId?: string
) {
  return await localDb.syncQueue.add({
    tableName,
    operation,
    payload,
    recordId,
    status: 'pending',
    createdAt: Date.now()
  });
}
