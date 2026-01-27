import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private baseUrl = `${environment.apiUrl}/api/customer/auth`;
  private tokenKey = 'customerToken';
  private profileKey = 'customerProfile';

  private currentTokenSubject = new BehaviorSubject<string | null>(this.getToken());
  public currentToken$ = this.currentTokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** 🔑 Giriş yap */
login(email: string, password: string): Observable<any> {
  return this.http.post(`${this.baseUrl}/login`, { email, password }, { withCredentials: true })
    .pipe(
      tap((res: any) => {
        console.log('🔹 [Customer Login] Giriş yanıtı:', res);

        if (res?.token) {
          localStorage.setItem('customerToken', res.token);
          localStorage.setItem('customerProfile', JSON.stringify(res.profile));

          console.log('✅ [Customer Login] Token kaydedildi:', res.token);
          console.log('👤 [Customer Login] Profil:', res.profile);
        } else {
          console.warn('⚠️ [Customer Login] Token bulunamadı!');
        }
      })
    );
}

  /** 👤 Kayıt ol */
  register(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data, { withCredentials: true });
  }

  /** 🔁 Token yenile */
  refresh(): Observable<any> {
    return this.http.post(`${this.baseUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap((res: any) => {
        if (res?.token) {
          this.setToken(res.token);
        }
      }),
      catchError(err => {
        console.warn('[CustomerAuthService] Refresh başarısız → Oturum sonlandırılıyor');
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  /** 🚪 Çıkış yap */
  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearSession()),
      catchError(err => {
        console.error('[CustomerAuthService] Logout hatası:', err);
        this.clearSession();
        return of(null);
      })
    );
  }

  /** 🎟️ Token yönetimi */
  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.currentTokenSubject.next(token);
  }

  public get token(): string | null {
    return this.getToken();
  }

  public get profile(): any {
    const data = localStorage.getItem(this.profileKey);
    return data ? JSON.parse(data) : null;
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** 🧹 Oturumu sıfırla */
  public clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.profileKey);
    this.currentTokenSubject.next(null);
  }
}
