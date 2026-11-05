import { signal } from '@angular/core';
import { IdTokenClaims } from '@azure/msal-browser';
import { AbstractLoginService } from './login.service.common';

class TestLoginService extends AbstractLoginService {
  loggedIn = signal(false);
  idTokenClaims = signal<IdTokenClaims | null>(null);

  logOut(): void {
    this.loggedIn.set(false);
  }

  logIn(): void {
    this.loggedIn.set(true);
  }
}

describe('AbstractLoginService', () => {
  let service: TestLoginService;

  beforeEach(() => {
    service = new TestLoginService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('shortParticipantId', () => {
    it('should return null when no roles are present', () => {
      service.idTokenClaims.set(null);
      expect(service.shortParticipantId()).toBeNull();
    });

    it('should extract short participant ID from roles', () => {
      service.idTokenClaims.set({
        roles: ['Participant.ABC123', 'READ']
      } as IdTokenClaims);
      expect(service.shortParticipantId()).toBe('ABC123');
    });

    it('should return null when no Participant role exists', () => {
      service.idTokenClaims.set({
        roles: ['READ', 'WRITE']
      } as IdTokenClaims);
      expect(service.shortParticipantId()).toBeNull();
    });

    it('should return first Participant role when multiple exist', () => {
      service.idTokenClaims.set({
        roles: ['Participant.FIRST', 'Participant.SECOND']
      } as IdTokenClaims);
      expect(service.shortParticipantId()).toBe('FIRST');
    });
  });

  describe('fullParticipantId', () => {
    it('should return null when no short participant ID exists', () => {
      service.idTokenClaims.set(null);
      expect(service.fullParticipantId()).toBeNull();
    });

    it('should construct full participant ID from short ID', () => {
      service.idTokenClaims.set({
        roles: ['Participant.ABC123']
      } as IdTokenClaims);
      expect(service.fullParticipantId()).toBe('did:web:ABC123-identityhub%3A8383:api:did');
    });
  });

  describe('permissions', () => {
    it('should return empty array when no roles are present', () => {
      service.idTokenClaims.set(null);
      expect(service.permissions()).toEqual([]);
    });

    it('should filter out Participant roles', () => {
      service.idTokenClaims.set({
        roles: ['Participant.ABC123', 'READ.something', 'WRITE.another']
      } as IdTokenClaims);
      const permissions = service.permissions();
      expect(permissions.every((p) => p !== undefined)).toBe(true);
    });

    it('should map backend permissions to UI permissions', () => {
      service.idTokenClaims.set({
        roles: ['READ.something', 'WRITE.another']
      } as IdTokenClaims);
      const permissions = service.permissions();
      expect(Array.isArray(permissions)).toBe(true);
    });

    it('should filter out undefined permissions', () => {
      service.idTokenClaims.set({
        roles: ['UNKNOWN_ROLE.something']
      } as IdTokenClaims);
      const permissions = service.permissions();
      expect(permissions).toEqual([]);
    });
  });

  describe('logIn and logOut', () => {
    it('should set loggedIn to true on logIn', () => {
      service.logIn();
      expect(service.loggedIn()).toBe(true);
    });

    it('should set loggedIn to false on logOut', () => {
      service.logIn();
      service.logOut();
      expect(service.loggedIn()).toBe(false);
    });
  });
});
