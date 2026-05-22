import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHighlightOptions } from 'ngx-highlightjs';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { workspaceInterceptor } from './core/auth/interceptors/workspace.interceptor';

import Aura from '@primeuix/themes/aura';
import { SessionStore } from './core/auth/session.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, workspaceInterceptor])),
    provideAppInitializer(() => inject(SessionStore).initialize()),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
        },
      },
    }),
    provideHighlightOptions({
      fullLibraryLoader: () => import('highlight.js'),
      lineNumbersLoader: () => import('ngx-highlightjs/line-numbers'),
    }),
  ],
};
