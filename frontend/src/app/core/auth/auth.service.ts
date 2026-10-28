import { Injectable, computed, signal } from '@angular/core';

/**
 * Session state holder. The access token is kept in memory only (never localStorage);
 * the refresh token is intended to live in an HttpOnly cookie set by the backend
 * (System Design §5.1, §9.1).
 *
 * Login, refresh and logout calls are implemented in milestone M1 once the
 * /api/v1/auth/* endpoints exist.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessTokenState = signal<string | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenState() !== null);

  setAccessToken(token: string | null): void {
    this.accessTokenState.set(token);
  }

  clearSession(): void {
    this.accessTokenState.set(null);
  }
}
