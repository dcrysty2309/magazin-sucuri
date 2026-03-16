import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AccountOverview, AccountService } from '../../../../core/services/account.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AccountShellComponent } from '../../components/account-shell/account-shell.component';

@Component({
  selector: 'app-account-profile-page',
  standalone: true,
  imports: [RouterLink, AccountShellComponent],
  templateUrl: './account-profile-page.component.html',
  styleUrl: './account-profile-page.component.scss',
})
export class AccountProfilePageComponent {
  private readonly accountService = inject(AccountService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly overview = signal<AccountOverview | null>(null);

  constructor() {
    void this.loadOverview();
  }

  async loadOverview(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.overview.set(await this.accountService.getOverview());
    } catch {
      this.serverError.set('Nu am putut incarca dashboard-ul contului.');
    } finally {
      this.loading.set(false);
    }
  }

  formatOrderItems(items: Array<{ name: string; quantity: number }>): string {
    return items.map((item) => `${item.name} x${item.quantity}`).join(', ');
  }
}
