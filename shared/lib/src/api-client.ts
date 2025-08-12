import type { Practice, Provider } from '@hotdoc-alt/models';

export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: () => Promise<string | undefined>;
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Add auth token if available
    if (this.config.getAuthToken) {
      const token = await this.config.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Practices
  async createPractice(practiceData: Omit<Practice, 'practiceId' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<Practice> {
    return this.request<Practice>('/v1/practices', {
      method: 'POST',
      headers: {
        'x-tenant-id': tenantId
      },
      body: JSON.stringify(practiceData)
    });
  }

  async getPractices(params?: { postcode?: string; radiusKm?: string }): Promise<{ practices: Practice[]; count: number }> {
    const searchParams = new URLSearchParams();
    if (params?.postcode) searchParams.set('postcode', params.postcode);
    if (params?.radiusKm) searchParams.set('radiusKm', params.radiusKm);
    
    const endpoint = `/v1/practices${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.request<{ practices: Practice[]; count: number }>(endpoint);
  }

  async getPractice(practiceId: string): Promise<Practice> {
    return this.request<Practice>(`/v1/practices/${practiceId}`);
  }

  // Providers
  async createProvider(providerData: Omit<Provider, 'providerId' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<Provider> {
    return this.request<Provider>('/v1/providers', {
      method: 'POST',
      headers: {
        'x-tenant-id': tenantId
      },
      body: JSON.stringify(providerData)
    });
  }

  async getProvider(providerId: string): Promise<Provider> {
    return this.request<Provider>(`/v1/providers/${providerId}`);
  }

  // Slots
  async getSlots(params: {
    practiceId: string;
    providerId?: string;
    from?: string;
    to?: string;
  }) {
    const searchParams = new URLSearchParams();
    searchParams.set('practiceId', params.practiceId);
    if (params.providerId) searchParams.set('providerId', params.providerId);
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);

    return this.request(`/v1/slots?${searchParams}`);
  }

  // Bookings
  async createBooking(bookingData: any, idempotencyKey?: string) {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }

    return this.request('/v1/bookings', {
      method: 'POST',
      headers,
      body: JSON.stringify(bookingData)
    });
  }

  async getBooking(bookingId: string) {
    return this.request(`/v1/bookings/${bookingId}`);
  }

  async confirmBooking(bookingId: string, confirmationCode?: string) {
    return this.request(`/v1/bookings/${bookingId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ confirmationCode })
    });
  }
}