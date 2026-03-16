import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { apiUrl } from '../../../../core/utils/api-url';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './checkout-page.component.html',
  styleUrl: './checkout-page.component.scss',
})
export class CheckoutPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);

  readonly loading = signal(false);
  readonly serverError = signal('');
  readonly serverMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required]],
    customerEmail: ['', [Validators.required, Validators.email]],
    customerPhone: ['', [Validators.required]],
    county: ['', [Validators.required]],
    city: ['', [Validators.required]],
    addressLine1: ['', [Validators.required]],
    addressLine2: [''],
    postalCode: ['', [Validators.required]],
    notes: [''],
  });

  constructor() {
    const user = this.auth.user();
    if (user) {
      this.form.patchValue({
        customerName: `${user.firstName} ${user.lastName}`.trim(),
        customerEmail: user.email,
        customerPhone: user.phone || '',
      });
    }
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.serverError.set('');
    this.serverMessage.set('');

    if (this.form.invalid || !this.cart.items().length) {
      this.serverError.set('Completeaza datele obligatorii si adauga produse in cos.');
      return;
    }

    this.loading.set(true);

    try {
      const response = await fetch(apiUrl('/api/store/checkout'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...this.form.getRawValue(),
          items: this.cart.items().map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        this.serverError.set(payload.message || 'Nu am putut finaliza comanda.');
        return;
      }

      this.serverMessage.set(payload.message || 'Comanda a fost inregistrata.');
      this.cart.clear();
      setTimeout(() => {
        void this.router.navigateByUrl('/account/comenzi');
      }, 900);
    } finally {
      this.loading.set(false);
    }
  }
}
