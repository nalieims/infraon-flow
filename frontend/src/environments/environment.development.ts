import { AppEnvironment } from './environment.model';

// Local development (`ng serve`). Replaces environment.ts via angular.json fileReplacements.
export const environment: AppEnvironment = {
  production: false,
  appEnv: 'development',
  apiBaseUrl: 'http://10.0.4.202:8082/api/v1',
};
