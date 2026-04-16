import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.token;
    const skipAuthRecovery = req.headers.has('X-Skip-Auth-Recovery');
    const sanitizedHeaders = skipAuthRecovery
      ? req.headers.delete('X-Skip-Auth-Recovery')
      : req.headers;
    let authReq = req.clone({ headers: sanitizedHeaders });

    console.log('%c[STAFF INTERCEPTOR] Aktif', 'color: cyan; font-weight: bold;');
    console.log('[STAFF INTERCEPTOR] Gelen istek:', req.url);

    // 🔹 Sadece staff / agent / supervisor API'leri dinle
    const isStaffEndpoint =
    req.url.startsWith(`${environment.apiUrl}/api/staff`) ||
    req.url.startsWith(`${environment.apiUrl}/api/agent`) ||
    req.url.startsWith(`${environment.apiUrl}/api/admin`);
    const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');

    if (!isStaffEndpoint) {
      return next.handle(authReq);
    }

    // 🔹 Login/Register endpoint'leri temiz gider
    if (isAuthEndpoint) {
      authReq = req.clone({ withCredentials: true });
    }

    // 🔹 Refresh token endpoint sadece cookie ile gider
    else if (req.url.includes('/auth/refresh')) {
      console.log('[STAFF INTERCEPTOR] Refresh request → sadece cookie ile gidiyor');
      authReq = req.clone({ withCredentials: true });
    }

    // 🔹 Normal token ekleme
    else if (token) {
      console.log('[STAFF INTERCEPTOR] Token bulundu, header eklendi');
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      if (!isAuthEndpoint) {
        console.warn('[STAFF INTERCEPTOR] Token yok → çıplak request gidiyor:', req.url);
      }
      authReq = req;
    }

    // 🔹 Hata yakalama
    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (skipAuthRecovery) {
          return throwError(() => err);
        }

        if (
          err.status === 401 &&
          !req.url.includes('/auth/login') &&
          !req.url.includes('/auth/refresh')
        ) {
          console.warn('[STAFF INTERCEPTOR] 401 yakalandı, refresh denenecek:', req.url);
          return this.handle401Error(authReq, next);
        }

        return throwError(() => err);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      console.log('[STAFF INTERCEPTOR] Refresh başlatılıyor...');

      return this.auth.refresh().pipe(
        switchMap(newToken => {
          this.isRefreshing = false;
          console.log('[STAFF INTERCEPTOR] Refresh başarılı, yeni token alındı:', newToken);

          this.refreshTokenSubject.next(newToken);
          const cloned = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next.handle(cloned);
        }),
        catchError(err => {
          console.error('[STAFF INTERCEPTOR] Refresh başarısız → logout ediliyor');
          this.isRefreshing = false;
          this.auth.logout().subscribe(() => this.router.navigate(['/login']));
          return throwError(() => err);
        })
      );
    } else {
      console.log('[STAFF INTERCEPTOR] Refresh zaten çalışıyor, bekleniyor...');
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          console.log('[STAFF INTERCEPTOR] Beklenen refresh tamamlandı, istek tekrar gönderiliyor');
          const cloned = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next.handle(cloned);
        })
      );
    }
  }
}
