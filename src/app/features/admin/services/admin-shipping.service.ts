import { Injectable } from '@angular/core';

import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminShippingSettings } from '../models/admin-shipping.model';

@Injectable({ providedIn: 'root' })
export class AdminShippingService {
  constructor(private readonly api: AdminApiService) {}

  getSettings(): Promise<AdminShippingSettings> {
    return this.api.get<AdminShippingSettings>('/api/admin/shipping');
  }

  updateSettings(data: AdminShippingSettings): Promise<AdminShippingSettings> {
    return this.api.post<AdminShippingSettings>('/api/admin/shipping', data);
  }
}
