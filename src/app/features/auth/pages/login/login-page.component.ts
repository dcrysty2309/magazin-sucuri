import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiUrl } from '../../../../core/utils/api-url';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly serverMessage = signal('');
  readonly serverError = signal('');
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [true],
  });

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
      const result = await this.auth.login(this.form.getRawValue());
      if (!result.ok) {
        this.serverError.set(result.message || 'Autentificarea a esuat.');
        return;
      }

      this.serverMessage.set('Autentificare reusita. Redirectionare catre cont...');
      await this.router.navigateByUrl('/account/profil');
    } catch {
      this.serverError.set('Nu am putut contacta serverul de autentificare.');
    } finally {
      this.loading.set(false);
    }
  }
}
