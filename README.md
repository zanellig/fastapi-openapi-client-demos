# FastAPI OpenAPI client demos

This workspace compares two type-safe TypeScript clients generated from one live FastAPI contract:

- `apps/hey-api` uses Hey API's generated Fetch SDK.
- `apps/orval` uses Orval's generated Fetch functions and TanStack Query hooks.
- `backend` is a small FastAPI service with an in-memory dispatch lifecycle and a deterministic forecast endpoint.

Both frontends are client-side React Router applications built with Vite. There is no server rendering or frontend server-function layer.

## Requirements

- Node.js 22.22 or newer
- pnpm 11
- Python 3.12 or newer
- uv 0.10 or newer

The repository pins direct JavaScript dependencies and both lockfiles. `.npmrc` disables dependency lifecycle scripts, so `pnpm install` does not run install or postinstall hooks.

## Install

From this directory:

```sh
pnpm install --frozen-lockfile --ignore-scripts
uv sync --project backend --locked
```

The resolved trees were audited before installation. See [DEPENDENCY_AUDIT.md](./DEPENDENCY_AUDIT.md).

## Run the backend

```sh
pnpm backend:dev
```

The API runs at `http://127.0.0.1:8010`:

- OpenAPI JSON: `http://127.0.0.1:8010/openapi.json`
- Interactive docs: `http://127.0.0.1:8010/docs`
- Health endpoint: `http://127.0.0.1:8010/api/health`

Port 8010 is intentional. Port 8000 was already occupied when the demos were created.

## Run the Hey API client

Keep the backend running, then open a second terminal:

```sh
pnpm hey:dev
```

Open `http://localhost:5173`. The Vite plugin generates the client when Vite starts. During development, Hey API polls the remote OpenAPI URL every 1.5 seconds and regenerates when the contract changes.

To generate once without starting Vite:

```sh
pnpm hey:generate
```

Generated files live in `apps/hey-api/src/api/generated` and should not be edited manually.

## Run the Orval client

Keep the backend running, then open another terminal:

```sh
pnpm orval:dev
```

Open `http://localhost:5174`. One command runs three coordinated development processes:

1. A small script validates and mirrors the remote OpenAPI JSON into `apps/orval/openapi/openapi.json`, but writes only when the content changes.
2. Orval watches that local file and regenerates the Fetch client and TanStack Query hooks.
3. Vite serves the SPA.

To sync and generate once:

```sh
pnpm orval:sync
pnpm orval:generate
```

Generated files live in `apps/orval/src/api/generated` and should not be edited manually.

## What the sample covers

The API uses explicit, stable `operation_id` values so generated functions remain readable:

- `getHealth()`
- `listDispatches({ status })`
- `createDispatch(body)`
- `getDispatch(dispatchId)`
- `advanceDispatch(dispatchId)`
- `getForecast({ city, days })`

The dispatch lifecycle belongs to the backend. A client can ask to advance a dispatch, but it cannot set an arbitrary status. The UI demonstrates typed query parameters, request bodies, path parameters, response models, documented errors, and query invalidation.

## Verify

```sh
pnpm audit:js
pnpm check
```

`pnpm check` runs the FastAPI interface tests, both TypeScript checks, and both production builds. Keep the backend running because the Hey API Vite plugin regenerates from the live OpenAPI URL during its build.

## Reserved keyword experiment

The Hey API app includes an isolated fixture whose operation IDs are reserved JavaScript or TypeScript words: `class`, `delete`, `default`, `function`, `interface`, and `enum`.

Run the generator and compile its output:

```sh
pnpm --filter @demo/hey-api experiment:reserved-keywords:check
```

With Hey API 0.99.0, the SDK generator appends an underscore to each unsafe binding name:

```ts
export const class_ = /* generated request */;
export const delete_ = /* generated request */;
export const interface_ = /* generated request */;
export const enum_ = /* generated request */;
```

The related model types use valid PascalCase names such as `ClassData` and `InterfaceResponse`. The generated fixture compiles under the workspace's strict TypeScript configuration.
