import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminActionBarComponent } from '../../../../shared/admin-ui/action-bar/admin-action-bar.component';
import { AdminBadgeComponent } from '../../../../shared/admin-ui/badge/admin-badge.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminEmptyStateComponent } from '../../../../shared/admin-ui/empty-state/admin-empty-state.component';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { AdminCustomersService } from '../../services/admin-customers.service';

@Component({
  selector: 'app-admin-customer-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    AdminActionBarComponent,
    AdminBadgeComponent,
    AdminCardComponent,
    AdminEmptyStateComponent,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
  ],
  templateUrl: './admin-customer-detail-page.component.html',
  styleUrl: './admin-customer-detail-page.component.scss',
})
export class AdminCustomerDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly customersService = inject(AdminCustomersService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly customer = signal<{
    name?: string;
    email?: string;
    phone?: string;
    ordersCount?: number;
    totalSpent?: number;
    addresses?: Array<{
      id: string;
      label: string;
      recipientName: string;
      line1: string;
      city: string;
      county: string;
      postalCode: string;
    }>;
    orders?: Array<{
      id: string;
      code: string;
      status: string;
      paymentStatus: string;
      total: number;
      createdAt?: string;
    }>;
  } | null>(null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const id = this.route.snapshot.paramMap.get('id') || '';
      this.customer.set(await this.customersService.getCustomer(id));
    } catch {
      this.serverError.set('Nu am putut incarca detaliile clientului.');
    } finally {
      this.loading.set(false);
    }
  }
}
