# MagazinSucuri

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.6.

## Development server

## Runtime requirements

Use `Node.js 22.x LTS` for local development.

This repository is intentionally pinned to Node 22 via:

- `.nvmrc`
- `.node-version`
- `package.json#engines`
- `.npmrc` with `engine-strict=true`

If you use `nvm`, run:

```bash
nvm use
```

If you run the project with newer unsupported majors such as Node 25, Angular 19 may fail with build crashes or unstable native tooling behavior.

## Stable Docker stack

For a runtime isolated from local Node.js, the project can now run fully through Docker:

```bash
docker compose up -d db backend frontend
```

Services:

- frontend: `http://localhost:4200`
- backend: `http://localhost:4300`
- database: `localhost:55432`

The Docker frontend also runs on Node 22 and proxies `/api` traffic to the backend container, so it avoids local Node compatibility issues.

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

`npm start` starts the Docker PostgreSQL database, waits for it to accept connections on `127.0.0.1:55432`, then starts the local API and Angular frontend. If the API on `:4300` or frontend on `:4200` is already running, the existing process is reused.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
