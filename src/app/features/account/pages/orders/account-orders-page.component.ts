import { Component, inject, signal } from '@angular/core';

import { AccountOrder, AccountService } from '../../../../core/services/account.service';
import { AccountShellComponent } from '../../components/account-shell/account-shell.component';

@Component({
  selector: 'app-account-orders-page',
  standalone: true,
  imports: [AccountShellComponent],
  templateUrl: './account-orders-page.component.html',
  styleUrl: './account-orders-page.component.scss',
})
export class AccountOrdersPageComponent {
  private readonly accountService = inject(AccountService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly orders = signal<AccountOrder[]>([]);

  constructor() {
    void this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.orders.set(await this.accountService.getOrders());
    } catch {
      this.serverError.set('Nu am putut incarca comenzile.');
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }
}
