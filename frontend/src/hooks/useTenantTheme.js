// useTenantTheme: DEPRECATED
// Tenant theming is now resolved server-side from MongoDB. Keep a minimal stub
// here so existing imports don't break while the frontend reads branding from
// server-rendered data or from API endpoints that already provide the resolved
// theme at render time.

import { useMemo } from 'react';

const DEFAULT_THEME = {
  primaryColor: '#222',
  secondaryColor: '#f4f4f4',
  logoUrl: '',
  heroText: ''
};

export default function useTenantTheme(/* institutionId */) {
  // Return a stable object to avoid re-renders; loading is always false because
  // theming is handled by the backend / MongoDB now.
  const theme = useMemo(() => ({ ...DEFAULT_THEME }), []);
  return { loading: false, theme };
}
