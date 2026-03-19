import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminActionBarComponent } from '../../../../shared/admin-ui/action-bar/admin-action-bar.component';
import { AdminBadgeComponent } from '../../../../shared/admin-ui/badge/admin-badge.component';
import { AdminButtonComponent } from '../../../../shared/admin-ui/button/admin-button.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminDataTableComponent } from '../../../../shared/admin-ui/data-table/admin-data-table.component';
import { AdminDialogComponent } from '../../../../shared/admin-ui/dialog/admin-dialog.component';
import { AdminInputDirective } from '../../../../shared/admin-ui/input/admin-input.directive';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { AdminSelectDirective } from '../../../../shared/admin-ui/select/admin-select.directive';
import { AdminProduct } from '../../models/admin-product.model';
import { AdminProductsService } from '../../services/admin-products.service';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AdminActionBarComponent,
    AdminBadgeComponent,
    AdminButtonComponent,
    AdminCardComponent,
    AdminDataTableComponent,
    AdminDialogComponent,
    AdminInputDirective,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
    AdminSelectDirective,
  ],
  templateUrl: './admin-products-page.component.html',
  styleUrl: './admin-products-page.component.scss',
})
export class AdminProductsPageComponent {
  private readonly productsService = inject(AdminProductsService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly products = signal<AdminProduct[]>([]);
  readonly currentPage = signal(1);
  readonly deletingProductId = signal('');
  readonly pendingDeleteProduct = signal<AdminProduct | null>(null);

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
          .some((value) => String(value).toLowerCase().includes(query));
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
      this.products.set(await this.productsService.getProducts());
    } catch {
      this.serverError.set('Nu am putut incarca produsele din admin.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleProduct(product: AdminProduct): Promise<void> {
    const updated = await this.productsService.updateProduct(product.id, { isActive: !product.isActive });
    this.products.update((items) => items.map((item) => (item.id === product.id ? updated : item)));
    this.toastMessage.set(`Produsul ${updated.name} a fost actualizat.`);
  }

  requestDelete(product: AdminProduct): void {
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
      const result = await this.productsService.deleteProduct(product.id);
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
