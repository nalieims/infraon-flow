/**
 * Build-time frontend configuration. These values are compiled into the public bundle,
 * so they must never contain secrets.
 */
export interface AppEnvironment {
  production: boolean;
  appEnv: 'development' | 'production';
  /** Versioned API root without a trailing slash, e.g. http://localhost:8000/api/v1 */
  apiBaseUrl: string;
}
