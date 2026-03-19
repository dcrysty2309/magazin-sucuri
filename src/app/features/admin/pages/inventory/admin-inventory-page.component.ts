import { Component, inject, signal } from '@angular/core';

import { AdminActionBarComponent } from '../../../../shared/admin-ui/action-bar/admin-action-bar.component';
import { AdminBadgeComponent } from '../../../../shared/admin-ui/badge/admin-badge.component';
import { AdminButtonComponent } from '../../../../shared/admin-ui/button/admin-button.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminDataTableComponent } from '../../../../shared/admin-ui/data-table/admin-data-table.component';
import { AdminDialogComponent } from '../../../../shared/admin-ui/dialog/admin-dialog.component';
import { AdminEmptyStateComponent } from '../../../../shared/admin-ui/empty-state/admin-empty-state.component';
import { AdminInputDirective } from '../../../../shared/admin-ui/input/admin-input.directive';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { AdminProductsService } from '../../services/admin-products.service';
import { AdminStockService } from '../../services/admin-stock.service';

@Component({
  selector: 'app-admin-inventory-page',
  standalone: true,
  imports: [
    AdminActionBarComponent,
    AdminBadgeComponent,
    AdminButtonComponent,
    AdminCardComponent,
    AdminDataTableComponent,
    AdminDialogComponent,
    AdminEmptyStateComponent,
    AdminInputDirective,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
  ],
  templateUrl: './admin-inventory-page.component.html',
  styleUrl: './admin-inventory-page.component.scss',
})
export class AdminInventoryPageComponent {
  private readonly stockService = inject(AdminStockService);
  private readonly productsService = inject(AdminProductsService);
  readonly loading = signal(true);
  readonly items = signal<Array<{ id: string; name: string; sku: string; stockQuantity: number; isActive: boolean }>>([]);
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly editingItem = signal<{ id: string; name: string; stockQuantity: number } | null>(null);
  readonly editStockValue = signal('0');
  readonly saving = signal(false);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.items.set(await this.stockService.getInventory());
    } catch {
      this.serverError.set('Nu am putut incarca stocul.');
    } finally {
      this.loading.set(false);
    }
  }

  stockTone(quantity: number): 'danger' | 'warning' | 'success' {
    if (quantity <= 10) {
      return 'danger';
    }

    if (quantity <= 25) {
      return 'warning';
    }

    return 'success';
  }

  openEdit(item: { id: string; name: string; stockQuantity: number }): void {
    this.editingItem.set(item);
    this.editStockValue.set(String(item.stockQuantity));
    this.serverError.set('');
  }

  closeEdit(): void {
    this.editingItem.set(null);
    this.editStockValue.set('0');
    this.saving.set(false);
  }

  onStockInput(event: Event): void {
    const value = (event.target as HTMLInputElement | null)?.value ?? '0';
    this.editStockValue.set(value);
  }

  async saveStock(): Promise<void> {
    const item = this.editingItem();
    if (!item) {
      return;
    }

    const nextValue = Number(this.editStockValue());
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      this.serverError.set('Stocul trebuie sa fie un numar valid, mai mare sau egal cu 0.');
      return;
    }

    this.saving.set(true);
    this.serverError.set('');

    try {
      const updated = await this.productsService.updateProduct(item.id, { stockQuantity: nextValue });
      this.items.update((items) =>
        items.map((entry) =>
          entry.id === item.id ? { ...entry, stockQuantity: updated.stockQuantity, isActive: updated.isActive } : entry,
        ),
      );
      this.toastMessage.set(`Stocul pentru ${item.name} a fost actualizat la ${updated.stockQuantity}.`);
      this.closeEdit();
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut actualiza stocul.');
      this.saving.set(false);
    }
  }
}
