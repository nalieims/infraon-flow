/** Body sent to `POST /auth/register/` (API Design, Auth > Register). */
export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  accept_terms: boolean;
}

/** Body returned with `201 Created`. It never contains a token or password. */
export interface RegisterResponse {
  id: string;
  email: string;
  full_name: string;
  timezone: string;
}
