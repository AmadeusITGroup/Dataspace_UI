import { extractShortParticipantId, isSameParticipant } from './participant.util';

// DID shape of catalog participant ids (same shape as LoginService.fullParticipantId).
const PROVIDER_DID = 'did:web:provider-identityhub%3A8383:api:did';
const CONSUMER_DID = 'did:web:consumer-identityhub%3A8383:api:did';

describe('participant.util', () => {
  describe('extractShortParticipantId', () => {
    describe('did:web participant ids (DSP 2025-1)', () => {
      it('should take the host of a provider DID, not its trailing "did" segment', () => {
        expect(extractShortParticipantId(PROVIDER_DID)).toBe('provider');
      });

      it('should take the host of a real consumer DID', () => {
        expect(extractShortParticipantId(CONSUMER_DID)).toBe('consumer');
      });

      it('should handle an already-decoded port separator', () => {
        expect(extractShortParticipantId('did:web:provider-identityhub:8383:api:did')).toBe(
          'provider'
        );
      });

      it('should handle a fully URL-encoded DID', () => {
        expect(
          extractShortParticipantId('did%3Aweb%3Aprovider-identityhub%253A8383%3Aapi%3Adid')
        ).toBe('provider');
      });

      it('should keep a host that has no identityhub suffix and no path', () => {
        expect(extractShortParticipantId('did:web:participant123')).toBe('participant123');
      });

      it('should keep a dotted domain host', () => {
        expect(extractShortParticipantId('did:web:connector.example.com%3A443:api:did')).toBe(
          'connector.example.com'
        );
      });

      it('should fall back to the input when the DID has no host', () => {
        expect(extractShortParticipantId('did:web:')).toBe('did:web:');
      });
    });

    describe('legacy non-DID ids', () => {
      it('should extract the last part of a colon-separated participant ID', () => {
        const result = extractShortParticipantId('urn:uuid:participant:12345');
        expect(result).toBe('12345');
      });

      it('should handle already short participant IDs', () => {
        const result = extractShortParticipantId('participant123');
        expect(result).toBe('participant123');
      });

      it('should decode URL-encoded participant IDs', () => {
        const result = extractShortParticipantId('urn%3Auuid%3Aparticipant%3A67890');
        expect(result).toBe('67890');
      });

      it('should handle multiple colons and extract the last segment', () => {
        const result = extractShortParticipantId('a:b:c:d:e:final');
        expect(result).toBe('final');
      });

      it('should return an empty string for an empty id', () => {
        expect(extractShortParticipantId('')).toBe('');
      });

      it('should keep a malformed percent-encoding as is', () => {
        expect(extractShortParticipantId('urn:participant:100%')).toBe('100%');
      });
    });
  });

  describe('isSameParticipant', () => {
    it('should match the real provider DID against the full id of the provider build', () => {
      expect(isSameParticipant(PROVIDER_DID, { fullId: PROVIDER_DID, shortId: 'provider' })).toBe(
        true
      );
    });

    it('should match the real provider DID against the short name alone', () => {
      expect(isSameParticipant(PROVIDER_DID, { shortId: 'provider' })).toBe(true);
    });

    it('should not match another participant', () => {
      expect(isSameParticipant(CONSUMER_DID, { fullId: PROVIDER_DID, shortId: 'provider' })).toBe(
        false
      );
    });

    it('should not match on a suffix only (the old endsWith check)', () => {
      expect(isSameParticipant('did:web:notprovider', { shortId: 'provider' })).toBe(false);
    });

    it('should not match anything when the current participant is unknown', () => {
      expect(isSameParticipant(PROVIDER_DID, { fullId: null, shortId: null })).toBe(false);
      expect(isSameParticipant(PROVIDER_DID, {})).toBe(false);
    });

    it('should match a legacy id by its short segment', () => {
      expect(isSameParticipant('urn:uuid:participant:12345', { shortId: '12345' })).toBe(true);
    });

    it('should not match a DID with the same host but a different path', () => {
      expect(
        isSameParticipant('did:web:provider-identityhub%3A8383:other:did', {
          fullId: PROVIDER_DID,
          shortId: 'provider'
        })
      ).toBe(false);
    });

    it('should not match a DID with the same host but a different port', () => {
      expect(
        isSameParticipant('did:web:provider-identityhub%3A9393:api:did', {
          fullId: PROVIDER_DID,
          shortId: 'provider'
        })
      ).toBe(false);
    });

    it('should match the same DID fully URL-encoded or with lower-case escapes', () => {
      const current = { fullId: PROVIDER_DID, shortId: 'provider' };
      expect(
        isSameParticipant('did%3Aweb%3Aprovider-identityhub%253A8383%3Aapi%3Adid', current)
      ).toBe(true);
      expect(isSameParticipant('did:web:provider-identityhub%3a8383:api:did', current)).toBe(true);
    });

    it('should still match a legacy id by its short segment when the full id is a DID', () => {
      expect(
        isSameParticipant('urn:uuid:participant:provider', {
          fullId: PROVIDER_DID,
          shortId: 'provider'
        })
      ).toBe(true);
    });

    it('should not match an empty participant id', () => {
      expect(isSameParticipant('', { fullId: '', shortId: '' })).toBe(false);
    });
  });
});
