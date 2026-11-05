import { SasTokenConfig } from '../services/sas-token.service';

/**
 * Azure Event Hub configuration for push transfers
 *
 * These credentials are used to generate SAS tokens for authenticating
 * push transfer requests to the Event Hub.
 */
export const EVENT_HUB_CONFIG: SasTokenConfig = {
  namespace: 'evhns-we-tst-acm-2qgvsm',
  entity: 'eventhub-to-api-service',
  keyName: 'send',
  keyValue: 'CHANGEI',
  expirySeconds: 7200 // 2 hours - token will be regenerated automatically
};

/**
 * Get the Event Hub endpoint URL
 */
export function getEventHubUrl(config: SasTokenConfig = EVENT_HUB_CONFIG): string {
  return `https://${config.namespace}.servicebus.windows.net/${config.entity}/messages`;
}
