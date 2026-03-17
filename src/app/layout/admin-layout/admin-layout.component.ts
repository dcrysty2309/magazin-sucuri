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
  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);

  readonly navigation = [
    { label: 'Dashboard', route: '/admin/dashboard', tag: 'overview', icon: 'dashboard' },
    { label: 'Produse', route: '/admin/produse', tag: 'catalog', icon: 'products' },
    { label: 'Comenzi', route: '/admin/comenzi', tag: 'sales', icon: 'orders' },
    { label: 'Clienti', route: '/admin/clienti', tag: 'crm', icon: 'customers' },
    { label: 'Livrare', route: '/admin/livrare', tag: 'ops', icon: 'shipping' },
    { label: 'Plati', route: '/admin/plati', tag: 'ops', icon: 'payments' },
    { label: 'Setari', route: '/admin/setari', tag: 'config', icon: 'settings' },
    { label: 'Analytics', route: '/admin/analytics', tag: 'data', icon: 'analytics' },
  ];
  readonly secondaryNavigation = [
    { label: 'Categorii', route: '/admin/categorii', icon: 'categories' },
    { label: 'Stoc', route: '/admin/stoc', icon: 'inventory' },
    { label: 'Promotii', route: '/admin/promotii', icon: 'promotions' },
  ];
  readonly displayName = computed(() => this.auth.displayName() || 'Administrator');

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((value) => !value);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
