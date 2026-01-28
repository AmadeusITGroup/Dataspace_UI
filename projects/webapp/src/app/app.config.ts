import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi
} from '@angular/common/http';
import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalService
} from '@azure/msal-angular';
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { Configuration as CatalogApiConfig } from 'catalog-sdk/configuration';
import { Configuration as ManagementBEApiConfig } from 'management-sdk-be/configuration';
import { Configuration as ManagementApiConfig } from 'management-sdk/configuration';
import { routes } from './app.routes';
import { basePath, managementBEContextPath, managementContextPath } from './config/api.config';
import { catalogApiKeyAuth, msalConfig } from './config/auth.config';
import { HomeGuard } from './core/home/home.guard';

export const authProviders: ApplicationConfig['providers'] = [];

if (msalConfig) {
  const msalNonNullConfig = msalConfig;

  function MSALInstanceFactory() {
    return new PublicClientApplication(msalNonNullConfig);
  }

  function MSALGuardConfigFactory(): MsalGuardConfiguration {
    return { interactionType: InteractionType.Redirect };
  }

  function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
    return {
      interactionType: InteractionType.Redirect,
      protectedResourceMap: new Map([
        ['https://graph.microsoft.com/v1.0/me', ['user.read']],
        [`${basePath}/*`, [`${msalNonNullConfig.auth.clientId}/.default`]]
      ])
    };
  }

  authProviders.push(
    MsalGuard,
    MsalBroadcastService,
    MsalService,
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    }
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    provideTanStackQuery(new QueryClient()),
    HomeGuard,
    {
      provide: ManagementApiConfig,
      useValue: new ManagementApiConfig({ basePath: managementContextPath })
    },
    {
      provide: ManagementBEApiConfig,
      useValue: new ManagementBEApiConfig({ basePath: managementBEContextPath })
    },
    {
      provide: CatalogApiConfig,
      useValue: new CatalogApiConfig({
        credentials: {
          ApiKeyAuth: catalogApiKeyAuth
        },
        basePath: managementContextPath
      })
    },
    ...authProviders
  ]
};
