import { Component, inject, signal } from '@angular/core';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly stats = signal<any[]>([]);
  readonly recentOrders = signal<any[]>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const payload = await this.adminService.getDashboard();
      this.stats.set(payload.stats ?? []);
      this.recentOrders.set(payload.recentOrders ?? []);
    } catch {
      this.serverError.set('Nu am putut incarca dashboard-ul admin.');
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
  }
}
