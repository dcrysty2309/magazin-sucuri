import { Component, inject, signal } from '@angular/core';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
})
export class AdminOrdersPageComponent {
  private readonly adminService = inject(AdminService);

  readonly orders = signal<any[]>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.orders.set(await this.adminService.getOrders());
  }

  async markShipped(order: any): Promise<void> {
    const updated = await this.adminService.updateOrder(order.id, { status: 'In livrare' });
    this.orders.update((items) => items.map((item) => (item.id === order.id ? updated : item)));
  }
}
