import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login-page.component.html',
  styleUrl: './admin-login-page.component.scss',
})
export class AdminLoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly serverError = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['admin@livadanoastra.local', [Validators.required, Validators.email]],
    password: ['Admin123!', [Validators.required, Validators.minLength(8)]],
    remember: [true],
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    this.serverError.set('');

    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);

    try {
      const result = await this.adminService.login(this.form.getRawValue());

      if (!result.ok) {
        this.serverError.set(result.message || 'Autentificarea admin a esuat.');
        return;
      }

      await this.auth.refreshSession();
      await this.router.navigateByUrl('/admin/dashboard');
    } finally {
      this.loading.set(false);
    }
  }
}
