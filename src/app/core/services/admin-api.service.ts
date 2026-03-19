import { Injectable } from '@angular/core';

import { apiUrl } from '../utils/api-url';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(apiUrl(path), { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Cererea admin a esuat.');
    }

    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(apiUrl(path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.message || 'Cererea admin a esuat.');
    }

    return response.json() as Promise<T>;
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(apiUrl(path), {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.message || 'Cererea admin a esuat.');
    }

    return response.json() as Promise<T>;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(apiUrl(path), {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.message || 'Cererea admin a esuat.');
    }

    return response.json() as Promise<T>;
  }
}
