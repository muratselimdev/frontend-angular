import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { StaffAuthResponse, StaffProfile } from './auth.models';
import { environment } from '../../environments/environment';

// 🍪 Cookie okuma yardımcı
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 🔹 OneClinic staff token anahtarları (diğer bileşenlerle uyumlu)
  private tokenKey = 'staffToken';
  private expKey = 'staffExp';
  private profileKey = 'staffProfile';

  // 🔹 State yönetimi için BehaviorSubject
  token$ = new BehaviorSubject<string | null>(localStorage.getItem(this.tokenKey));
  profile$ = new BehaviorSubject<StaffProfile | null>(
    localStorage.getItem(this.profileKey)
      ? (JSON.parse(localStorage.getItem(this.profileKey) as string) as StaffProfile)
      : null
  );

  constructor(private http: HttpClient) {}

  // ============================================================
  // 🧩 Getter’lar
  // ============================================================

  get profile(): StaffProfile | null {
    return this.profile$.value;
  }

  get token(): string | null {
    return this.token$.value;
  }

  get userId(): number | null {
    const token = this.token;
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      const idClaim =
        decoded.sub ||
        decoded.nameid ||
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      return idClaim ? Number(idClaim) : null;
    } catch (err) {
      console.error('[AuthService] Token decode hatası:', err);
      return null;
    }
  }

  get isLoggedIn(): boolean {
    const t = this.token;
    const exp = localStorage.getItem(this.expKey);
    if (!t || !exp) return false;
    return new Date(exp) > new Date();
  }

  hasAnyRole(roles: string[]): boolean {
    const p = this.profile;
    if (!p) return false;
    return roles.some(r => r.toLowerCase() === (p.role || '').toLowerCase());
  }

  // ============================================================
  // 🔹 Login
  // ============================================================
  login(email: string, password: string): Observable<StaffProfile> {
    return this.http
      .post<StaffAuthResponse>(
        `${environment.apiUrl}/api/staff/auth/login`,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap(res => this.setSession(res)),
        map(res => res.profile)
      );
  }

  // ============================================================
  // 🔹 Refresh token (HttpOnly cookie)
  // ============================================================
  refresh(): Observable<string> {
    const xsrf = getCookie('XSRF-TOKEN');
    const headers = xsrf ? new HttpHeaders({ 'X-XSRF-TOKEN': xsrf }) : new HttpHeaders();
    return this.http
      .post<StaffAuthResponse>(
        `${environment.apiUrl}/api/staff/auth/refresh`,
        {},
        { withCredentials: true, headers }
      )
      .pipe(
        tap(res => this.setSession(res)),
        map(res => res.token)
      );
  }

  // ============================================================
  // 🔹 Logout
  // ============================================================
  logout(): Observable<void> {
    return this.http
      .post(`${environment.apiUrl}/api/staff/auth/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this.clearSession()),
        map(() => void 0),
        catchError(_ => {
          this.clearSession();
          return of(void 0);
        })
      );
  }

  // ============================================================
  // 🧩 Session set / clear
  // ============================================================
  private setSession(res: StaffAuthResponse) {
    // ✅ LocalStorage’a kaydet
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.expKey, res.expiresAt);
    localStorage.setItem(this.profileKey, JSON.stringify(res.profile));

    // ✅ BehaviorSubject’ları güncelle
    this.token$.next(res.token);
    this.profile$.next(res.profile);

    console.log('[AuthService] 🔐 Oturum kaydedildi:', res.profile?.email);
  }

  private clearSession() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.expKey);
    localStorage.removeItem(this.profileKey);
    this.token$.next(null);
    this.profile$.next(null);
    console.log('[AuthService] 🚪 Oturum temizlendi.');
  }

  // ============================================================
  // 🔹 Login sonrası yönlendirme
  // ============================================================
  redirectAfterLogin(): string {
    const role = this.profile?.role?.toLowerCase();
    switch (role) {
      case 'agent':
      case 'teamleader':
        return '/agent';
      case 'supervisor':
        return '/staff/supervisor';
      case 'salesmanager':
        return '/staff/management';
      case 'admin':
        return '/admin';
      case 'customer':
        return '/customer';
      default:
        return '/login';
    }
  }
}

// ============================================================
// 🧩 Basit JWT Decode (harici kütüphane gerekmeden)
// ============================================================
function jwtDecode(token: string): any {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    throw new Error('JWT parse edilemedi');
  }
}
