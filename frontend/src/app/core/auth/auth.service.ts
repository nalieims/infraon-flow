import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { LoginRequest, LoginResponse } from '../models/auth.model';
import { ApiService } from '../services/api.service';

/**
 * Session state holder. The access token is kept in memory only (never localStorage);
 * the refresh token is intended to live in an HttpOnly cookie set by the backend
 * (System Design §5.1, §9.1).
 */
@Injectable({ providedIn: 'root' })
export class AuthService extends ApiService {
  private readonly accessTokenState = signal<string | null>(null);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly isAuthenticated = computed(() => this.accessTokenState() !== null);

  /**
   * POST auth/login/ (public). On success, keeps the access token in memory.
   * The browser saves the refresh cookie by itself because of `withCredentials`.
   */
  login(body: LoginRequest): Observable<LoginResponse> {
    return this.post<LoginResponse>('auth/login/', body, { withCredentials: true }).pipe(
      tap((response) => this.setAccessToken(response.access)),
    );
  }

  setAccessToken(token: string | null): void {
    this.accessTokenState.set(token);
  }

  clearSession(): void {
    this.accessTokenState.set(null);
  }
}
