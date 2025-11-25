export function extractShortParticipantId(participantId: string): string {
  const decodedParticipantId = decodeURIComponent(participantId);
  const parts = decodedParticipantId.split(':');
  return parts[parts.length - 1];
}
