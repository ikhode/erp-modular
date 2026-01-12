import {useCallback, useEffect, useRef, useState} from 'react';
import {isOnline, syncQueue} from '../lib/storage';

// Optimized sync configuration
const SYNC_CONFIG = {
  MAX_BATCH_SIZE: 10,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  SYNC_INTERVAL: 30 * 60 * 1000, // 30 minutes
  BACKOFF_MULTIPLIER: 2,
  MAX_BACKOFF_DELAY: 30000, // 30 seconds
};

// Enhanced sync with batching, retry logic, and resource management
const syncToSupabase = async (operations: Array<{
  id: number;
  operation: string;
  table: string;
  data: Record<string, unknown>;
  retryCount?: number;
}>) => {
  const results = [];

  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < operations.length; i += SYNC_CONFIG.MAX_BATCH_SIZE) {
    const batch = operations.slice(i, i + SYNC_CONFIG.MAX_BATCH_SIZE);

    try {
      // Use Promise.allSettled for better error handling
      const batchResults = await Promise.allSettled(
        batch.map(async (item) => {
          let attempt = item.retryCount || 0;

          while (attempt < SYNC_CONFIG.MAX_RETRIES) {
            try {
              // TODO: Implement actual Supabase sync with proper authentication
              console.log(`Syncing ${item.operation} on ${item.table}:`, item.data);

              // Simulate network delay and potential failures
              await new Promise((resolve, reject) => {
                setTimeout(() => {
                  // Simulate occasional failures (10% chance)
                  if (Math.random() < 0.1) {
                    reject(new Error('Network error'));
                  } else {
                    resolve(true);
                  }
                }, 100 + Math.random() * 200); // 100-300ms delay
              });

              return { success: true, item };
            } catch (error) {
              attempt++;
              if (attempt < SYNC_CONFIG.MAX_RETRIES) {
                const delay = Math.min(
                  SYNC_CONFIG.RETRY_DELAY * Math.pow(SYNC_CONFIG.BACKOFF_MULTIPLIER, attempt - 1),
                  SYNC_CONFIG.MAX_BACKOFF_DELAY
                );
                console.warn(`Retry ${attempt}/${SYNC_CONFIG.MAX_RETRIES} for item ${item.id} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                throw error;
              }
            }
          }
        })
      );

      // Process batch results
      batchResults.forEach((result, index) => {
        const item = batch[index];
        if (result.status === 'fulfilled') {
          results.push({ success: true, item: item });
        } else {
          console.error(`Failed to sync item ${item.id} after ${SYNC_CONFIG.MAX_RETRIES} retries:`, result.reason);
          results.push({ success: false, item: item, error: result.reason });
        }
      });

      // Small delay between batches to prevent overwhelming
      if (i + SYNC_CONFIG.MAX_BATCH_SIZE < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      console.error('Batch sync failed:', error);
      // Mark all items in this batch as failed
      batch.forEach(item => {
        results.push({ success: false, item, error });
      });
    }
  }

  return results;
};

export const useOnlineSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState({
    totalSynced: 0,
    totalFailed: 0,
    lastSyncDuration: 0,
  });

  // Use refs to track sync state and prevent duplicate syncs
  const isCurrentlySyncing = useRef(false);
  const lastSyncAttempt = useRef<Date | null>(null);

  const performSync = useCallback(async (force = false) => {
    // Prevent duplicate syncs
    if (isCurrentlySyncing.current && !force) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    // Rate limiting: don't sync more than once every 30 seconds unless forced
    const now = new Date();
    if (!force && lastSyncAttempt.current &&
        (now.getTime() - lastSyncAttempt.current.getTime()) < 30000) {
      console.log('Sync rate limited, skipping...');
      return;
    }

    lastSyncAttempt.current = now;
    isCurrentlySyncing.current = true;
    setIsSyncing(true);

    const startTime = Date.now();

    try {
      const pendingItems = await syncQueue.getPending();

      if (pendingItems.length === 0) {
        console.log('No pending items to sync');
        setLastSync(new Date());
        return;
      }

      console.log(`Starting sync of ${pendingItems.length} pending items...`);

      // Add retry count to items that don't have it
      const itemsWithRetry = pendingItems.map(item => ({
        ...item,
        retryCount: item.retryCount || 0
      }));

      const results = await syncToSupabase(itemsWithRetry);

      let syncedCount = 0;
      let failedCount = 0;

      // Process results and update retry counts
      for (const result of results) {
        if (result.success) {
          await syncQueue.markSynced(result.item.id!);
          syncedCount++;
        } else {
          // Increment retry count and update item
          const updatedItem = {
            ...result.item,
            retryCount: (result.item.retryCount || 0) + 1,
            lastError: result.error?.message || 'Unknown error',
            updatedAt: new Date()
          };

          // If max retries reached, mark as failed permanently or quarantine
          if (updatedItem.retryCount >= SYNC_CONFIG.MAX_RETRIES) {
            console.error(`Item ${result.item.id} failed permanently after ${SYNC_CONFIG.MAX_RETRIES} retries`);
            await syncQueue.markFailed(result.item.id!);
          } else {
            await syncQueue.updateRetryCount(result.item.id!, updatedItem.retryCount);
          }

          failedCount++;
        }
      }

      const duration = Date.now() - startTime;
      setLastSync(new Date());
      setSyncStats(prev => ({
        totalSynced: prev.totalSynced + syncedCount,
        totalFailed: prev.totalFailed + failedCount,
        lastSyncDuration: duration,
      }));

      console.log(`Sync completed: ${syncedCount} synced, ${failedCount} failed, took ${duration}ms`);

    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      isCurrentlySyncing.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Sync when coming online (with debouncing)
  useEffect(() => {
    let onlineTimeout: NodeJS.Timeout;

    const handleOnline = () => {
      console.log('Connection restored, scheduling sync...');
      // Debounce online events to prevent multiple rapid syncs
      clearTimeout(onlineTimeout);
      onlineTimeout = setTimeout(async () => {
        if (isOnline()) {
          await performSync();
        }
      }, 2000); // Wait 2 seconds after coming online
    };

    const handleOffline = () => {
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if already online
    if (isOnline()) {
      performSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(onlineTimeout);
    };
  }, [performSync]);

  // Periodic sync with adaptive interval
  useEffect(() => {
    const getAdaptiveInterval = () => {
      // If there are frequent failures, increase interval
      const failureRate = syncStats.totalFailed / Math.max(syncStats.totalSynced + syncStats.totalFailed, 1);
      if (failureRate > 0.5) {
        return SYNC_CONFIG.SYNC_INTERVAL * 2; // Double interval on high failure rate
      }
      return SYNC_CONFIG.SYNC_INTERVAL;
    };

    const interval = setInterval(() => {
      if (isOnline() && !isCurrentlySyncing.current) {
        performSync();
      }
    }, getAdaptiveInterval());

    return () => clearInterval(interval);
  }, [performSync, syncStats]);

  const forceSync = useCallback(() => {
    if (isOnline()) {
      performSync(true);
    } else {
      console.warn('Cannot force sync: offline');
    }
  }, [performSync]);

  const getSyncHealth = useCallback(() => {
    const total = syncStats.totalSynced + syncStats.totalFailed;
    const successRate = total > 0 ? (syncStats.totalSynced / total) * 100 : 100;

    return {
      health: successRate > 95 ? 'excellent' : successRate > 80 ? 'good' : successRate > 60 ? 'fair' : 'poor',
      successRate: Math.round(successRate),
      averageDuration: syncStats.lastSyncDuration,
      pendingItems: 0, // Would need to be calculated
    };
  }, [syncStats]);

  return {
    isOnline: isOnline(),
    isSyncing,
    lastSync,
    syncStats,
    forceSync,
    getSyncHealth,
  };
};