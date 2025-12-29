// ============================================
// API Client
// ============================================

import type {
  LoginRequest,
  LoginResponse,
  ValidateResponse,
  ErrorResponse,
} from '@shared/types';

const API_BASE =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8888/.netlify/functions'
    : '/.netlify/functions';

class APIClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('btk_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('btk_token', token);
    } else {
      localStorage.removeItem('btk_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      throw new Error(error.error || 'An unexpected error occurred.');
    }

    return data as T;
  }

  // Auth
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('auth-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('auth-logout', { method: 'POST' });
    this.setToken(null);
  }

  async validateToken(): Promise<ValidateResponse> {
    return this.request<ValidateResponse>('auth-validate');
  }
}

export const api = new APIClient();
