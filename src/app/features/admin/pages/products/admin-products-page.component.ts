import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-products-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-products-page.component.html',
  styleUrl: './admin-products-page.component.scss',
})
export class AdminProductsPageComponent {
  private readonly document = inject(DOCUMENT);
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly categories = signal<any[]>([]);
  readonly products = signal<any[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = signal(5);
  readonly pageSizeOptions = [5, 10, 25, 50, 100];
  readonly exportMenuDirection = signal<'down' | 'up'>('down');
  readonly importInProgress = signal(false);
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

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize())));
  readonly paginatedProducts = computed(() => {
    const pageSize = this.pageSize();
    const start = (this.currentPage() - 1) * pageSize;
    return this.filteredProducts().slice(start, start + pageSize);
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
      const [products, categories] = await Promise.all([this.adminService.getProducts(), this.adminService.getCategories()]);
      this.products.set(products);
      this.categories.set(categories);
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

  updatePageSize(value: string): void {
    const nextPageSize = Number(value);
    if (!this.pageSizeOptions.includes(nextPageSize)) return;

    this.pageSize.set(nextPageSize);
    this.currentPage.set(1);
  }

  updateExportMenuDirection(trigger: HTMLElement): void {
    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const estimatedPanelHeight = 152;
    const requiredBottomSpace = estimatedPanelHeight + 12;

    this.exportMenuDirection.set(viewportHeight - rect.bottom < requiredBottomSpace ? 'up' : 'down');
  }

  exportProducts(format: 'csv' | 'json' | 'excel'): void {
    const products = this.filteredProducts();
    if (!products.length) {
      this.serverError.set('Nu exista produse de exportat pentru filtrele curente.');
      return;
    }

    this.serverError.set('');

    const { content, mimeType, extension } = this.getExportPayload(products, format);

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = `produse-export-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);

    this.toastMessage.set(`Exportul produselor a fost pregatit in format ${format.toUpperCase()}.`);
  }

  async importProducts(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;

    this.importInProgress.set(true);
    this.serverError.set('');

    try {
      const rawContent = await file.text();
      const rows = file.name.toLowerCase().endsWith('.json') ? this.parseJsonImport(rawContent) : this.parseCsvImport(rawContent);

      if (!rows.length) {
        throw new Error('Fisierul nu contine produse importabile.');
      }

      const createdProducts: any[] = [];
      for (const row of rows) {
        const payload = this.normalizeImportedProduct(row);
        const created = await this.adminService.createProduct(payload);
        createdProducts.push(created);
      }

      this.products.update((items) => [...createdProducts, ...items]);
      this.currentPage.set(1);
      this.toastMessage.set(`${createdProducts.length} produse au fost importate.`);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Importul produselor a esuat.');
    } finally {
      this.importInProgress.set(false);
      if (input) {
        input.value = '';
      }
    }
  }

  private getExportPayload(products: any[], format: 'csv' | 'json' | 'excel'): { content: string; mimeType: string; extension: string } {
    if (format === 'json') {
      return {
        content: JSON.stringify(products, null, 2),
        mimeType: 'application/json;charset=utf-8',
        extension: 'json',
      };
    }

    if (format === 'excel') {
      return {
        content: this.toExcelTable(products),
        mimeType: 'application/vnd.ms-excel;charset=utf-8',
        extension: 'xls',
      };
    }

    return {
      content: this.toCsv(products),
      mimeType: 'text/csv;charset=utf-8',
      extension: 'csv',
    };
  }

  private toCsv(products: any[]): string {
    const headers = [
      'categoryId',
      'categoryName',
      'name',
      'subtitle',
      'shortDescription',
      'description',
      'volumeLabel',
      'badge',
      'accent',
      'image',
      'price',
      'stockQuantity',
      'isActive',
    ];

    const lines = products.map((product) =>
      headers
        .map((header) => this.escapeCsvValue(product[header] ?? ''))
        .join(','),
    );

    return [headers.join(','), ...lines].join('\n');
  }

  private escapeCsvValue(value: unknown): string {
    const serialized = String(value ?? '');
    if (!/[",\n]/.test(serialized)) return serialized;
    return `"${serialized.replace(/"/g, '""')}"`;
  }

  private parseJsonImport(content: string): any[] {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error('Fisierul JSON trebuie sa contina o lista de produse.');
    }
    return parsed;
  }

  private parseCsvImport(content: string): any[] {
    const rows = this.parseCsvRows(content);
    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => header.trim());
    return rows
      .slice(1)
      .filter((row) => row.some((cell) => cell.trim().length > 0))
      .map((row) => {
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
          record[header] = row[index] ?? '';
        });
        return record;
      });
  }

  private parseCsvRows(content: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let index = 0; index < content.length; index += 1) {
      const char = content[index];
      const nextChar = content[index + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentValue += '"';
          index += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
        continue;
      }

      if (char === ',' && !insideQuotes) {
        currentRow.push(currentValue);
        currentValue = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          index += 1;
        }
        currentRow.push(currentValue);
        rows.push(currentRow);
        currentRow = [];
        currentValue = '';
        continue;
      }

      currentValue += char;
    }

    if (currentValue.length > 0 || currentRow.length > 0) {
      currentRow.push(currentValue);
      rows.push(currentRow);
    }

    return rows;
  }

  private toExcelTable(products: any[]): string {
    const headers = ['Produs', 'SKU', 'Categorie', 'Tip', 'Pret', 'Stoc', 'Status'];
    const rows = products.map((product) => [
      product.name,
      product.sku,
      product.categoryName,
      product.volumeLabel,
      product.price,
      product.stockQuantity,
      product.isActive ? 'Activ' : 'Inactiv',
    ]);

    const headerRow = headers.map((header) => `<th>${this.escapeHtml(header)}</th>`).join('');
    const bodyRows = rows
      .map((row) => `<tr>${row.map((value) => `<td>${this.escapeHtml(String(value ?? ''))}</td>`).join('')}</tr>`)
      .join('');

    return `
      <html>
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <table>
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private normalizeImportedProduct(row: Record<string, unknown>): Record<string, unknown> {
    const categoryId = String(row['categoryId'] ?? '').trim() || this.resolveCategoryId(String(row['categoryName'] ?? '').trim());
    if (!categoryId) {
      throw new Error('Fiecare produs importat trebuie sa aiba categoryId sau categoryName valid.');
    }

    const name = String(row['name'] ?? '').trim();
    const subtitle = String(row['subtitle'] ?? '').trim();
    const shortDescription = String(row['shortDescription'] ?? '').trim();
    const description = String(row['description'] ?? '').trim();
    const volumeLabel = String(row['volumeLabel'] ?? '').trim();

    if (!name || !subtitle || !shortDescription || !description || !volumeLabel) {
      throw new Error('Fisierul de import trebuie sa contina name, subtitle, shortDescription, description si volumeLabel.');
    }

    return {
      categoryId,
      name,
      subtitle,
      shortDescription,
      description,
      volumeLabel,
      badge: String(row['badge'] ?? '').trim(),
      accent: String(row['accent'] ?? 'gold').trim() || 'gold',
      image: String(row['image'] ?? '/images/homepage-hero.png').trim() || '/images/homepage-hero.png',
      price: Number(row['price'] ?? 0),
      stockQuantity: Number(row['stockQuantity'] ?? 0),
      isActive: this.toBoolean(row['isActive']),
    };
  }

  private resolveCategoryId(categoryName: string): string {
    if (!categoryName) return '';
    const normalizedName = categoryName.toLowerCase();
    return this.categories().find((category) => String(category.name ?? '').trim().toLowerCase() === normalizedName)?.id ?? '';
  }

  private toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'da' || normalized === 'activ';
  }
}
