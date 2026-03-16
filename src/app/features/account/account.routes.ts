import { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { StorefrontLayoutComponent } from '../../layout/storefront-layout/storefront-layout.component';
import { AccountAddressesPageComponent } from './pages/addresses/account-addresses-page.component';
import { AccountOrdersPageComponent } from './pages/orders/account-orders-page.component';
import { AccountProfilePageComponent } from './pages/profile/account-profile-page.component';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    component: StorefrontLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'profil', pathMatch: 'full' },
      { path: 'profil', component: AccountProfilePageComponent },
      { path: 'adrese', component: AccountAddressesPageComponent },
      { path: 'comenzi', component: AccountOrdersPageComponent },
    ],
  },
];
