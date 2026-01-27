import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { CustomerAuthService } from '../services/customer-auth.service';

@Injectable({ providedIn: 'root' })
export class CustomerAuthGuard implements CanActivate {
  constructor(private auth: CustomerAuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const token = this.auth.token;
    if (token) {
      return true;
    }

    // Token yoksa login'e yönlendir
    return this.router.parseUrl('/customer/login');
  }
}
