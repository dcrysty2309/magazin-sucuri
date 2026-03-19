import { Injectable } from '@angular/core';

import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminOrderDetail, AdminOrderListItem, AdminOrderStatus } from '../models/admin-order.model';

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  constructor(private readonly api: AdminApiService) {}

  async getOrders(): Promise<AdminOrderListItem[]> {
    const payload = await this.api.get<{ orders: AdminOrderListItem[] }>('/api/admin/orders');
    return payload.orders ?? [];
  }

  async getOrder(id: string): Promise<AdminOrderDetail> {
    const payload = await this.api.get<{ order: AdminOrderDetail }>(`/api/admin/orders/${id}`);
    return payload.order;
  }

  async updateOrder(id: string, data: { status: AdminOrderStatus | string }): Promise<AdminOrderListItem> {
    const payload = await this.api.patch<{ order: AdminOrderListItem }>(`/api/admin/orders/${id}`, data);
    return payload.order;
  }
}
