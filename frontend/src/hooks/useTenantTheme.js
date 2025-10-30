import { useEffect, useState } from 'react';

const BASE_URL = 'http://localhost:5001';

const DEFAULT_THEME = {
  primaryColor: '#222',
  secondaryColor: '#555',
  logoUrl: '',
  heroText: 'Bienvenido'
};

export default function useTenantTheme(institutionId) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!institutionId) {
      // No institution yet, keep defaults and don't fetch
      return;
    }

    const ctrl = new AbortController();
    const signal = ctrl.signal;

    async function fetchTheme() {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/tenant-config/${encodeURIComponent(institutionId)}`, { signal });
        if (!res.ok) {
          // keep defaults on non-OK
          setTheme(DEFAULT_THEME);
          return;
        }
        const json = await res.json();
        // Merge with defaults so missing fields don't break the UI
        setTheme({ ...DEFAULT_THEME, ...(json || {}) });
      } catch (err) {
        if (err.name === 'AbortError') return; // fetch aborted, ignore
        // On error keep defaults
        setTheme(DEFAULT_THEME);
      } finally {
        setLoading(false);
      }
    }

    fetchTheme();

    return () => {
      ctrl.abort();
    };
  }, [institutionId]);

  return { loading, theme };
}
