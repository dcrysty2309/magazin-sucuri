import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminBadgeComponent } from '../../../../shared/admin-ui/badge/admin-badge.component';
import { AdminButtonComponent } from '../../../../shared/admin-ui/button/admin-button.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminDataTableComponent } from '../../../../shared/admin-ui/data-table/admin-data-table.component';
import { AdminEmptyStateComponent } from '../../../../shared/admin-ui/empty-state/admin-empty-state.component';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { AdminStatCardComponent } from '../../../../shared/admin-ui/stat-card/admin-stat-card.component';
import { DashboardService, DashboardSummary } from '../../../../core/services/dashboard.service';
import { getDisplayOrderStatus, getOrderStatusTone, OrderStatusBadgeTone } from '../../../../core/utils/order-status';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    AdminBadgeComponent,
    AdminButtonComponent,
    AdminCardComponent,
    AdminDataTableComponent,
    AdminEmptyStateComponent,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
    AdminStatCardComponent,
  ],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly summary = signal<DashboardSummary>({ ordersToday: 0, revenueToday: 0 });
  readonly recentOrders = signal<any[]>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    await this.fetchDashboard();
  }

  displayStatus(status: string): string {
    return getDisplayOrderStatus(status);
  }

  statusTone(status: string): OrderStatusBadgeTone {
    return getOrderStatusTone(status);
  }

  paymentLabel(paymentStatus: string): string {
    return paymentStatus === 'Platita' ? 'Card' : 'La livrare';
  }

  paymentTone(paymentStatus: string): OrderStatusBadgeTone {
    return paymentStatus === 'Platita' ? 'info' : 'neutral';
  }

  private async fetchDashboard(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const [statsPayload, recentOrders] = await Promise.all([
        this.dashboardService.getStats(),
        this.dashboardService.getRecentOrders(),
      ]);

      this.summary.set(statsPayload.summary);
      this.recentOrders.set(recentOrders);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut incarca dashboard-ul admin.');
    } finally {
      this.loading.set(false);
    }
  }
}
