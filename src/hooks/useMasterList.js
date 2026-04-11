import { useState, useEffect } from 'react';
import { getMasterList, refreshMasterList } from '../services/masterListService';
import { refreshDefaultSessions } from '../services/defaultSessionsService';

function useMasterList() {
  const [names, setNames] = useState([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load cached master list on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await getMasterList();
        setNames(data.names);
        setLastRefreshedAt(data.lastRefreshedAt);
      } catch (err) {
        console.error('Failed to load master list:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Manual refresh from Google Sheets — refreshes both master list and default session columns
  async function refresh() {
    setRefreshing(true);
    try {
      // Run both in parallel; default sessions failure is non-fatal
      const [masterResult, defaultResult] = await Promise.allSettled([
        refreshMasterList(),
        refreshDefaultSessions(),
      ]);

      if (masterResult.status === 'rejected') {
        throw masterResult.reason;
      }

      if (defaultResult.status === 'rejected') {
        console.warn('Failed to refresh default session lists:', defaultResult.reason);
      }

      const data = masterResult.value;
      setNames(data.names);
      setLastRefreshedAt(data.lastRefreshedAt);
      return { success: true };
    } catch (err) {
      console.error('Failed to refresh master list:', err);
      return { success: false, error: err.message };
    } finally {
      setRefreshing(false);
    }
  }

  return { names, lastRefreshedAt, loading, refreshing, refresh };
}

export default useMasterList;
