import { Injectable } from '@angular/core';

import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminCustomerDetail, AdminCustomerListItem } from '../models/admin-customer.model';

@Injectable({ providedIn: 'root' })
export class AdminCustomersService {
  constructor(private readonly api: AdminApiService) {}

  async getCustomers(): Promise<AdminCustomerListItem[]> {
    const payload = await this.api.get<{ customers: AdminCustomerListItem[] }>('/api/admin/customers');
    return payload.customers ?? [];
  }

  async getCustomer(id: string): Promise<AdminCustomerDetail> {
    const payload = await this.api.get<{ customer: AdminCustomerDetail }>(`/api/admin/customers/${id}`);
    return payload.customer;
  }
}
