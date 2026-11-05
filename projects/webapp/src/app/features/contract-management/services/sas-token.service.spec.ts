import { TestBed } from '@angular/core/testing';
import { SasTokenService } from './sas-token.service';

describe('SasTokenService', () => {
  let service: SasTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SasTokenService]
    });
    service = TestBed.inject(SasTokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a valid SAS token', async () => {
    const config = {
      namespace: 'test-namespace',
      entity: 'test-entity',
      keyName: 'test-key',
      keyValue: 'unit-test-key-value',
      expirySeconds: 3600
    };

    const result = await service.generateSasToken(config);

    expect(result).toBeDefined();
    expect(result.token).toContain('SharedAccessSignature');
    expect(result.token).toContain('sr=');
    expect(result.token).toContain('sig=');
    expect(result.token).toContain('se=');
    expect(result.token).toContain('skn=test-key');
    expect(result.expiresAt).toBeGreaterThan(Date.now() / 1000);
  });

  it('should cache tokens', async () => {
    const config = {
      namespace: 'test-namespace',
      entity: 'test-entity',
      keyName: 'test-key',
      keyValue: 'unit-test-key-value',
      expirySeconds: 3600
    };

    const result1 = await service.generateSasToken(config);
    const result2 = await service.generateSasToken(config);

    // Should return the same cached token
    expect(result1.token).toBe(result2.token);
    expect(result1.expiresAt).toBe(result2.expiresAt);
  });

  it('should generate new token when cache expires', async () => {
    const config = {
      namespace: 'test-namespace',
      entity: 'test-entity',
      keyName: 'test-key',
      keyValue: 'unit-test-key-value',
      expirySeconds: 1 // Very short expiry
    };

    const result1 = await service.generateSasToken(config);

    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result2 = await service.generateSasToken(config);

    // Should generate a new token
    expect(result1.token).not.toBe(result2.token);
    expect(result2.expiresAt).toBeGreaterThan(result1.expiresAt);
  });

  it('should clear cache', async () => {
    const config = {
      namespace: 'test-namespace',
      entity: 'test-entity',
      keyName: 'test-key',
      keyValue: 'unit-test-key-value',
      expirySeconds: 3600
    };

    await service.generateSasToken(config);
    service.clearCache();

    // After clearing cache, a new token should be generated
    const result = await service.generateSasToken(config);
    expect(result).toBeDefined();
  });

  it('should handle Event Hub configuration', async () => {
    const eventHubConfig = {
      namespace: 'evhns-we-tst-acm-2qgvsm',
      entity: 'eventhub-to-api-service',
      keyName: 'send',
      keyValue: 'unit-test-send-key',
      expirySeconds: 3600
    };

    const result = await service.generateSasToken(eventHubConfig);

    expect(result.token).toContain('SharedAccessSignature');
    expect(result.token).toContain(
      'sr=https%3A%2F%2Fevhns-we-tst-acm-2qgvsm.servicebus.windows.net%2Feventhub-to-api-service%2Fmessages'
    );
    expect(result.token).toContain('skn=send');
    expect(result.expiresAt).toBeGreaterThan(Date.now() / 1000);
    expect(result.expiresAt).toBeLessThanOrEqual(Date.now() / 1000 + 3600);
  });
});
