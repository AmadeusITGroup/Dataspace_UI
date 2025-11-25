declare const BASE_PATH: string;
declare const PARTICIPANT_ID: string;

export const basePath = BASE_PATH;
export const catalogContextPath = `${basePath}/authority/catalog`;
export const managementContextPath = `${basePath}/${PARTICIPANT_ID}/cp/management`;
