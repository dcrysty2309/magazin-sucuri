import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminActionBarComponent } from '../../../../shared/admin-ui/action-bar/admin-action-bar.component';
import { AdminBadgeComponent } from '../../../../shared/admin-ui/badge/admin-badge.component';
import { AdminButtonComponent } from '../../../../shared/admin-ui/button/admin-button.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminDataTableComponent } from '../../../../shared/admin-ui/data-table/admin-data-table.component';
import { AdminEmptyStateComponent } from '../../../../shared/admin-ui/empty-state/admin-empty-state.component';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { CANONICAL_ORDER_STATUSES, getDisplayOrderStatus, getOrderStatusTone, OrderStatusBadgeTone } from '../../../../core/utils/order-status';
import { AdminOrderListItem, AdminOrderStatus } from '../../models/admin-order.model';
import { AdminOrdersService } from '../../services/admin-orders.service';

@Component({
  selector: 'app-admin-orders-page',
  standalone: true,
  imports: [
    RouterLink,
    AdminActionBarComponent,
    AdminBadgeComponent,
    AdminButtonComponent,
    AdminCardComponent,
    AdminDataTableComponent,
    AdminEmptyStateComponent,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
  ],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
})
export class AdminOrdersPageComponent {
  private readonly ordersService = inject(AdminOrdersService);
  readonly statuses = CANONICAL_ORDER_STATUSES;

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly orders = signal<AdminOrderListItem[]>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.orders.set(await this.ordersService.getOrders());
    } catch {
      this.serverError.set('Nu am putut incarca comenzile.');
    } finally {
      this.loading.set(false);
    }
  }

  async updateStatus(order: AdminOrderListItem, status: AdminOrderStatus): Promise<void> {
    const updated = await this.ordersService.updateOrder(order.id, { status });
    this.orders.update((items) => items.map((item) => (item.id === order.id ? updated : item)));
  }

  displayStatus(status: string): string {
    return getDisplayOrderStatus(status);
  }

  statusTone(status: string): OrderStatusBadgeTone {
    return getOrderStatusTone(status);
  }
}
