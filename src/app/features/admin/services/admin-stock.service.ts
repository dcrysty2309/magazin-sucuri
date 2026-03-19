import { Injectable } from '@angular/core';

import { AdminApiService } from '../../../core/services/admin-api.service';
import { AdminStockItem } from '../models/admin-stock.model';

@Injectable({ providedIn: 'root' })
export class AdminStockService {
  constructor(private readonly api: AdminApiService) {}

  async getInventory(): Promise<AdminStockItem[]> {
    const payload = await this.api.get<{ items: AdminStockItem[] }>('/api/admin/inventory');
    return payload.items ?? [];
  }
}
