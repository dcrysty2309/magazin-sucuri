import { Component, computed, inject, signal } from '@angular/core';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-analytics-page',
  standalone: true,
  templateUrl: './admin-analytics-page.component.html',
  styleUrl: './admin-analytics-page.component.scss',
})
export class AdminAnalyticsPageComponent {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly kpis = signal<any | null>(null);
  readonly monthlySales = signal<Array<{ label: string; value: number }>>([]);
  readonly popularProducts = signal<Array<{ label: string; value: number }>>([]);

  readonly maxMonthlyValue = computed(() => Math.max(1, ...this.monthlySales().map((item) => item.value)));
  readonly maxProductValue = computed(() => Math.max(1, ...this.popularProducts().map((item) => item.value)));

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const payload = await this.adminService.getAnalytics();
      this.kpis.set(payload.kpis);
      this.monthlySales.set(payload.salesByDay ?? []);
      this.popularProducts.set(payload.popularProducts ?? []);
    } catch {
      this.serverError.set('Nu am putut incarca analytics-ul.');
    } finally {
      this.loading.set(false);
    }
  }
}
