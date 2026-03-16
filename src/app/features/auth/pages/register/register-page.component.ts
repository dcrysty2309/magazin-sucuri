import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiUrl } from '../../../../core/utils/api-url';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);

  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly serverMessage = signal('');
  readonly serverError = signal('');
  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: passwordsMatch },
  );

  async submit(): Promise<void> {
    this.submitted.set(true);
    this.serverMessage.set('');
    this.serverError.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);

    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.form.getRawValue()),
      });

      const payload = await response.json();

      if (!response.ok) {
        this.serverError.set(payload.message || 'Crearea contului a esuat.');
        return;
      }

      this.serverMessage.set(
        payload.previewFile
          ? `${payload.message} Preview local: ${payload.previewFile}`
          : payload.message,
      );
    } catch {
      this.serverError.set('Nu am putut contacta serverul de autentificare.');
    } finally {
      this.loading.set(false);
    }
  }
}
