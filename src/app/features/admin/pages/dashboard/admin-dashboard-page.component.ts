import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';
import { DashboardExportType, DashboardOrderStatus, DashboardRange, DashboardService } from '../../../../core/services/dashboard.service';
import { StatsService, DashboardStatCard } from '../../../../core/services/stats.service';
import { ChartCardComponent } from '../../components/chart-card/chart-card.component';
import { DataTableColumn, DataTableComponent } from '../../components/data-table/data-table.component';
import { StatCardComponent } from '../../components/stat-card/stat-card.component';
import { ActionButtonComponent } from '../../../../shared/ui/action-button/action-button.component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ActionButtonComponent, StatCardComponent, ChartCardComponent, DataTableComponent],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly dashboardService = inject(DashboardService);
  private readonly statsService = inject(StatsService);

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly exporting = signal<DashboardExportType | ''>('');
  readonly deletingOrderId = signal('');
  readonly deletingProductId = signal('');
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly stats = signal<DashboardStatCard[]>([]);
  readonly recentOrders = signal<any[]>([]);
  readonly products = signal<any[]>([]);
  readonly range = signal<DashboardRange>('1');
  readonly reportMenuOpen = signal(false);
  readonly exportMenuOpen = signal(false);
  readonly salesByDay = signal<Array<{ label: string; value: number; orders?: number }>>([]);
  readonly orderVolume = signal<Array<{ label: string; value: number }>>([]);
  readonly popularProducts = signal<Array<{ label: string; value: number }>>([]);
  readonly updatingOrderIds = signal<string[]>([]);
  readonly maxSalesValue = computed(() => Math.max(1, ...this.salesByDay().map((item) => item.value)));
  readonly maxOrderVolume = computed(() => Math.max(1, ...this.orderVolume().map((item) => item.value)));
  readonly maxPopularValue = computed(() => Math.max(1, ...this.popularProducts().map((item) => item.value)));
  readonly orderStatuses: DashboardOrderStatus[] = ['Noua', 'In pregatire', 'In livrare', 'Livrata'];
  readonly statsSkeleton = Array.from({ length: 4 }, (_, index) => index);
  readonly handleReportButtonClick = () => this.toggleReportMenu();
  readonly handleExportButtonClick = () => this.toggleExportMenu();

  readonly orderColumns: DataTableColumn[] = [
    { key: 'code', label: 'Comanda' },
    { key: 'customerName', label: 'Client' },
    { key: 'status', label: 'Status', kind: 'badge' },
    { key: 'total', label: 'Valoare', kind: 'currency', align: 'end' },
    { key: 'createdAt', label: 'Data', kind: 'date', align: 'end' },
  ];

  readonly productColumns: DataTableColumn[] = [
    { key: 'name', label: 'Produs' },
    { key: 'categoryName', label: 'Categorie' },
    { key: 'stockQuantity', label: 'Stoc', align: 'end' },
    { key: 'price', label: 'Pret', kind: 'currency', align: 'end' },
    { key: 'isActiveLabel', label: 'Status', kind: 'badge', align: 'end' },
  ];

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    await this.fetchDashboard(true);
  }

  async changeRange(range: DashboardRange): Promise<void> {
    if (this.range() === range) {
      this.reportMenuOpen.set(false);
      return;
    }

    this.range.set(range);
    this.reportMenuOpen.set(false);
    this.exportMenuOpen.set(false);
    await this.fetchDashboard(false);
  }

  async refresh(): Promise<void> {
    this.reportMenuOpen.set(false);
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
      await this.adminService.updateOrder(order.id, { status: nextStatus });
      this.showToast(`Statusul comenzii ${order.code} a fost actualizat.`);
      await this.fetchDashboard(false);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut actualiza comanda.');
    } finally {
      this.updatingOrderIds.update((ids) => ids.filter((id) => id !== order.id));
    }
  }

  async deleteOrder(order: any): Promise<void> {
    this.deletingOrderId.set(order.id);
    this.serverError.set('');

    try {
      const result = await this.adminService.deleteOrder(order.id);
      this.showToast(result.message);
      await this.fetchDashboard(false);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut sterge comanda.');
    } finally {
      this.deletingOrderId.set('');
    }
  }

  async toggleProduct(product: any): Promise<void> {
    this.serverError.set('');
    try {
      await this.adminService.updateProduct(product.id, { isActive: !product.isActive });
      this.showToast(`Produsul ${product.name} a fost actualizat.`);
      await this.fetchDashboard(false);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut actualiza produsul.');
    }
  }

  async deleteProduct(product: any): Promise<void> {
    this.deletingProductId.set(product.id);
    this.serverError.set('');

    try {
      const result = await this.adminService.deleteProduct(product.id);
      this.showToast(result.message);
      await this.fetchDashboard(false);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut sterge produsul.');
    } finally {
      this.deletingProductId.set('');
    }
  }

  async exportReport(type: DashboardExportType): Promise<void> {
    this.reportMenuOpen.set(false);
    this.exportMenuOpen.set(false);
    this.exporting.set(type);
    this.serverError.set('');

    try {
      const result = await this.dashboardService.exportReport(type, this.range());
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

  isUpdatingOrder(orderId: string): boolean {
    return this.updatingOrderIds().includes(orderId);
  }

  toggleReportMenu(): void {
    if (this.refreshing()) {
      return;
    }

    this.exportMenuOpen.set(false);
    this.reportMenuOpen.update((open) => !open);
  }

  toggleExportMenu(): void {
    if (this.exporting()) {
      return;
    }

    this.reportMenuOpen.set(false);
    this.exportMenuOpen.update((open) => !open);
  }

  salesLinePath(): string {
    return this.buildSmoothPath(this.salesByDay().map((point) => point.value), 620, 220, false);
  }

  salesAreaPath(): string {
    return this.buildSmoothPath(this.salesByDay().map((point) => point.value), 620, 220, true);
  }

  formatOrderDate(value: unknown): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
  }

  private async fetchDashboard(usePrimaryLoader: boolean): Promise<void> {
    if (usePrimaryLoader) {
      this.loading.set(true);
    } else {
      this.refreshing.set(true);
    }

    this.serverError.set('');

    try {
      const payload = await this.adminService.getDashboard(this.range());
      this.stats.set(this.statsService.toStatCards(payload.kpis ?? []));
      this.salesByDay.set(payload.sales ?? []);
      this.orderVolume.set(payload.orderVolume ?? []);
      this.recentOrders.set(payload.recentOrders ?? []);
      this.popularProducts.set(payload.topProducts ?? []);
      this.products.set((payload.products ?? []).map((product: any) => ({ ...product, isActiveLabel: product.isActive ? 'Activ' : 'Inactiv' })));
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

  private buildSmoothPath(values: number[], width: number, height: number, closeArea: boolean): string {
    if (!values.length) {
      return '';
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const stepX = values.length === 1 ? width : width / (values.length - 1);
    const points = values.map((value, index) => ({
      x: Number((index * stepX).toFixed(2)),
      y: Number((height - ((value - min) / span) * height).toFixed(2)),
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      const controlX = Number(((previous.x + current.x) / 2).toFixed(2));
      path += ` C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`;
    }

    if (!closeArea) {
      return path;
    }

    const last = points[points.length - 1];
    return `${path} L ${last.x} ${height} L ${points[0].x} ${height} Z`;
  }
}
