import { useState, useEffect } from 'react';
import { getMasterList, refreshMasterList } from '../services/masterListService';

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

  // Manual refresh from Google Sheets
  async function refresh() {
    setRefreshing(true);
    try {
      const data = await refreshMasterList();
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
