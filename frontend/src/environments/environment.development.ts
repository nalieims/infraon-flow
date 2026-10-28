import { AppEnvironment } from './environment.model';

// Local development (`ng serve`). Replaces environment.ts via angular.json fileReplacements.
export const environment: AppEnvironment = {
  production: false,
  appEnv: 'development',
  apiBaseUrl: 'http://localhost:8000/api/v1',
};
