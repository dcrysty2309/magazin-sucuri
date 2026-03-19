import { Injectable } from '@angular/core';

import { apiUrl } from '../utils/api-url';

@Injectable({ providedIn: 'root' })
export class AdminService {
  async login(credentials: { email: string; password: string; remember: boolean }): Promise<{ ok: boolean; message?: string }> {
    const response = await fetch(apiUrl('/api/admin/login'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const payload = await response.json();
    return response.ok
      ? { ok: true, message: payload.message }
      : { ok: false, message: payload.message || 'Autentificarea admin a esuat.' };
  }
}
