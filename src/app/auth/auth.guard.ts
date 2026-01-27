import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isLoggedIn) {
      return true;
    }
    return this.router.parseUrl('/login');
  }
}
