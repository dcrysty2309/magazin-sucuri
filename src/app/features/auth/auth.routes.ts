import { Routes } from '@angular/router';

import { AuthLayoutComponent } from '../../layout/auth-layout/auth-layout.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password/forgot-password-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { RegisterPageComponent } from './pages/register/register-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password/reset-password-page.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginPageComponent },
      { path: 'register', component: RegisterPageComponent },
      { path: 'forgot-password', component: ForgotPasswordPageComponent },
      { path: 'reset-password', component: ResetPasswordPageComponent },
    ],
  },
];
