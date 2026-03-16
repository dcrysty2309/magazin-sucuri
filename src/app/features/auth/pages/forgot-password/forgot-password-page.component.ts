import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiUrl } from '../../../../core/utils/api-url';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly serverMessage = signal('');
  readonly serverError = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async submit(): Promise<void> {
    this.serverMessage.set('');
    this.serverError.set('');
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);

    try {
      const response = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.form.getRawValue()),
      });

      const payload = await response.json();
      if (!response.ok) {
        this.serverError.set(payload.message || 'Nu am putut procesa cererea.');
        return;
      }

      this.serverMessage.set(
        payload.previewFile
          ? `${payload.message} Preview local: ${payload.previewFile}`
          : payload.message,
      );
    } catch {
      this.serverError.set('Nu am putut contacta serverul.');
    } finally {
      this.loading.set(false);
    }
  }
}
