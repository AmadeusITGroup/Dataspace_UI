import { Configuration } from '@azure/msal-browser';
import { msalConfig as authCommonConfig } from './auth.config.common';
export * from './auth.config.common';
/**
 * Configuration for PRD instance of the application, disabling logging
 */
export const msalConfig: Configuration = {
  ...authCommonConfig,
  system: {
    loggerOptions: {
      loggerCallback: () => {
        return;
      },
      piiLoggingEnabled: false
    }
  }
};
