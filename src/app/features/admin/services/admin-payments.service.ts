import { Injectable } from '@angular/core';

import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminPaymentSettings } from '../models/admin-payment.model';

@Injectable({ providedIn: 'root' })
export class AdminPaymentsService {
  constructor(private readonly api: AdminApiService) {}

  getSettings(): Promise<AdminPaymentSettings> {
    return this.api.get<AdminPaymentSettings>('/api/admin/payments');
  }

  updateSettings(data: AdminPaymentSettings): Promise<AdminPaymentSettings> {
    return this.api.post<AdminPaymentSettings>('/api/admin/payments', data);
  }
}
