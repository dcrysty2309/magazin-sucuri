import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-categories-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-categories-page.component.html',
  styleUrl: './admin-categories-page.component.scss',
})
export class AdminCategoriesPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<any[]>([]);
  readonly serverError = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    slug: [''],
    description: ['', [Validators.required]],
    image: ['/images/homepage-hero.png'],
    sortOrder: [99],
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.categories.set(await this.adminService.getCategories());
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    try {
      const category = await this.adminService.createCategory(this.form.getRawValue());
      this.categories.update((items) => [...items, category]);
      this.form.patchValue({ name: '', slug: '', description: '', image: '/images/homepage-hero.png', sortOrder: 99 });
      this.serverError.set('');
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut salva categoria.');
    }
  }
}
