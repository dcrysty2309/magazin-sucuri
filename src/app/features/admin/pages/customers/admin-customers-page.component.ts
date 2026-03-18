import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-customers-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './admin-customers-page.component.html',
  styleUrl: './admin-customers-page.component.scss',
})
export class AdminCustomersPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingCustomerId = signal('');
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly customers = signal<any[]>([]);
  readonly editingCustomer = signal<any | null>(null);
  readonly deletingCustomer = signal<any | null>(null);

  readonly customerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    password: [''],
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      this.customers.set(await this.adminService.getCustomers());
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut incarca clientii.');
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.editingCustomer.set({ id: null });
    this.customerForm.reset({ firstName: '', lastName: '', email: '', phone: '', password: 'Client123!' });
  }

  openEdit(customer: any): void {
    this.editingCustomer.set(customer);
    this.customerForm.reset({
      firstName: customer.name.split(' ').slice(0, -1).join(' ') || customer.name,
      lastName: customer.name.split(' ').slice(-1).join(' '),
      email: customer.email,
      phone: customer.phone,
      password: '',
    });
  }

  closeModal(): void {
    this.editingCustomer.set(null);
  }

  confirmDelete(customer: any): void {
    this.deletingCustomer.set(customer);
  }

  cancelDelete(): void {
    this.deletingCustomer.set(null);
  }

  async saveCustomer(): Promise<void> {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.serverError.set('');
    const payload = this.customerForm.getRawValue();
    const current = this.editingCustomer();

    try {
      if (current?.id) {
        await this.adminService.updateCustomer(current.id, payload);
        this.toastMessage.set('Clientul a fost actualizat.');
      } else {
        await this.adminService.createCustomer(payload);
        this.toastMessage.set('Clientul a fost creat.');
      }

      this.closeModal();
      await this.load();
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut salva clientul.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteCustomer(): Promise<void> {
    const customer = this.deletingCustomer();
    if (!customer) {
      return;
    }

    this.deletingCustomerId.set(customer.id);
    this.serverError.set('');

    try {
      const result = await this.adminService.deleteCustomer(customer.id);
      this.toastMessage.set(result.message);
      this.deletingCustomer.set(null);
      await this.load();
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Nu am putut sterge clientul.');
    } finally {
      this.deletingCustomerId.set('');
    }
  }
}
