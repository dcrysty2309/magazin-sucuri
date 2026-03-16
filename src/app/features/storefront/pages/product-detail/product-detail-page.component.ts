import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CatalogService, StoreProductDetail } from '../../../../core/services/catalog.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly product = signal<StoreProductDetail | null>(null);

  constructor() {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    void this.loadProduct(slug);
  }

  async loadProduct(slug: string): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.product.set(await this.catalogService.getProduct(slug));
    } catch {
      this.serverError.set('Nu am putut incarca produsul.');
    } finally {
      this.loading.set(false);
    }
  }

  addToCart(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.cartService.addItem({
      id: product.id,
      name: product.name,
      variant: product.subtitle,
      price: product.price,
      image: product.images[0]?.url || '/images/homepage-hero.png',
    });
  }

  formatPrice(value: number): string {
    return this.cartService.formatPrice(value);
  }
}
