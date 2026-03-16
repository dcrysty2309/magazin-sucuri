import { Component, inject, signal } from '@angular/core';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-inventory-page',
  standalone: true,
  templateUrl: './admin-inventory-page.component.html',
  styleUrl: './admin-inventory-page.component.scss',
})
export class AdminInventoryPageComponent {
  private readonly adminService = inject(AdminService);
  readonly items = signal<any[]>([]);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.items.set(await this.adminService.getInventory());
  }
}
