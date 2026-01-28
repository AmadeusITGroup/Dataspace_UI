<h1>Dataset Portal</h1>

## Introduction

This is the monorepo handling the website Dataset Portal.

## Prerequisites

- [Node.js] (https://nodejs.org/en/download) (v22+)
- [Java] (https://jdk.java.net/) (v23+ or latest)

## Features

- Built with [Angular](https://angular.dev/), [ng-bootstrap](https://ng-bootstrap.github.io/) and [Bootstrap](https://getbootstrap.com/)
- Hosted on Azure Static Webapp
- Tested with [Jest](https://jestjs.io/) and [Playwright](https://playwright.dev/)
- Formatted with [prettier](https://prettier.io/)
- Lint with [eslint](https://eslint.org/)

## Getting started

The project requires `npm` and can be launched in local by running `npm install` and `npm start`.  
The website is then available at http://localhost:4200

By default, `npm start` connects to the test environment. To connect to the dev environment instead, use `npm run dev`.

## Commands

The following commands can be launched in local:

- `npm run dev` - launch the website connected to the dev environment
- `npm run start:no-auth` - launch the website in local without the login flow
- `npm run test` - launch the unit tests with jest
- `npm run e2e` - launch the e2e tests with playwright
- `npm run lint` - lint the repository with eslint
- `npm run format:fix` - format the repository with prettier
- `npm run build` - build the two projects
- `npm run generate:sdk:catalog` - re-generate the catalog api services
- `npm run generate:sdk:management` - re-generate the management api services
- `npm run validate` - validate your code before pushing, your PR won't be pushed if the run fails
