import { AppEnvironment } from './environment.model';

// Production build. The SPA is served by Nginx, which reverse-proxies /api/v1/ to Django.
export const environment: AppEnvironment = {
  production: true,
  appEnv: 'production',
  apiBaseUrl: '/api/v1',
};
