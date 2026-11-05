/**
 * Short participant name from a participant id:
 * - `did:web:provider-identityhub%3A8383:api:did` -> `provider` (DID host, port and
 *   `-identityhub` suffix dropped; the `:api:did` path is ignored);
 * - legacy colon-separated ids (`urn:uuid:participant:12345`) -> last segment.
 */
const DID_WEB_PREFIX = 'did:web:';
const IDENTITY_HUB_SUFFIX = '-identityhub';

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function didWebHost(participantId: string): string | null {
  // decode a fully-encoded DID once; the host segment (`host%3Aport`) is decoded after isolation
  const id = participantId.startsWith(DID_WEB_PREFIX) ? participantId : safeDecode(participantId);
  if (!id.startsWith(DID_WEB_PREFIX)) {
    return null;
  }
  const hostSegment = id.substring(DID_WEB_PREFIX.length).split(':')[0];
  const host = safeDecode(hostSegment).split(':')[0];
  return host.endsWith(IDENTITY_HUB_SUFFIX) ? host.slice(0, -IDENTITY_HUB_SUFFIX.length) : host;
}

export function extractShortParticipantId(participantId: string): string {
  if (!participantId) {
    return '';
  }
  const host = didWebHost(participantId);
  if (host !== null) {
    return host || participantId;
  }
  const parts = safeDecode(participantId).split(':');
  return parts[parts.length - 1] || participantId;
}

/**
 * Canonical form of a did:web id for comparison, or null when it is not one: a fully URL-encoded
 * DID is decoded once and percent-escapes are upper-cased, but host, port and path are all kept.
 */
function canonicalDidWeb(participantId: string): string | null {
  const id = participantId.startsWith(DID_WEB_PREFIX) ? participantId : safeDecode(participantId);
  if (!id.startsWith(DID_WEB_PREFIX)) {
    return null;
  }
  return id.replace(/%[0-9a-f]{2}/gi, (escape) => escape.toUpperCase());
}

/**
 * Whether `participantId` designates the current participant. When both ids are did:web DIDs the
 * full DIDs decide (host, port and path must all match). The short name is only used when the
 * current full id is unknown or the participant id is a legacy non-DID id, and is never a suffix
 * match (`did:web:notprovider` is not `provider`).
 */
export function isSameParticipant(
  participantId: string,
  current: { fullId?: string | null; shortId?: string | null }
): boolean {
  if (!participantId) {
    return false;
  }
  if (current.fullId && participantId === current.fullId) {
    return true;
  }
  const participantDid = canonicalDidWeb(participantId);
  const currentDid = current.fullId ? canonicalDidWeb(current.fullId) : null;
  if (participantDid !== null && currentDid !== null) {
    return participantDid === currentDid;
  }
  return !!current.shortId && extractShortParticipantId(participantId) === current.shortId;
}
