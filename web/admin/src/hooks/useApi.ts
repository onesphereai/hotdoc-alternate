import { useMemo } from 'react';
import { ApiClient } from '@hotdoc-alt/lib';
import { useAuth } from '../contexts/AuthContext';

export function useApi() {
  const { getToken } = useAuth();

  const apiClient = useMemo(() => {
    return new ApiClient({
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      getAuthToken: async () => {
        return await getToken();
      }
    });
  }, [getToken]);

  return apiClient;
}