import { Component, HostListener, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './storefront-layout.component.html',
  styleUrl: './storefront-layout.component.scss',
})
export class StorefrontLayoutComponent {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  isMobileMenuOpen = false;
  isScrolled = false;
  isAccountMenuOpen = false;

  readonly navigation = [
    { label: 'Produse', route: '/produse' },
    { label: 'Despre noi', route: '/despre-noi' },
    { label: 'Procesare fructe', route: '/procesare-fructe' },
    { label: 'Contact', route: '/contact' },
  ];

  readonly socialLinks = [
    {
      label: 'Email',
      href: 'mailto:contact@livadanoastra.ro',
      icon: 'mail',
    },
    {
      label: 'Instagram',
      href: '#',
      icon: 'instagram',
    },
    {
      label: 'Facebook',
      href: '#',
      icon: 'facebook',
    },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.isMobileMenuOpen = false;
        this.isAccountMenuOpen = false;
        this.cart.closeMiniCart();
        this.syncBodyScrollLock();
      });
  }

  toggleMobileMenu(): void {
    this.cart.closeMiniCart();
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.syncBodyScrollLock();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.syncBodyScrollLock();
  }

  toggleAccountMenu(): void {
    this.cart.closeMiniCart();
    this.isMobileMenuOpen = false;
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
    this.syncBodyScrollLock();
  }

  closeAccountMenu(): void {
    this.isAccountMenuOpen = false;
    this.syncBodyScrollLock();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 24;
  }

  toggleMiniCart(): void {
    this.isMobileMenuOpen = false;
    this.isAccountMenuOpen = false;
    if (this.cart.miniCartOpen()) {
      this.cart.closeMiniCart();
    } else {
      this.cart.openMiniCart();
    }
    this.syncBodyScrollLock();
  }

  closeAllPanels(): void {
    this.isMobileMenuOpen = false;
    this.isAccountMenuOpen = false;
    this.cart.closeMiniCart();
    this.syncBodyScrollLock();
  }

  goToAccount(): void {
    void this.router.navigateByUrl(this.auth.isAuthenticated() ? '/account/profil' : '/auth/login');
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    this.closeAllPanels();
    void this.router.navigateByUrl('/');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.storefront-account')) {
      return;
    }

    if (this.isAccountMenuOpen) {
      this.closeAccountMenu();
    }
  }

  private syncBodyScrollLock(): void {
    const shouldLock = this.isMobileMenuOpen || this.cart.miniCartOpen();
    document.body.style.overflow = shouldLock ? 'hidden' : '';
    document.documentElement.style.overflow = shouldLock ? 'hidden' : '';
  }
}
