/** Body sent to `POST /auth/login/` (API Design, Auth > Login). */
export interface LoginRequest {
  email: string;
  password: string;
}

/** The signed-in user, as returned by login. */
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  timezone: string;
}

/**
 * Body returned by login with `200 OK`.
 * The refresh token is not here: the server sends it as the `infraon_refresh` cookie.
 */
export interface LoginResponse {
  access: string;
  user: AuthUser;
}
