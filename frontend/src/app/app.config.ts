import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { requestIdInterceptor } from './core/interceptors/request-id.interceptor';
import { workspaceInterceptor } from './core/interceptors/workspace.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([requestIdInterceptor, authInterceptor, workspaceInterceptor])),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          // Must match the @layer order declared in styles.css.
          cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
          darkModeSelector: '.app-dark',
        },
      },
    }),
  ],
};
