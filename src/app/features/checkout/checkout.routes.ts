import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { StorefrontLayoutComponent } from '../../layout/storefront-layout/storefront-layout.component';
import { CheckoutPageComponent } from './pages/checkout/checkout-page.component';

export const CHECKOUT_ROUTES: Routes = [
  {
    path: '',
    component: StorefrontLayoutComponent,
    canActivate: [authGuard],
    children: [{ path: '', component: CheckoutPageComponent }],
  },
];
