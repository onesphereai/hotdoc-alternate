import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Practice {
  practiceId: string;
  tenantId: string;
  name: string;
  address: {
    line1: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
  };
  services: string[];
  hours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Provider {
  providerId: string;
  tenantId: string;
  practiceId: string;
  name: string;
  specialties: string[];
  languages: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiClient {
  createPractice: (practiceData: any, tenantId: string) => Promise<Practice>;
  getPractices: () => Promise<{ practices: Practice[]; count: number }>;
  createProvider: (providerData: any, tenantId: string) => Promise<Provider>;
  getProviders: (practiceId?: string) => Promise<{ providers: Provider[]; count: number; practiceId?: string }>;
}

export function useApi(): ApiClient {
  const { getToken } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const apiClient = useMemo(() => {
    const request = async (endpoint: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {})
      };

      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${baseUrl}${endpoint}`;

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    };

    return {
      createPractice: async (practiceData: any, tenantId: string) => {
        return request('/v1/practices', {
          method: 'POST',
          headers: { 'x-tenant-id': tenantId },
          body: JSON.stringify(practiceData)
        });
      },

      getPractices: async () => {
        return request('/v1/practices');
      },

      createProvider: async (providerData: any, tenantId: string) => {
        return request('/v1/providers', {
          method: 'POST',
          headers: { 'x-tenant-id': tenantId },
          body: JSON.stringify(providerData)
        });
      },

      getProviders: async (practiceId?: string) => {
        const queryParams = practiceId ? `?practiceId=${encodeURIComponent(practiceId)}` : '';
        return request(`/v1/providers${queryParams}`);
      }
    };
  }, [getToken, baseUrl]);

  return apiClient;
}