import { computed, inject, Injectable } from '@angular/core';
import { LoginService } from './login.service';
import { PermissionUI, PermissionUIPriority } from '../constants/permissions.const';

/**
 * The Login Service, using APIM
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly login = inject(LoginService);

  public permissionUI = computed(() => {
    const permissions = this.login.permissions() as PermissionUI[];
    return (
      permissions.sort(
        (a, b) => PermissionUIPriority.indexOf(a) - PermissionUIPriority.indexOf(b)
      )[0] || null
    );
  });

  public canRead = computed(() => {
    return this.permissionUI() !== null;
  });

  public canWrite = computed(() => {
    return [PermissionUI.WRITE, PermissionUI.ADMIN, PermissionUI.SUPERADMIN].includes(
      this.permissionUI()
    );
  });

  public isAdmin = computed(() => {
    return [PermissionUI.ADMIN, PermissionUI.SUPERADMIN].includes(this.permissionUI());
  });

  public isSuperAdmin = computed(() => {
    return this.permissionUI() === PermissionUI.SUPERADMIN;
  });
}
