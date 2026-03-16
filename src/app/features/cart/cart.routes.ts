import { Routes } from '@angular/router';

import { StorefrontLayoutComponent } from '../../layout/storefront-layout/storefront-layout.component';
import { CartPageComponent } from './pages/cart/cart-page.component';

export const CART_ROUTES: Routes = [
  {
    path: '',
    component: StorefrontLayoutComponent,
    children: [{ path: '', component: CartPageComponent }],
  },
];
