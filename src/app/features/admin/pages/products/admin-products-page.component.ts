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
  readonly toastMessage = signal('');
  readonly products = signal<any[]>([]);
  readonly currentPage = signal(1);
  readonly deletingProductId = signal('');
  readonly pendingDeleteProduct = signal<any | null>(null);

  readonly filtersForm = this.fb.nonNullable.group({
    query: [''],
    type: ['all'],
  });

  readonly filteredProducts = computed(() => {
    const query = this.filtersForm.controls.query.value.trim().toLowerCase();
    const type = this.filtersForm.controls.type.value;
    const products = this.products();

    return products.filter((product) => {
      const matchesQuery =
        !query ||
        [product.name, product.sku, product.categoryName, product.subtitle, product.volumeLabel]
          .filter(Boolean)
          .some((value: string) => value.toLowerCase().includes(query));
      const matchesType = type === 'all' || product.volumeLabel === type;
      return matchesQuery && matchesType;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / PAGE_SIZE)));
  readonly paginatedProducts = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.filteredProducts().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    void this.load();

    this.filtersForm.controls.query.valueChanges.subscribe(() => this.currentPage.set(1));
    this.filtersForm.controls.type.valueChanges.subscribe(() => this.currentPage.set(1));
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
    this.toastMessage.set(`Produsul ${updated.name} a fost actualizat.`);
  }

  requestDelete(product: any): void {
    this.pendingDeleteProduct.set(product);
  }

  cancelDelete(): void {
    this.pendingDeleteProduct.set(null);
  }

  async confirmDelete(): Promise<void> {
    const product = this.pendingDeleteProduct();
    if (!product) return;

    this.deletingProductId.set(product.id);
    this.serverError.set('');

    try {
      const result = await this.adminService.deleteProduct(product.id);
      this.products.update((items) => items.filter((item) => item.id !== product.id));
      this.pendingDeleteProduct.set(null);
      this.toastMessage.set(result.message);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut sterge produsul.');
    } finally {
      this.deletingProductId.set('');
    }
  }

  goToPage(page: number): void {
    const safePage = Math.min(Math.max(1, page), this.totalPages());
    this.currentPage.set(safePage);
  }
}
