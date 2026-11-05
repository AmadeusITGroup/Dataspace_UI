/** @jest-config-loader ts-node */
import type { Config } from 'jest';
import presets from 'jest-preset-angular/presets';
import path from 'path';

const config: Config = {
  ...presets.createCjsPreset({ tsconfig: '<rootDir>/projects/webapp/tsconfig.spec.json' }),
  // @design-factory/angular and its dependencies ship ESM as plain .js files,
  // so they must be transformed like the preset already does for *.mjs.
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@design-factory/|esm-env/|@agnos-ui/|@amadeus-it-group/tansu/)'
  ],
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
  setupFilesAfterEnv: [path.join(__dirname, 'setup-crypto.js')],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'projects/webapp/src/app/**/*.ts',
    '!projects/webapp/src/app/**/*.spec.ts',
    '!projects/webapp/src/app/**/*.module.ts',
    '!projects/webapp/src/app/**/*.routes.ts',
    '!projects/webapp/src/app/**/*.config.ts',
    '!projects/webapp/src/app/**/*.config.*.ts',
    '!projects/webapp/src/app/**/*.constant.ts',
    '!projects/webapp/src/app/features/**/*-management.service.ts'
  ],
  coverageReporters: ['html', 'text', 'lcov', 'json-summary'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/projects/webapp/src/app/features/dataset-management/services/*-management.service.ts',
    '.spec.ts$',
    '.config.ts$',
    '.constant.ts$'
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  }
};

export default config;
