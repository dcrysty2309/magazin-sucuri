import { Component, inject, signal } from '@angular/core';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-customers-page',
  standalone: true,
  templateUrl: './admin-customers-page.component.html',
  styleUrl: './admin-customers-page.component.scss',
})
export class AdminCustomersPageComponent {
  private readonly adminService = inject(AdminService);
  readonly customers = signal<any[]>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.customers.set(await this.adminService.getCustomers());
  }
}
