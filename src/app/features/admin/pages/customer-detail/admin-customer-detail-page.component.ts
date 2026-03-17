import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-customer-detail-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './admin-customer-detail-page.component.html',
  styleUrl: './admin-customer-detail-page.component.scss',
})
export class AdminCustomerDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly customer = signal<any | null>(null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const id = this.route.snapshot.paramMap.get('id') || '';
      this.customer.set(await this.adminService.getCustomer(id));
    } catch {
      this.serverError.set('Nu am putut incarca detaliile clientului.');
    } finally {
      this.loading.set(false);
    }
  }
}
