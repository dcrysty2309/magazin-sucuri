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

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly deletingOrderId = signal('');
  readonly selectedOrder = signal<any | null>(null);
  readonly orders = signal<any[]>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.orders.set(await this.adminService.getOrders());
    } catch {
      this.serverError.set('Nu am putut incarca comenzile.');
    } finally {
      this.loading.set(false);
    }
  }

  async updateStatus(order: any, status: string): Promise<void> {
    const updated = await this.adminService.updateOrder(order.id, { status });
    this.orders.update((items) => items.map((item) => (item.id === order.id ? updated : item)));
    if (this.selectedOrder()?.id === order.id) {
      await this.openDetails(updated);
    }
  }

  async openDetails(order: any): Promise<void> {
    this.selectedOrder.set(await this.adminService.getOrder(order.id));
  }

  closeDetails(): void {
    this.selectedOrder.set(null);
  }

  async deleteOrder(order: any): Promise<void> {
    this.deletingOrderId.set(order.id);
    this.serverError.set('');

    try {
      const result = await this.adminService.deleteOrder(order.id);
      this.toastMessage.set(result.message);
      this.orders.update((items) => items.filter((item) => item.id !== order.id));
      if (this.selectedOrder()?.id === order.id) {
        this.closeDetails();
      }
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut sterge comanda.');
    } finally {
      this.deletingOrderId.set('');
    }
  }
}
