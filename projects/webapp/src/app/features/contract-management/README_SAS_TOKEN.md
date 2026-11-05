# SAS Token Setup (HTTP Push)

For HTTP Push to work, update this file:

`projects/webapp/src/app/features/contract-management/config/event-hub.config.ts`

Replace these values in `EVENT_HUB_CONFIG`:

- `namespace`: the Event Hub namespace (without `.servicebus.windows.net`)
- `entity`: the Event Hub name
- `keyName`: the Shared Access Policy name (in our case its the `send`)
- `keyValue`: the policy key value

Minimal example:

```typescript
export const EVENT_HUB_CONFIG: SasTokenConfig = {
  namespace: 'your-namespace',
  entity: 'your-eventhub',
  keyName: 'send',
  keyValue: 'your-policy-key',
  expirySeconds: 3600
};
```
