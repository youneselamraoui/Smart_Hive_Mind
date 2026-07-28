import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const http = inject(HttpClient);

  return http.get<unknown>('/api/auth/me').pipe(
    map(() => true),
    catchError(() => of(router.parseUrl('/login'))),
  );
};
