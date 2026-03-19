import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  readonly mobileMenuOpen = signal(false);

  readonly navigation = [
    { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Comenzi', route: '/admin/comenzi', icon: 'orders' },
    { label: 'Produse', route: '/admin/produse', icon: 'products' },
    { label: 'Stoc', route: '/admin/stoc', icon: 'inventory' },
    { label: 'Livrare', route: '/admin/livrare', icon: 'shipping' },
    { label: 'Clienti', route: '/admin/clienti', icon: 'customers' },
    { label: 'Plata', route: '/admin/plati', icon: 'payments' },
  ];
  readonly displayName = computed(() => this.auth.displayName() || 'Administrator');

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
