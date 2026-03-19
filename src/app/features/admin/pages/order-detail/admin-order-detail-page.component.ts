import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminActionBarComponent } from '../../../../shared/admin-ui/action-bar/admin-action-bar.component';
import { AdminBadgeComponent } from '../../../../shared/admin-ui/badge/admin-badge.component';
import { AdminButtonComponent } from '../../../../shared/admin-ui/button/admin-button.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminEmptyStateComponent } from '../../../../shared/admin-ui/empty-state/admin-empty-state.component';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { CANONICAL_ORDER_STATUSES, getDisplayOrderStatus, getOrderStatusTone, OrderStatusBadgeTone } from '../../../../core/utils/order-status';
import { AdminOrderDetail, AdminOrderStatus } from '../../models/admin-order.model';
import { AdminOrdersService } from '../../services/admin-orders.service';

@Component({
  selector: 'app-admin-order-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    AdminActionBarComponent,
    AdminBadgeComponent,
    AdminButtonComponent,
    AdminCardComponent,
    AdminEmptyStateComponent,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
  ],
  templateUrl: './admin-order-detail-page.component.html',
  styleUrl: './admin-order-detail-page.component.scss',
})
export class AdminOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(AdminOrdersService);
  readonly statuses = CANONICAL_ORDER_STATUSES;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly order = signal<AdminOrderDetail | null>(null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const id = this.route.snapshot.paramMap.get('id') || '';
      this.order.set(await this.ordersService.getOrder(id));
    } catch {
      this.serverError.set('Nu am putut incarca detaliile comenzii.');
    } finally {
      this.loading.set(false);
    }
  }

  async updateStatus(status: AdminOrderStatus): Promise<void> {
    const order = this.order();
    if (!order) {
      return;
    }

    this.saving.set(true);
    this.serverError.set('');

    try {
      const updated = await this.ordersService.updateOrder(order.id, { status });
      this.order.update((current) => (current ? { ...current, ...updated } : current));
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut actualiza statusul.');
    } finally {
      this.saving.set(false);
    }
  }

  displayStatus(status: string): string {
    return getDisplayOrderStatus(status);
  }

  statusTone(status: string): OrderStatusBadgeTone {
    return getOrderStatusTone(status);
  }
}
