import { Configuration, LogLevel } from '@azure/msal-browser';

declare const CATALOG_API_KEY: string;
declare const ENTRA_CLIENT_ID: string;
declare const ENTRA_TENANT_ID: string;
declare const ENTRA_REDIRECT_URI: string;

export const catalogApiKeyAuth = CATALOG_API_KEY;

export const msalConfig: Configuration = {
  auth: {
    clientId: ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${ENTRA_TENANT_ID}`,
    redirectUri: `${ENTRA_REDIRECT_URI}`
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            //console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
      piiLoggingEnabled: false
    }
  }
};
