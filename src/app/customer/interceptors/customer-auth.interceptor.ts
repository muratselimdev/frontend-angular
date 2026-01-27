import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CustomerAuthService } from '../services/customer-auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable()
export class CustomerAuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private auth: CustomerAuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('%c[CUSTOMER INTERCEPTOR] Aktif', 'color: limegreen; font-weight: bold;');

    // 🔹 Sadece /api/customer ile başlayan istekleri işleme al
    const isCustomerApi = req.url.startsWith(`${environment.apiUrl}/api/customer`);
    if (!isCustomerApi) {
      // Diğer tüm istekleri (staff, agent, login vb.) dokunmadan devam ettir
      return next.handle(req);
    }

    const token = this.auth.token;
    let authReq = req;

    if (token) {
      console.log('[CUSTOMER INTERCEPTOR] Token bulundu, header eklendi:', token);
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    } else {
      console.warn('[CUSTOMER INTERCEPTOR] Token bulunamadı, çıplak istek gidiyor:', req.url);
    }

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !this.isRefreshing) {
          console.warn('[CUSTOMER INTERCEPTOR] 401 alındı, refresh deneniyor...');
          this.isRefreshing = true;

          return this.auth.refresh().pipe(
            switchMap(() => {
              this.isRefreshing = false;
              const newToken = this.auth.token;
              console.log('[CUSTOMER INTERCEPTOR] Refresh başarılı, yeni token:', newToken);

              const retryReq = authReq.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              });

              return next.handle(retryReq);
            }),
            catchError(refreshErr => {
              console.error('[CUSTOMER INTERCEPTOR] Refresh başarısız → logout');
              this.isRefreshing = false;
              this.auth.logout().subscribe(() => this.router.navigate(['/customer/login']));
              return throwError(() => refreshErr);
            })
          );
        }

        return throwError(() => err);
      })
    );
  }
}
