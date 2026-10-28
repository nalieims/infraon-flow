import { CanActivateFn } from '@angular/router';

/**
 * PLACEHOLDER — allows all navigation until authentication is implemented (milestone M1).
 *
 * Once /api/v1/auth/* exists, this guard should restore the session via the refresh
 * endpoint and redirect unauthenticated users to /login using AuthService.isAuthenticated().
 * Route guards only improve navigation; the backend remains the authorization boundary.
 */
export const authGuard: CanActivateFn = () => true;
