import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-product-edit-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-product-edit-page.component.html',
  styleUrl: './admin-product-edit-page.component.scss',
})
export class AdminProductEditPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly serverMessage = signal('');
  readonly categories = signal<any[]>([]);
  readonly isCreateMode = signal(this.route.snapshot.paramMap.get('id') === 'nou');
  readonly productId = signal(this.route.snapshot.paramMap.get('id') || '');

  readonly form = this.fb.nonNullable.group({
    categoryId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    subtitle: ['', [Validators.required]],
    shortDescription: ['', [Validators.required]],
    description: ['', [Validators.required]],
    volumeLabel: ['', [Validators.required]],
    badge: [''],
    accent: ['gold'],
    image: ['/images/homepage-hero.png'],
    price: [0, [Validators.required]],
    stockQuantity: [0, [Validators.required]],
    isActive: [true],
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const categories = await this.adminService.getCategories();
      this.categories.set(categories);

      if (categories.length && !this.form.value.categoryId) {
        this.form.patchValue({ categoryId: categories[0].id });
      }

      if (!this.isCreateMode()) {
        const product = await this.adminService.getProduct(this.productId());
        this.form.patchValue({
          categoryId: product.categoryId,
          name: product.name,
          subtitle: product.subtitle,
          shortDescription: product.shortDescription,
          description: product.description,
          volumeLabel: product.volumeLabel,
          badge: product.badge || '',
          accent: product.accent,
          image: product.image,
          price: product.price,
          stockQuantity: product.stockQuantity,
          isActive: product.isActive,
        });
      }
    } catch {
      this.serverError.set('Nu am putut incarca produsul pentru editare.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    this.serverError.set('');
    this.serverMessage.set('');

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);

    try {
      if (this.isCreateMode()) {
        const created = await this.adminService.createProduct(this.form.getRawValue());
        this.serverMessage.set('Produsul a fost creat.');
        await this.router.navigate(['/admin/produse', created.id]);
      } else {
        await this.adminService.updateProduct(this.productId(), this.form.getRawValue());
        this.serverMessage.set('Modificarile au fost salvate.');
      }
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut salva produsul.');
    } finally {
      this.saving.set(false);
    }
  }
}
