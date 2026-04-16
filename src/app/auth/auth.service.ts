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

  constructor(private http: HttpClient) {
    this.restoreProfileFromToken();
  }

  // ============================================================
  // 🧩 Getter’lar
  // ============================================================

  get profile(): StaffProfile | null {
    return this.profile$.value ?? this.buildProfileFromToken();
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
    const profile = this.normalizeProfile(res.profile, res.token, this.profile$.value);

    // ✅ LocalStorage’a kaydet
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.expKey, res.expiresAt);
    localStorage.setItem(this.profileKey, JSON.stringify(profile));

    // ✅ BehaviorSubject’ları güncelle
    this.token$.next(res.token);
    this.profile$.next(profile);

    console.log('[AuthService] 🔐 Oturum kaydedildi:', profile?.email);
  }

  private restoreProfileFromToken() {
    const hydratedProfile = this.buildProfileFromToken(this.profile$.value);
    if (!hydratedProfile) {
      return;
    }

    const currentProfile = this.profile$.value;
    const hasChanged = JSON.stringify(currentProfile) !== JSON.stringify(hydratedProfile);
    if (!hasChanged) {
      return;
    }

    localStorage.setItem(this.profileKey, JSON.stringify(hydratedProfile));
    this.profile$.next(hydratedProfile);
  }

  private normalizeProfile(
    profile: Partial<StaffProfile> | null | undefined,
    token?: string | null,
    existingProfile?: StaffProfile | null
  ): StaffProfile {
    const rawProfile = (profile ?? {}) as Record<string, unknown>;
    const tokenProfile = this.buildProfileFromToken(existingProfile, token) ?? existingProfile ?? null;

    const rawFullName = this.getRawString(rawProfile, ['fullName', 'FullName', 'name', 'Name']);
    const parsedName = this.parseName(rawFullName);

    const firstName =
      this.getRawString(rawProfile, ['firstName', 'FirstName', 'givenName', 'GivenName']) ||
      parsedName.firstName ||
      tokenProfile?.firstName ||
      '';

    const lastName =
      this.getRawString(rawProfile, ['lastName', 'LastName', 'familyName', 'FamilyName', 'surname', 'Surname']) ||
      parsedName.lastName ||
      tokenProfile?.lastName ||
      '';

    const idValue =
      this.getRawNumber(rawProfile, ['id', 'Id', 'staffId', 'StaffId', 'userId', 'UserId']) ||
      tokenProfile?.id ||
      0;

    return {
      id: idValue,
      firstName,
      lastName,
      email:
        this.getRawString(rawProfile, ['email', 'Email', 'userName', 'UserName']) ||
        tokenProfile?.email ||
        '',
      role:
        this.getRawString(rawProfile, ['role', 'Role']) ||
        tokenProfile?.role ||
        '',
      branchId:
        this.getRawNumber(rawProfile, ['branchId', 'BranchId']) ??
        tokenProfile?.branchId ??
        null,
      languageGroupId:
        this.getRawNumber(rawProfile, ['languageGroupId', 'LanguageGroupId']) ??
        tokenProfile?.languageGroupId ??
        null,
      nickname:
        this.getRawString(rawProfile, ['nickname', 'Nickname']) ||
        tokenProfile?.nickname ||
        null,
      agentLevel:
        this.getRawString(rawProfile, ['agentLevel', 'AgentLevel']) ||
        tokenProfile?.agentLevel ||
        null
    };
  }

  private buildProfileFromToken(existingProfile?: StaffProfile | null, tokenOverride?: string | null): StaffProfile | null {
    const token = tokenOverride ?? this.token$.value;
    if (!token) {
      return existingProfile ?? null;
    }

    try {
      const decoded: any = jwtDecode(token);
      const fullName = this.getClaimValue(decoded, [
        'name',
        'unique_name',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
      ]);
      const parsedName = this.parseName(fullName);

      const firstName =
        existingProfile?.firstName ||
        this.getClaimValue(decoded, [
          'given_name',
          'firstName',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
        ]) ||
        parsedName.firstName;

      const lastName =
        existingProfile?.lastName ||
        this.getClaimValue(decoded, [
          'family_name',
          'lastName',
          'surname',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
        ]) ||
        parsedName.lastName;

      const email =
        existingProfile?.email ||
        this.getClaimValue(decoded, [
          'email',
          'upn',
          'preferred_username',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
        ]) ||
        '';

      const role =
        existingProfile?.role ||
        this.getClaimValue(decoded, [
          'role',
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
          'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'
        ]) ||
        '';

      const idClaim = this.getClaimValue(decoded, [
        'sub',
        'nameid',
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
      ]);
      const id = existingProfile?.id ?? (idClaim ? Number(idClaim) : 0);

      return {
        id,
        firstName,
        lastName,
        email,
        role,
        branchId: existingProfile?.branchId ?? null,
        languageGroupId: existingProfile?.languageGroupId ?? null,
        nickname: existingProfile?.nickname ?? null,
        agentLevel: existingProfile?.agentLevel ?? null
      };
    } catch (err) {
      console.error('[AuthService] Profil hydration hatası:', err);
      return existingProfile ?? null;
    }
  }

  private getClaimValue(decodedToken: any, keys: string[]): string {
    for (const key of keys) {
      const value = decodedToken?.[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private getRawString(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private getRawNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = source[key];
      const parsedValue = Number(value);
      if (Number.isInteger(parsedValue) && parsedValue > 0) {
        return parsedValue;
      }
    }

    return null;
  }

  private parseName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) {
      return { firstName: '', lastName: '' };
    }

    const parts = fullName.split(' ').filter(Boolean);
    if (!parts.length) {
      return { firstName: '', lastName: '' };
    }

    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ')
    };
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
