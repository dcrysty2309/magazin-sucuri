import { Routes } from '@angular/router';

import { StorefrontLayoutComponent } from '../../layout/storefront-layout/storefront-layout.component';
import { AboutPageComponent } from './pages/about/about-page.component';
import { ContactPageComponent } from './pages/contact/contact-page.component';
import { EmailPreviewPageComponent } from './pages/email-preview/email-preview-page.component';
import { HomepagePageComponent } from './pages/homepage/homepage-page.component';
import { ProcessingPageComponent } from './pages/processing/processing-page.component';
import { ProductDetailPageComponent } from './pages/product-detail/product-detail-page.component';
import { ProductsPageComponent } from './pages/products/products-page.component';

export const STOREFRONT_ROUTES: Routes = [
  {
    path: '',
    component: StorefrontLayoutComponent,
    children: [
      { path: '', component: HomepagePageComponent },
      { path: 'produse', component: ProductsPageComponent },
      { path: 'produse/:slug', component: ProductDetailPageComponent },
      { path: 'preview/emailuri', component: EmailPreviewPageComponent },
      { path: 'despre-noi', component: AboutPageComponent },
      { path: 'procesare-fructe', component: ProcessingPageComponent },
      { path: 'contact', component: ContactPageComponent },
    ],
  },
];
