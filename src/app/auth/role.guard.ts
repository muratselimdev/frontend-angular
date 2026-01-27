import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.auth.isLoggedIn || !this.auth.profile) {
      return this.router.parseUrl('/login');
    }

    const allowedRoles: string[] = route.data?.['roles'] ?? [];
    const userRole = this.auth.profile.role?.toLowerCase();

    if (allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      return true;
    }

    return this.router.parseUrl('/login');
  }
}
