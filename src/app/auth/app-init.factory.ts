import { AuthService } from './auth.service';

export function appInitFactory(auth: AuthService) {
  return () => {
    // Token yoksa veya süresi geçmişse refresh dene (cookie varsa).
    if (!auth.isLoggedIn) {
      return auth.refresh().toPromise().catch(() => void 0);
    }
    return Promise.resolve();
  };
}
