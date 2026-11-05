# Dataset Portal

## Introduction

This monorepo contains the Dataset Portal website.

The Dataset Portal is a web-based frontend for the Dataspace Ecosystem, providing a user-friendly UI on top of the Eclipse Dataspace Connector (EDC). It enables data providers and consumers to discover, publish, and exchange datasets through a secure interface using JSON-LD standards for interoperability.

The portal manages the complete lifecycle of data sharing—from browsing federated catalogs to negotiating contracts and monitoring transfers. Built with Angular's standalone component architecture, it follows enterprise-grade practices including comprehensive testing and automated code quality checks.

### Key Features

The portal includes three main functional areas:

**Federated Catalog**

- Browse and discover datasets from multiple data providers
- Search and filter available datasets

**Dataset Management**

- Create and manage datasets as a data provider
- Define access policies for datasets
- Configure contract definitions for data sharing

**Contract Management**

- Initiate and track contract negotiations for dataset access
- Monitor contract transfers and data exchange status

## Prerequisites

- [Node.js](https://nodejs.org/en/download) (v22+)

## Features

- Built with [Angular](https://angular.dev/), [ng-bootstrap](https://ng-bootstrap.github.io/) and [Bootstrap](https://getbootstrap.com/)
- Tested with [Jest](https://jestjs.io/) and [Playwright](https://playwright.dev/)
- Formatted with [prettier](https://prettier.io/)
- Lint with [eslint](https://eslint.org/)

## Getting started

The project requires `npm` and can be launched in local by running `npm install` and `npm start`.

By default, `npm start` connects to the test environment. To connect to the dev environment instead, use `npm run dev`.

## Commands

### Development

Launch the website in different environments:

```bash
# Connect to test environment (default)
npm start

# Connect to dev environment
npm run dev

# Run without authentication (local development)
npm run start:no-auth

# Connect to local backend - provider mode
npm run start:local-backend-provider

# Connect to local backend - consumer mode
npm run start:local-backend-consumer

# Shortcut for provider mode
npm run start:local
```

The website will be available at http://localhost:4200

Start the backend locally by following the instructions [here](START-ALL-LOCALLY.md).

### Testing

Unit and end-to-end tests are implemented to ensure code reliability. Reports can be generated to review test results and coverage.

### Code Quality

Ensure code quality before committing:

```bash
# Lint the codebase
npm run lint

# Lint SCSS files
npm run stylelint

# Format code with Prettier
npm run format:fix

# Check formatting without modifying files
npm run format:check

# Run all validations (tests + lint + stylelint + e2e)
npm run validate
```

### Build & Generate

Build the application and regenerate SDK:

```bash
# Build the application (runs build:webapp-dev)
npm run build

# Build webapp for production with dev keys
npm run build:webapp-dev

# Build webapp for production
npm run build:webapp

# Watch mode for development
npm run watch

# Regenerate all SDKs
npm run generate:sdk

# Regenerate catalog API services
npm run generate:sdk:catalog

# Regenerate management API services
npm run generate:sdk:management

# Regenerate management backend API services
npm run generate:sdk:management-be
```

### Pre-Push Checklist

Before pushing your code, run:

```bash
npm run validate
```

This command runs tests, linting, stylelint, and e2e tests. Your PR won't be merged if this fails.

## Compliance and Security

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Security Audit](https://img.shields.io/badge/security-checked-blue)

The badges above represent the current build status and security audit results. For the most up-to-date information, refer to the CI/CD pipelines and security scanning reports used in this project.

## Azure Storage CORS Configuration

To use the **Storage Account Browse** feature (browsing containers and blobs from the UI when creating assets or initiating transfers), each Azure Storage account must have CORS (Cross-Origin Resource Sharing) configured to allow requests from the application's origin.

### Azure Portal

1. Go to your Storage Account in the Azure Portal
2. Navigate to **Settings > Resource sharing (CORS)**
3. Under the **Blob service** tab, add a rule with:
   - **Allowed origins**: your application origin (e.g., `http://localhost:4200`)
   - **Allowed methods**: `GET`
   - **Allowed headers**: `*`
   - **Exposed headers**: `*`
   - **Max age**: `3600`
4. Click **Save**

### Azure CLI

```bash
az storage cors add \
  --services b \
  --methods GET \
  --origins "<YOUR_APP_ORIGIN>" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name <ACCOUNT_NAME>
```

Replace `<YOUR_APP_ORIGIN>` with the origin where the portal is hosted (e.g., `http://localhost:4200` for local development) and `<ACCOUNT_NAME>` with your Azure Storage account name.

## License

This project is licensed under the terms specified in `LICENSE.txt`.
