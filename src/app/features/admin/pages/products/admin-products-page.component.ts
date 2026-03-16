import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-products-page.component.html',
  styleUrl: './admin-products-page.component.scss',
})
export class AdminProductsPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly products = signal<any[]>([]);
  readonly currentPage = signal(1);

  readonly filtersForm = this.fb.nonNullable.group({
    query: [''],
  });

  readonly filteredProducts = computed(() => {
    const query = this.filtersForm.controls.query.value.trim().toLowerCase();
    const products = this.products();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.sku, product.categoryName, product.subtitle]
        .filter(Boolean)
        .some((value: string) => value.toLowerCase().includes(query)),
    );
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / PAGE_SIZE)));
  readonly paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredProducts().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    void this.load();

    this.filtersForm.controls.query.valueChanges.subscribe(() => {
      this.currentPage.set(1);
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.products.set(await this.adminService.getProducts());
    } catch {
      this.serverError.set('Nu am putut incarca produsele din admin.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleProduct(product: any): Promise<void> {
    const updated = await this.adminService.updateProduct(product.id, { isActive: !product.isActive });
    this.products.update((items) => items.map((item) => (item.id === product.id ? updated : item)));
  }

  goToPage(page: number): void {
    const safePage = Math.min(Math.max(1, page), this.totalPages());
    this.currentPage.set(safePage);
  }
}
