import {useCallback, useEffect, useState} from 'react';
import {isOnline, syncQueue} from '../lib/storage';

// Placeholder for Supabase sync functions
const syncToSupabase = async (operation: string, table: string, data: Record<string, unknown>) => {
  // TODO: Implement Supabase sync
  console.log('Syncing to Supabase:', { operation, table, data });
  await new Promise(resolve => setTimeout(resolve, 100));
  return true;
};

export const useOnlineSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Declare performSync BEFORE useEffect hooks
  const performSync = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const pendingItems = await syncQueue.getPending();

      for (const item of pendingItems) {
        try {
          const success = await syncToSupabase(item.operation, item.table, item.data);
          if (success) {
            await syncQueue.markSynced(item.id!);
          }
        } catch (error) {
          console.error('Sync failed for item:', item, error);
        }
      }

      setLastSync(new Date());
      console.log(`Synced ${pendingItems.length} items`);
    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Sync when coming online
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Connection restored, starting sync...');
      await performSync();
    };

    const handleOffline = () => {
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (isOnline()) {
      performSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSync]);

  // Periodic sync every 5 minutes if online
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline()) {
        performSync();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [performSync]);

  const forceSync = () => {
    if (isOnline()) {
      performSync();
    }
  };

  return {
    isOnline: isOnline(),
    isSyncing,
    lastSync,
    forceSync,
  };
};