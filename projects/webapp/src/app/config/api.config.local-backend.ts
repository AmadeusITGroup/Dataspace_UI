declare const BASE_PATH: string;
declare const AUTHORITY: string | undefined;

export const basePath = BASE_PATH;
export const authority = typeof AUTHORITY !== 'undefined' ? AUTHORITY : 'authority';
export const managementContextPath = `${basePath}/cp/management`;
export const managementBEContextPath = `${basePath}/cp/management`;
