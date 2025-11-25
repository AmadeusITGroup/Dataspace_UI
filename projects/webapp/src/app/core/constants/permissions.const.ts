export enum PermissionUI {
  READ = 'READ',
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN'
}

export const PermissionBEMapping = {
  Read: PermissionUI.READ,
  Write: PermissionUI.WRITE,
  Admin: PermissionUI.ADMIN,
  SuperAdmin: PermissionUI.SUPERADMIN
};

export const PermissionUIPriority: PermissionUI[] = [
  PermissionUI.SUPERADMIN,
  PermissionUI.ADMIN,
  PermissionUI.WRITE,
  PermissionUI.READ
];
