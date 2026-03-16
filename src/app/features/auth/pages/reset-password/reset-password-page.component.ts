import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { apiUrl } from '../../../../core/utils/api-url';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly serverMessage = signal('');
  readonly serverError = signal('');
  readonly token = this.route.snapshot.queryParamMap.get('token') || '';
  readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  async submit(): Promise<void> {
    this.serverMessage.set('');
    this.serverError.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid || !this.token) {
      this.serverError.set('Linkul de resetare nu este valid.');
      return;
    }

    this.loading.set(true);

    try {
      const response = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.token,
          password: this.form.controls.password.value,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        this.serverError.set(payload.message || 'Nu am putut actualiza parola.');
        return;
      }

      this.serverMessage.set(payload.message || 'Parola a fost actualizata.');
      this.form.reset();
    } catch {
      this.serverError.set('Nu am putut contacta serverul.');
    } finally {
      this.loading.set(false);
    }
  }
}
