import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.initialize();

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/admin/login']);
  }

  return auth.user()?.role === 'admin' ? true : router.createUrlTree(['/']);
};
