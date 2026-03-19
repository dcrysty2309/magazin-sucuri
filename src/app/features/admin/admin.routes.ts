import { Routes } from '@angular/router';

import { adminGuard } from '../../core/guards/admin.guard';
import { AdminLayoutComponent } from '../../layout/admin-layout/admin-layout.component';
import { AdminCustomersPageComponent } from './pages/customers/admin-customers-page.component';
import { AdminCustomerDetailPageComponent } from './pages/customer-detail/admin-customer-detail-page.component';
import { AdminDashboardPageComponent } from './pages/dashboard/admin-dashboard-page.component';
import { AdminInventoryPageComponent } from './pages/inventory/admin-inventory-page.component';
import { AdminLoginPageComponent } from './pages/login/admin-login-page.component';
import { AdminOrderDetailPageComponent } from './pages/order-detail/admin-order-detail-page.component';
import { AdminOrdersPageComponent } from './pages/orders/admin-orders-page.component';
import { AdminPaymentsPageComponent } from './pages/payments/admin-payments-page.component';
import { AdminProductEditPageComponent } from './pages/product-edit/admin-product-edit-page.component';
import { AdminProductsPageComponent } from './pages/products/admin-products-page.component';
import { AdminShippingPageComponent } from './pages/shipping/admin-shipping-page.component';

export const ADMIN_ROUTES: Routes = [
  { path: 'login', component: AdminLoginPageComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardPageComponent },
      { path: 'produse', component: AdminProductsPageComponent },
      { path: 'produse/nou', component: AdminProductEditPageComponent },
      { path: 'produse/:id', component: AdminProductEditPageComponent },
      { path: 'comenzi', component: AdminOrdersPageComponent },
      { path: 'comenzi/:id', component: AdminOrderDetailPageComponent },
      { path: 'stoc', component: AdminInventoryPageComponent },
      { path: 'clienti', component: AdminCustomersPageComponent },
      { path: 'clienti/:id', component: AdminCustomerDetailPageComponent },
      { path: 'livrare', component: AdminShippingPageComponent },
      { path: 'plati', component: AdminPaymentsPageComponent },
    ],
  },
];
