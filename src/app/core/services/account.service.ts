import { Injectable } from '@angular/core';

import { apiUrl } from '../utils/api-url';

export interface AccountOrder {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    name: string;
    variant: string;
    quantity: number;
  }>;
}

export interface AccountAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  county: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
}

export interface AccountOverview {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  highlights: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
  recentOrders: AccountOrder[];
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  async getOverview(): Promise<AccountOverview> {
    const response = await fetch(apiUrl('/api/account/overview'), {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Nu am putut incarca dashboard-ul.');
    }

    return response.json();
  }

  async getOrders(): Promise<AccountOrder[]> {
    const response = await fetch(apiUrl('/api/account/orders'), {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Nu am putut incarca comenzile.');
    }

    const payload = await response.json();
    return payload.orders ?? [];
  }

  async getAddresses(): Promise<AccountAddress[]> {
    const response = await fetch(apiUrl('/api/account/addresses'), {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Nu am putut incarca adresele.');
    }

    const payload = await response.json();
    return payload.addresses ?? [];
  }
}
