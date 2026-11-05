import { FormControl } from '@angular/forms';
import {
  accessTypes,
  deliveryMethods,
  domainCategories,
  piiConstraints,
  paymentConstraints,
  accessLevels,
  AuthTypesEnum,
  KafkaSecurityProtocolEnum,
  authMethods,
  kafkaSecurityProtocolOptions,
  kafkaSaslMechanisms,
  kafkaAutoOffsetReset,
  kafkaSecurityProtocols,
  filterAssetBySearch,
  buildFilterOptions,
  transformInAssetProperties,
  transformInSecret,
  transformInDataAddressRest,
  transformInSecretKafka,
  transformInDataAddressKafka,
  transformInSecretAzureBlob,
  transformInDataAddressAzureBlob
} from './dataset.util';
import { Asset } from '../model/asset/asset';
import { AssetProperties } from '../model/asset/assetProperties';

describe('dataset.util', () => {
  describe('Constants', () => {
    it('should define accessTypes', () => {
      expect(accessTypes.length).toBe(3);
      expect(accessTypes[0].label).toBe('All');
    });

    it('should define deliveryMethods', () => {
      expect(deliveryMethods.length).toBe(4);
      expect(deliveryMethods.some((m) => m.value === 'Api')).toBe(true);
      expect(deliveryMethods.some((m) => m.value === 'File')).toBe(true);
    });

    it('should define domainCategories', () => {
      expect(domainCategories.length).toBeGreaterThan(0);
    });

    it('should define piiConstraints', () => {
      expect(piiConstraints.length).toBe(3);
    });

    it('should define paymentConstraints', () => {
      expect(paymentConstraints.length).toBe(3);
    });

    it('should define accessLevels', () => {
      expect(accessLevels.length).toBe(4);
    });

    it('should define authMethods', () => {
      expect(authMethods.some((m) => m.value === AuthTypesEnum.OAuth2)).toBe(true);
    });

    it('should define kafkaSecurityProtocolOptions', () => {
      expect(kafkaSecurityProtocolOptions.length).toBe(4);
    });

    it('should define kafkaSaslMechanisms', () => {
      expect(kafkaSaslMechanisms.length).toBe(2);
    });

    it('should define kafkaAutoOffsetReset', () => {
      expect(kafkaAutoOffsetReset.length).toBe(2);
    });

    it('should define kafkaSecurityProtocols', () => {
      expect(kafkaSecurityProtocols.length).toBe(4);
    });
  });

  describe('filterAssetBySearch', () => {
    const mockAssets: Asset[] = [
      {
        '@id': 'asset-1',
        properties: {
          name: 'Test Dataset',
          description: 'Test description',
          contenttype: 'application/json'
        }
      } as Asset,
      {
        '@id': 'asset-2',
        properties: {
          name: 'Production Data',
          description: 'Prod dataset',
          contenttype: 'text/csv'
        }
      } as Asset
    ];

    it('should return all assets when no filter provided', () => {
      const result = filterAssetBySearch(mockAssets, {});
      expect(result.length).toBe(2);
    });

    it('should filter by name', () => {
      const result = filterAssetBySearch(mockAssets, { search: 'test' });
      expect(result.length).toBe(1);
      expect(result[0]['@id']).toBe('asset-1');
    });

    it('should filter by description', () => {
      const result = filterAssetBySearch(mockAssets, { search: 'prod' });
      expect(result.length).toBe(1);
      expect(result[0]['@id']).toBe('asset-2');
    });

    it('should filter by content type', () => {
      const result = filterAssetBySearch(mockAssets, { search: 'json' });
      expect(result.length).toBe(1);
    });

    it('should filter by id', () => {
      const result = filterAssetBySearch(mockAssets, { search: 'asset-2' });
      expect(result.length).toBe(1);
    });

    it('should return empty array when no match', () => {
      const result = filterAssetBySearch(mockAssets, { search: 'nonexistent' });
      expect(result.length).toBe(0);
    });

    it('should handle null filter', () => {
      const result = filterAssetBySearch(mockAssets, null as any);
      expect(result).toEqual(mockAssets);
    });
  });

  describe('buildFilterOptions', () => {
    const controls = {
      search: new FormControl(''),
      accessType: new FormControl(''),
      deliveryMethod: new FormControl(''),
      domainCategories: new FormControl(''),
      containsPII: new FormControl(''),
      containsPaymentInfo: new FormControl(''),
      accessLevel: new FormControl(''),
      licenses: new FormControl('')
    };

    it('should return filter options array', () => {
      const result = buildFilterOptions(controls);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include search filter', () => {
      const result = buildFilterOptions(controls);
      const searchFilter = result.find((f) => f.id === 'search');
      expect(searchFilter).toBeDefined();
      expect(searchFilter?.type).toBe('search');
    });

    it('should include accessType filter', () => {
      const result = buildFilterOptions(controls);
      const accessTypeFilter = result.find((f) => f.id === 'accessType');
      expect(accessTypeFilter).toBeDefined();
      expect(accessTypeFilter?.type).toBe('select');
    });

    it('should include deliveryMethod filter', () => {
      const result = buildFilterOptions(controls);
      const deliveryFilter = result.find((f) => f.id === 'deliveryMethod');
      expect(deliveryFilter).toBeDefined();
    });
  });

  describe('transformInAssetProperties', () => {
    it('should transform form values to asset properties', () => {
      const formValues = {
        properties: { name: 'Test Asset', description: 'Test' } as AssetProperties,
        version: '1.0.0',
        id: 'test-id'
      };

      const result = transformInAssetProperties(formValues);
      expect(result['@id']).toBe('test-id');
      expect(result.properties?.name).toBe('Test Asset');
      expect(result.properties?.version).toBe('1.0.0');
    });

    it('should use provided id parameter', () => {
      const formValues = {
        properties: {} as AssetProperties,
        version: '1.0.0',
        id: 'form-id'
      };

      const result = transformInAssetProperties(formValues, 'override-id');
      expect(result['@id']).toBe('override-id');
    });

    it('should remove empty properties', () => {
      const formValues = {
        properties: { name: 'Test', description: '' } as AssetProperties,
        version: '1.0.0',
        id: 'test-id'
      };

      const result = transformInAssetProperties(formValues);
      expect(result.properties?.description).toBeUndefined();
    });
  });

  describe('transformInSecret', () => {
    it('should return undefined when no auth type', () => {
      const formValues = {
        authType: '',
        baseAuth: { secretName: '', authCode: '' },
        oAuth2: { clientSecretKey: '', privateKeyName: '', secretValue: '' }
      };

      const result = transformInSecret(formValues);
      expect(result).toBeUndefined();
    });

    it('should transform BaseAuth secret', () => {
      const formValues = {
        authType: 'BaseAuth',
        baseAuth: { secretName: 'my-secret', authCode: 'code-123' },
        oAuth2: { clientSecretKey: '', privateKeyName: '', secretValue: '' }
      };

      const result = transformInSecret(formValues);
      expect(result?.['@type']).toBe('Secret');
      expect(result?.['@id']).toBe('my-secret');
      expect(result?.value).toBe('code-123');
    });

    it('should return undefined when BaseAuth missing secretName', () => {
      const formValues = {
        authType: 'BaseAuth',
        baseAuth: { secretName: '', authCode: 'code-123' },
        oAuth2: { clientSecretKey: '', privateKeyName: '', secretValue: '' }
      };

      const result = transformInSecret(formValues);
      expect(result).toBeUndefined();
    });

    it('should transform OAuth2 secret with clientSecretKey', () => {
      const formValues = {
        authType: 'OAuth2',
        baseAuth: { secretName: '', authCode: '' },
        oAuth2: { clientSecretKey: 'client-key', privateKeyName: '', secretValue: 'secret-123' }
      };

      const result = transformInSecret(formValues);
      expect(result?.['@id']).toBe('client-key');
      expect(result?.value).toBe('secret-123');
    });

    it('should transform OAuth2 secret with privateKeyName', () => {
      const formValues = {
        authType: 'OAuth2',
        baseAuth: { secretName: '', authCode: '' },
        oAuth2: { clientSecretKey: '', privateKeyName: 'private-key', secretValue: 'secret-123' }
      };

      const result = transformInSecret(formValues);
      expect(result?.['@id']).toBe('private-key');
    });

    it('should prioritize privateKeyName over clientSecretKey', () => {
      const formValues = {
        authType: 'OAuth2',
        baseAuth: { secretName: '', authCode: '' },
        oAuth2: { clientSecretKey: 'client', privateKeyName: 'private', secretValue: 'secret' }
      };

      const result = transformInSecret(formValues);
      expect(result?.['@id']).toBe('private');
    });
  });

  describe('transformInDataAddressRest', () => {
    it('should transform basic REST data address', () => {
      const formValues = {
        baseUrl: 'https://api.example.com',
        path: '/data',
        queryParams: 'param=value',
        proxyPath: 'true',
        proxyQueryParams: 'false',
        authType: '',
        baseAuth: { authKey: '', secretName: '', authCode: '' },
        oAuth2: { tokenUrl: '', clientId: '', clientSecretKey: '', privateKeyName: '', kid: '' }
      };

      const result = transformInDataAddressRest(formValues) as any;
      expect(result.type).toBe('HttpData');
      expect(result.baseUrl).toBe('https://api.example.com');
      expect(result.path).toBe('/data');
    });

    it('should include BaseAuth properties', () => {
      const formValues = {
        baseUrl: 'https://api.example.com',
        path: '/data',
        queryParams: '',
        proxyPath: 'false',
        proxyQueryParams: 'false',
        authType: 'BaseAuth',
        baseAuth: { authKey: 'Authorization', secretName: 'secret', authCode: 'code' },
        oAuth2: { tokenUrl: '', clientId: '', clientSecretKey: '', privateKeyName: '', kid: '' }
      };

      const result = transformInDataAddressRest(formValues) as any;
      expect(result.authKey).toBe('Authorization');
      expect(result.secretName).toBe('secret');
    });

    it('should delete secret info when deleteSecretInfo is true', () => {
      const formValues = {
        baseUrl: 'https://api.example.com',
        path: '/data',
        queryParams: '',
        proxyPath: 'false',
        proxyQueryParams: 'false',
        authType: 'BaseAuth',
        baseAuth: { authKey: 'Authorization', secretName: 'secret', authCode: 'code' },
        oAuth2: { tokenUrl: '', clientId: '', clientSecretKey: '', privateKeyName: '', kid: '' }
      };

      const result = transformInDataAddressRest(formValues, true) as any;
      expect(result.secretName).toBe(undefined);
    });

    it('should include OAuth2 properties', () => {
      const formValues = {
        baseUrl: 'https://api.example.com',
        path: '/data',
        queryParams: '',
        proxyPath: 'false',
        proxyQueryParams: 'false',
        authType: 'OAuth2',
        baseAuth: { authKey: '', secretName: '', authCode: '' },
        oAuth2: {
          tokenUrl: 'https://oauth.example.com/token',
          clientId: 'client-123',
          clientSecretKey: 'secret-key',
          privateKeyName: 'private-key',
          kid: 'key-id'
        }
      };

      const result = transformInDataAddressRest(formValues) as any;
      expect(result['oauth2:tokenUrl']).toBe('https://oauth.example.com/token');
      expect(result['oauth2:clientId']).toBe('client-123');
    });

    it('should delete OAuth2 clientSecretKey when deleteSecretInfo is true', () => {
      const formValues = {
        baseUrl: 'https://api.example.com',
        path: '/data',
        queryParams: '',
        proxyPath: 'false',
        proxyQueryParams: 'false',
        authType: 'OAuth2',
        baseAuth: { authKey: '', secretName: '', authCode: '' },
        oAuth2: {
          tokenUrl: 'https://oauth.example.com/token',
          clientId: 'client-123',
          clientSecretKey: 'secret-key',
          privateKeyName: 'private-key',
          kid: 'key-id'
        }
      };

      const result = transformInDataAddressRest(formValues, true) as any;
      expect(result['oauth2:clientSecretKey']).toBe(undefined);
    });
  });

  describe('transformInSecretKafka', () => {
    it('should return undefined for PLAINTEXT', () => {
      const formValues = {
        securityProtocol: KafkaSecurityProtocolEnum.PLAINTEXT,
        saslAuth: { secretName: '', password: '' }
      };

      const result = transformInSecretKafka(formValues);
      expect(result).toBeUndefined();
    });

    it('should return secret for SASL_PLAINTEXT', () => {
      const formValues = {
        securityProtocol: KafkaSecurityProtocolEnum.SASL_PLAINTEXT,
        saslAuth: { secretName: 'kafka-secret', password: 'pass123' }
      };

      const result = transformInSecretKafka(formValues);
      expect(result?.['@type']).toBe('Secret');
      expect(result?.['@id']).toBe('kafka-secret');
      expect(result?.value).toBe('pass123');
    });

    it('should return secret for SASL_SSL', () => {
      const formValues = {
        securityProtocol: KafkaSecurityProtocolEnum.SASL_SSL,
        saslAuth: { secretName: 'kafka-secret', password: 'pass123' }
      };

      const result = transformInSecretKafka(formValues);
      expect(result).toBeDefined();
    });

    it('should return undefined when secretName missing', () => {
      const formValues = {
        securityProtocol: KafkaSecurityProtocolEnum.SASL_PLAINTEXT,
        saslAuth: { secretName: '', password: 'pass123' }
      };

      const result = transformInSecretKafka(formValues);
      expect(result).toBeUndefined();
    });
  });

  describe('transformInDataAddressKafka', () => {
    it('should transform basic Kafka data address', () => {
      const formValues = {
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic',
        securityProtocol: KafkaSecurityProtocolEnum.PLAINTEXT
      };

      const result = transformInDataAddressKafka(formValues) as any;
      expect(result['@type']).toBe('DataAddress');
      expect(result.type).toBe('Kafka');
      expect(result.topic).toBe('test-topic');
      expect(result['kafka.bootstrap.servers']).toBe('localhost:9092');
    });

    it('should include SASL PLAIN configuration', () => {
      const formValues = {
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic',
        securityProtocol: KafkaSecurityProtocolEnum.SASL_PLAINTEXT,
        saslAuth: {
          mechanism: 'PLAIN',
          username: 'user',
          password: 'pass',
          secretName: 'secret'
        }
      };

      const result = transformInDataAddressKafka(formValues) as any;
      expect(result['sasl.mechanism']).toBe('PLAIN');
      expect(result['sasl.jaas.config']).toContain('PlainLoginModule');
    });

    it('should include SASL OAUTHBEARER configuration', () => {
      const formValues = {
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic',
        securityProtocol: KafkaSecurityProtocolEnum.SASL_PLAINTEXT,
        saslAuth: {
          mechanism: 'OAUTHBEARER',
          username: '',
          password: '',
          secretName: '',
          clientId: 'client-id',
          clientSecret: 'client-secret',
          tenantId: 'tenant-id',
          scope: 'scope'
        }
      };

      const result = transformInDataAddressKafka(formValues) as any;
      expect(result['sasl.mechanism']).toBe('OAUTHBEARER');
      expect(result['oauth.clientId']).toBe('client-id');
    });

    it('should include secretName for SASL_SSL with PLAIN', () => {
      const formValues = {
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic',
        securityProtocol: KafkaSecurityProtocolEnum.SASL_SSL,
        saslAuth: {
          mechanism: 'PLAIN',
          username: 'user',
          password: 'pass',
          secretName: 'secret'
        }
      };

      const result = transformInDataAddressKafka(formValues) as any;
      expect(result['secretName']).toBe('secret');
    });

    it('should delete secretName when deleteSecretInfo is true', () => {
      const formValues = {
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic',
        securityProtocol: KafkaSecurityProtocolEnum.SASL_SSL,
        saslAuth: {
          mechanism: 'PLAIN',
          username: 'user',
          password: 'pass',
          secretName: 'secret'
        }
      };

      const result = transformInDataAddressKafka(formValues, true) as any;
      expect(result['secretName']).toBe(undefined);
    });

    it('should include SSL/TLS configuration', () => {
      const formValues = {
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic',
        securityProtocol: KafkaSecurityProtocolEnum.SSL,
        sslAuth: {
          tlsCaSecret: 'ca-cert',
          mutualTls: true,
          tlsClientCert: 'client-cert',
          tlsClientKey: 'client-key'
        }
      };

      const result = transformInDataAddressKafka(formValues) as any;
      expect(result['tls_ca_secret']).toBe('ca-cert');
      expect(result['tls_client_cert']).toBe('client-cert');
    });

    it('should not include mutual TLS certs when mutualTls is false', () => {
      const formValues = {
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic',
        securityProtocol: KafkaSecurityProtocolEnum.SSL,
        sslAuth: {
          tlsCaSecret: 'ca-cert',
          mutualTls: false,
          tlsClientCert: 'client-cert',
          tlsClientKey: 'client-key'
        }
      };

      const result = transformInDataAddressKafka(formValues) as any;
      expect(result['tls_ca_secret']).toBe('ca-cert');
      expect(result['tls_client_cert']).toBeUndefined();
    });
  });

  describe('transformInSecretAzureBlob', () => {
    it('should return a secret when keyName and storageKey are provided', () => {
      const formValues = { keyName: 'my-key', storageKey: 'secret-value' };
      const result = transformInSecretAzureBlob(formValues);
      expect(result).toBeDefined();
      expect(result?.['@type']).toBe('Secret');
      expect(result?.['@id']).toBe('my-key');
      expect(result?.value).toBe('secret-value');
    });

    it('should return undefined when keyName is empty', () => {
      const formValues = { keyName: '', storageKey: 'secret-value' };
      const result = transformInSecretAzureBlob(formValues);
      expect(result).toBeUndefined();
    });

    it('should return undefined when storageKey is empty', () => {
      const formValues = { keyName: 'my-key', storageKey: '' };
      const result = transformInSecretAzureBlob(formValues);
      expect(result).toBeUndefined();
    });

    it('should return undefined when both are empty', () => {
      const formValues = { keyName: '', storageKey: '' };
      const result = transformInSecretAzureBlob(formValues);
      expect(result).toBeUndefined();
    });
  });

  describe('transformInDataAddressAzureBlob', () => {
    it('should transform basic Azure Blob data address', () => {
      const formValues = {
        account: 'mystorageaccount',
        container: 'my-container',
        blobName: 'data.json',
        keyName: 'my-key',
        storageKey: 'secret-value'
      };

      const result = transformInDataAddressAzureBlob(formValues) as any;
      expect(result['@type']).toBe('DataAddress');
      expect(result.type).toBe('AzureStorage');
      expect(result.account).toBe('mystorageaccount');
      expect(result.container).toBe('my-container');
      expect(result.blobName).toBe('data.json');
      expect(result.keyName).toBe('my-key');
    });

    it('should omit blobName when empty', () => {
      const formValues = {
        account: 'mystorageaccount',
        container: 'my-container',
        blobName: '',
        keyName: 'my-key',
        storageKey: 'secret-value'
      };

      const result = transformInDataAddressAzureBlob(formValues) as any;
      expect(result.blobName).toBeUndefined();
    });

    it('should clear keyName when deleteSecretInfo is true', () => {
      const formValues = {
        account: 'mystorageaccount',
        container: 'my-container',
        blobName: 'data.json',
        keyName: 'my-key',
        storageKey: 'secret-value'
      };

      const result = transformInDataAddressAzureBlob(formValues, true) as any;
      expect(result.keyName).toBeUndefined();
    });

    it('should keep keyName when deleteSecretInfo is false', () => {
      const formValues = {
        account: 'mystorageaccount',
        container: 'my-container',
        blobName: '',
        keyName: 'my-key',
        storageKey: 'secret-value'
      };

      const result = transformInDataAddressAzureBlob(formValues, false) as any;
      expect(result.keyName).toBe('my-key');
    });
  });
});
