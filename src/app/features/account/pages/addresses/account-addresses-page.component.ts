import { Component, inject, signal } from '@angular/core';

import { AccountAddress, AccountService } from '../../../../core/services/account.service';
import { AccountShellComponent } from '../../components/account-shell/account-shell.component';

@Component({
  selector: 'app-account-addresses-page',
  standalone: true,
  imports: [AccountShellComponent],
  templateUrl: './account-addresses-page.component.html',
  styleUrl: './account-addresses-page.component.scss',
})
export class AccountAddressesPageComponent {
  private readonly accountService = inject(AccountService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly addresses = signal<AccountAddress[]>([]);

  constructor() {
    void this.loadAddresses();
  }

  async loadAddresses(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.addresses.set(await this.accountService.getAddresses());
    } catch {
      this.serverError.set('Nu am putut incarca adresele.');
    } finally {
      this.loading.set(false);
    }
  }
}
