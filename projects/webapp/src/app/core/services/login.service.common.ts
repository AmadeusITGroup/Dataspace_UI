import { computed } from '@angular/core';
import { IdTokenClaims } from '@azure/msal-browser';
import { PermissionBEMapping } from '../constants/permissions.const';

export abstract class AbstractLoginService {
  abstract readonly loggedIn: () => boolean;
  abstract readonly idTokenClaims: () => IdTokenClaims | null;
  public readonly shortParticipantId = computed(() => {
    const roles = this.idTokenClaims()?.roles;
    return roles?.find((role) => role.startsWith('Participant.'))?.substring(12) ?? null;
  });
  public readonly permissions = computed(() => {
    const roles = this.idTokenClaims()?.roles as string[];
    return (roles || [])
      .filter((role) => !role.startsWith('Participant.'))
      .map((role) => role.split('.')[0] as keyof typeof PermissionBEMapping)
      .map((role) => PermissionBEMapping[role])
      .filter(Boolean);
  });
  public readonly fullParticipantId = computed(() => {
    const shortId = this.shortParticipantId();
    return shortId ? `did:web:${shortId}-identityhub%3A8383:api:did` : null;
  });

  abstract logOut(): void;
  abstract logIn(): void;
}
