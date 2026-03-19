import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminActionBarComponent } from '../../../../shared/admin-ui/action-bar/admin-action-bar.component';
import { AdminBadgeComponent } from '../../../../shared/admin-ui/badge/admin-badge.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminDataTableComponent } from '../../../../shared/admin-ui/data-table/admin-data-table.component';
import { AdminEmptyStateComponent } from '../../../../shared/admin-ui/empty-state/admin-empty-state.component';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { AdminCustomersService } from '../../services/admin-customers.service';

@Component({
  selector: 'app-admin-customers-page',
  standalone: true,
  imports: [
    RouterLink,
    AdminActionBarComponent,
    AdminBadgeComponent,
    AdminCardComponent,
    AdminDataTableComponent,
    AdminEmptyStateComponent,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
  ],
  templateUrl: './admin-customers-page.component.html',
  styleUrl: './admin-customers-page.component.scss',
})
export class AdminCustomersPageComponent {
  private readonly customersService = inject(AdminCustomersService);
  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly customers = signal<Array<{ id: string; name?: string; email: string; ordersCount?: number; totalSpent?: number }>>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.customers.set(await this.customersService.getCustomers());
    } catch {
      this.serverError.set('Nu am putut incarca lista de clienti.');
    } finally {
      this.loading.set(false);
    }
  }
}
