import { Component, computed, inject, signal } from '@angular/core';

import {
  DashboardExportType,
  DashboardOrderStatus,
  DashboardRange,
  DashboardService,
} from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly exporting = signal<DashboardExportType | ''>('');
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly stats = signal<any[]>([]);
  readonly recentOrders = signal<any[]>([]);
  readonly range = signal<DashboardRange>('7');
  readonly exportMenuOpen = signal(false);
  readonly salesByDay = signal<Array<{ label: string; value: number }>>([]);
  readonly popularProducts = signal<Array<{ label: string; value: number }>>([]);
  readonly updatingOrderIds = signal<string[]>([]);
  readonly maxSalesValue = computed(() => Math.max(1, ...this.salesByDay().map((item) => item.value)));
  readonly maxPopularValue = computed(() => Math.max(1, ...this.popularProducts().map((item) => item.value)));
  readonly orderStatuses: DashboardOrderStatus[] = ['Noua', 'In pregatire', 'In livrare', 'Livrata'];

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    await this.fetchDashboard(true);
  }

  async changeRange(range: DashboardRange): Promise<void> {
    if (this.range() === range) {
      return;
    }

    this.range.set(range);
    this.exportMenuOpen.set(false);
    await this.fetchDashboard(false);
  }

  async refresh(): Promise<void> {
    this.exportMenuOpen.set(false);
    await this.fetchDashboard(false);
  }

  async updateStatus(order: any, event: Event): Promise<void> {
    const nextStatus = (event.target as HTMLSelectElement | null)?.value as DashboardOrderStatus | undefined;
    if (!nextStatus || order.status === nextStatus) {
      return;
    }

    this.serverError.set('');
    this.updatingOrderIds.update((ids) => [...ids, order.id]);

    try {
      await this.dashboardService.updateOrderStatus(order.id, nextStatus);
      this.showToast(`Statusul comenzii ${order.code} a fost actualizat.`);
      await this.fetchDashboard(false);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut actualiza comanda.');
    } finally {
      this.updatingOrderIds.update((ids) => ids.filter((id) => id !== order.id));
    }
  }

  async exportReport(type: DashboardExportType): Promise<void> {
    this.exportMenuOpen.set(false);
    this.exporting.set(type);
    this.serverError.set('');

    try {
      const result = await this.dashboardService.exportReport(type);
      const objectUrl = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
      this.showToast(`Raportul ${type.toUpperCase()} a fost descarcat.`);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut exporta raportul.');
    } finally {
      this.exporting.set('');
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }

  isUpdatingOrder(orderId: string): boolean {
    return this.updatingOrderIds().includes(orderId);
  }

  toggleExportMenu(): void {
    if (this.exporting()) {
      return;
    }

    this.exportMenuOpen.update((open) => !open);
  }

  private async fetchDashboard(usePrimaryLoader: boolean): Promise<void> {
    if (usePrimaryLoader) {
      this.loading.set(true);
    } else {
      this.refreshing.set(true);
    }

    this.serverError.set('');

    try {
      const [stats, sales, recentOrders, topProducts] = await Promise.all([
        this.dashboardService.getStats(),
        this.dashboardService.getSales(this.range()),
        this.dashboardService.getRecentOrders(),
        this.dashboardService.getTopProducts(this.range()),
      ]);

      this.stats.set(stats);
      this.salesByDay.set(sales);
      this.recentOrders.set(recentOrders);
      this.popularProducts.set(topProducts);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut incarca dashboard-ul admin.');
    } finally {
      this.loading.set(false);
      this.refreshing.set(false);
    }
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    window.setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set('');
      }
    }, 2600);
  }
}
