/** @jest-config-loader ts-node */
import type { Config } from 'jest';
import presets from 'jest-preset-angular/presets';
import path from 'path';

const config: Config = {
  ...presets.createCjsPreset({ tsconfig: '<rootDir>/projects/webapp/tsconfig.spec.json' }),
  globals: {
    crypto,
    BASE_PATH: "'/api'",
    AUTHORITY: "'authority'",
    CATALOG_API_KEY: "'fa2ccbbfa5b4460797a20af50fcb2097'",
    ENTRA_CLIENT_ID: "'ca89a22f-2e26-4dd4-a580-b994379c5a1a'",
    ENTRA_TENANT_ID: "'d3bc2180-cb1e-40f7-b59a-154105743342'",
    ENTRA_REDIRECT_URI: "'http://localhost:4200'"
  },
  moduleNameMapper: {
    'catalog-sdk': `<rootDir>/projects/webapp/src/sdk/catalog`,
    'management-sdk': `<rootDir>/projects/webapp/src/sdk/management`
  },
  modulePathIgnorePatterns: ['dist'],
  setupFilesAfterEnv: [path.join(__dirname, 'setup-crypto.js')]
};

export default config;
