import { inject } from '@angular/core';
import { Router, type CanActivateFn, type ActivatedRouteSnapshot } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

interface MembreMe {
  _id: string;
  role: string;
}

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const allowedRoles = route.data?.['roles'] as string[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  return http.get<MembreMe>('/api/auth/me').pipe(
    map(membre => {
      if (allowedRoles.includes(membre.role)) {
        return true;
      }
      return router.parseUrl('/forbidden');
    }),
    catchError(() => of(router.parseUrl('/login'))),
  );
};
