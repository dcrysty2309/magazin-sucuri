import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogService, HomePagePayload, StoreProductCard } from '../../../../core/services/catalog.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-homepage-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './homepage-page.component.html',
  styleUrl: './homepage-page.component.scss',
})
export class HomepagePageComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly homepage = signal<HomePagePayload | null>(null);

  constructor() {
    void this.loadHomepage();
  }

  async loadHomepage(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.homepage.set(await this.catalogService.getHomePage());
    } catch {
      this.serverError.set('Nu am putut incarca datele homepage-ului.');
    } finally {
      this.loading.set(false);
    }
  }

  addToCart(product: StoreProductCard): void {
    this.cartService.addItem({
      id: product.id,
      name: product.name,
      variant: product.subtitle,
      price: product.price,
      image: product.image,
    });
  }

  formatPrice(value: number): string {
    return this.cartService.formatPrice(value);
  }
}
