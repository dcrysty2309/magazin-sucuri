import { computed, Injectable, signal } from '@angular/core';

import { apiUrl } from '../utils/api-url';

export interface AuthUser {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  emailVerified?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly initializedState = signal(false);
  private readonly loadingState = signal(false);
  private readonly userState = signal<AuthUser | null>(null);

  readonly initialized = computed(() => this.initializedState());
  readonly loading = computed(() => this.loadingState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => Boolean(this.userState()));
  readonly displayName = computed(() => {
    const user = this.userState();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });
  readonly initials = computed(() => {
    const user = this.userState();
    return user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';
  });

  async initialize(): Promise<void> {
    if (this.initializedState()) {
      return;
    }

    this.loadingState.set(true);

    try {
      await this.refreshSession();
    } finally {
      this.initializedState.set(true);
      this.loadingState.set(false);
    }
  }

  async login(credentials: { email: string; password: string; remember: boolean }): Promise<{ ok: boolean; message?: string }> {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const payload = await response.json();

    if (!response.ok) {
      return { ok: false, message: payload.message || 'Autentificarea a esuat.' };
    }

    this.userState.set(payload.user);
    this.initializedState.set(true);
    return { ok: true, message: payload.message };
  }

  async refreshSession(): Promise<void> {
    try {
      const response = await fetch(apiUrl('/api/auth/me'), {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        this.userState.set(null);
        return;
      }

      const payload = await response.json();
      this.userState.set(payload.user ?? null);
    } catch {
      this.userState.set(null);
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      this.userState.set(null);
      this.initializedState.set(true);
    }
  }
}
