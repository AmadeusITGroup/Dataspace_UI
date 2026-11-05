import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PermissionService } from './permission.service';
import { LoginService } from './login.service';
import { PermissionUI } from '../constants/permissions.const';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockLoginService: Partial<LoginService>;
  let permissionsSignal: ReturnType<typeof signal<PermissionUI[]>>;

  beforeEach(() => {
    permissionsSignal = signal<PermissionUI[]>([]);
    mockLoginService = {
      permissions: permissionsSignal
    };

    TestBed.configureTestingModule({
      providers: [PermissionService, { provide: LoginService, useValue: mockLoginService }]
    });

    service = TestBed.inject(PermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('permissionUI', () => {
    it('should return null when no permissions', () => {
      permissionsSignal.set([]);
      expect(service.permissionUI()).toBeNull();
    });

    it('should return the highest priority permission (SUPERADMIN)', () => {
      permissionsSignal.set([PermissionUI.READ, PermissionUI.SUPERADMIN, PermissionUI.WRITE]);
      expect(service.permissionUI()).toBe(PermissionUI.SUPERADMIN);
    });

    it('should return ADMIN when available', () => {
      permissionsSignal.set([PermissionUI.READ, PermissionUI.ADMIN, PermissionUI.WRITE]);
      expect(service.permissionUI()).toBe(PermissionUI.ADMIN);
    });

    it('should return WRITE when no admin permissions', () => {
      permissionsSignal.set([PermissionUI.READ, PermissionUI.WRITE]);
      expect(service.permissionUI()).toBe(PermissionUI.WRITE);
    });

    it('should return READ when only read permission', () => {
      permissionsSignal.set([PermissionUI.READ]);
      expect(service.permissionUI()).toBe(PermissionUI.READ);
    });
  });

  describe('canRead', () => {
    it('should return true when user has any permission', () => {
      permissionsSignal.set([PermissionUI.READ]);
      expect(service.canRead()).toBe(true);
    });

    it('should return false when user has no permissions', () => {
      permissionsSignal.set([]);
      expect(service.canRead()).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('should return true for WRITE permission', () => {
      permissionsSignal.set([PermissionUI.WRITE]);
      expect(service.canWrite()).toBe(true);
    });

    it('should return true for ADMIN permission', () => {
      permissionsSignal.set([PermissionUI.ADMIN]);
      expect(service.canWrite()).toBe(true);
    });

    it('should return true for SUPERADMIN permission', () => {
      permissionsSignal.set([PermissionUI.SUPERADMIN]);
      expect(service.canWrite()).toBe(true);
    });

    it('should return false for READ permission', () => {
      permissionsSignal.set([PermissionUI.READ]);
      expect(service.canWrite()).toBe(false);
    });

    it('should return false for no permissions', () => {
      permissionsSignal.set([]);
      expect(service.canWrite()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for ADMIN permission', () => {
      permissionsSignal.set([PermissionUI.ADMIN]);
      expect(service.isAdmin()).toBe(true);
    });

    it('should return true for SUPERADMIN permission', () => {
      permissionsSignal.set([PermissionUI.SUPERADMIN]);
      expect(service.isAdmin()).toBe(true);
    });

    it('should return false for WRITE permission', () => {
      permissionsSignal.set([PermissionUI.WRITE]);
      expect(service.isAdmin()).toBe(false);
    });

    it('should return false for READ permission', () => {
      permissionsSignal.set([PermissionUI.READ]);
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for SUPERADMIN permission', () => {
      permissionsSignal.set([PermissionUI.SUPERADMIN]);
      expect(service.isSuperAdmin()).toBe(true);
    });

    it('should return false for ADMIN permission', () => {
      permissionsSignal.set([PermissionUI.ADMIN]);
      expect(service.isSuperAdmin()).toBe(false);
    });

    it('should return false for WRITE permission', () => {
      permissionsSignal.set([PermissionUI.WRITE]);
      expect(service.isSuperAdmin()).toBe(false);
    });

    it('should return false for READ permission', () => {
      permissionsSignal.set([PermissionUI.READ]);
      expect(service.isSuperAdmin()).toBe(false);
    });
  });
});
