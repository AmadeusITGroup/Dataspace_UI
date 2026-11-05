import { toAccidentalSecretId, toLegacySecretId, toSecretId } from './storage-account.model';

describe('storage-account.model', () => {
  it('builds the storage secret id as <account>-key1', () => {
    expect(toSecretId('dseprovider')).toBe('dseprovider-key1');
  });

  it('keeps the legacy storage secret id helper', () => {
    expect(toLegacySecretId('dseprovider')).toBe('dseprovider');
  });

  it('keeps the previous storage secret id helper for migration', () => {
    expect(toAccidentalSecretId('dseprovider')).toBe('dseprovider-key');
  });
});
