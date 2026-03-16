import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CatalogService, StoreCategory, StoreProductCard } from '../../../../core/services/catalog.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss',
})
export class ProductsPageComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly categories = signal<StoreCategory[]>([]);
  readonly products = signal<StoreProductCard[]>([]);
  readonly selectedCategory = signal<string>('suc-de-mere');
  readonly activeCategory = computed(
    () => this.categories().find((category) => category.slug === this.selectedCategory()) ?? null,
  );

  readonly benefits = [
    { label: '100% mere romanesti', tone: 'apple' },
    { label: 'Fara zahar adaugat', tone: 'berry' },
    { label: 'Fara conservanti', tone: 'leaf' },
  ];

  readonly volumes = ['3L', '5L'];

  constructor() {
    void this.loadCatalog();
  }

  async loadCatalog(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const [categories, products] = await Promise.all([
        this.catalogService.getCategories(),
        this.catalogService.getProducts(this.selectedCategory()),
      ]);

      this.categories.set(categories);
      this.products.set(products);
    } catch {
      this.serverError.set('Nu am putut incarca produsele.');
    } finally {
      this.loading.set(false);
    }
  }

  async selectCategory(slug: string): Promise<void> {
    this.selectedCategory.set(slug);
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.products.set(await this.catalogService.getProducts(slug));
    } catch {
      this.serverError.set('Nu am putut actualiza categoria selectata.');
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
