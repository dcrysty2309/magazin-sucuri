import { Component, inject } from '@angular/core';
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

  readonly navigation = [
    { label: 'Dashboard', route: '/admin/dashboard' },
    { label: 'Produse', route: '/admin/produse' },
    { label: 'Categorii', route: '/admin/categorii' },
    { label: 'Comenzi', route: '/admin/comenzi' },
    { label: 'Clienti', route: '/admin/clienti' },
    { label: 'Stoc', route: '/admin/stoc' },
    { label: 'Promotii', route: '/admin/promotii' },
    { label: 'Setari', route: '/admin/setari' },
  ];

  async logout(): Promise<void> {
    await this.auth.logout();
  }
}
