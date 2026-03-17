import { Injectable } from '@angular/core';

import { apiUrl } from '../utils/api-url';
import { DEFAULT_STORE_SETTINGS, StoreSettings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  async getSettings(): Promise<StoreSettings> {
    const response = await fetch(apiUrl('/api/settings'), {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Settings endpoint unavailable.');
    }

    const payload = await response.json();
    return this.normalize(payload.settings);
  }

  async updateSettings(settings: StoreSettings): Promise<StoreSettings> {
    const normalized = this.normalize(settings);

    const response = await fetch(apiUrl('/api/settings'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: normalized }),
    });

    if (!response.ok) {
      throw new Error('Settings endpoint unavailable.');
    }

    const payload = await response.json();
    return this.normalize(payload.settings ?? normalized);
  }

  private normalize(input: Partial<StoreSettings> | null | undefined): StoreSettings {
    return {
      general: {
        ...DEFAULT_STORE_SETTINGS.general,
        ...(input?.general ?? {}),
      },
      shipping: {
        ...DEFAULT_STORE_SETTINGS.shipping,
        ...(input?.shipping ?? {}),
        zones: Array.isArray(input?.shipping?.zones) ? input!.shipping!.zones : DEFAULT_STORE_SETTINGS.shipping.zones,
      },
      payments: {
        ...DEFAULT_STORE_SETTINGS.payments,
        ...(input?.payments ?? {}),
      },
      seo: {
        ...DEFAULT_STORE_SETTINGS.seo,
        ...(input?.seo ?? {}),
      },
      taxes: {
        ...DEFAULT_STORE_SETTINGS.taxes,
        ...(input?.taxes ?? {}),
      },
      location: {
        ...DEFAULT_STORE_SETTINGS.location,
        ...(input?.location ?? {}),
      },
    };
  }
}
