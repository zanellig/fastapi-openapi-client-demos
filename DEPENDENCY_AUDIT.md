# Dependency audit

Audit date: 2026-08-22

The dependency trees were resolved and checked before installation.

## JavaScript

The workspace generated a pnpm lockfile with `--lockfile-only --ignore-scripts`. The configured seven-day minimum release age rejected newly published versions of Orval, Vite, the Vite React plugin, and TanStack Query. The workspace uses the newest releases that passed that maturity window:

- React and React DOM 19.2.8
- React Router 8.3.0
- TanStack Query 5.101.4
- Hey API OpenAPI TypeScript 0.99.0
- Hey API Vite plugin 0.3.2
- Orval 8.24.0
- Vite 8.2.1
- Vite React plugin 6.0.5
- TypeScript 6.0.3

TanStack Query 5.101.4 is a direct runtime dependency of both frontend applications. Adding the Hey API parity integration reused the already locked and audited package tree, so it introduced no new package version or lifecycle script.

The first advisory scan found two high-severity CPU denial-of-service advisories in `js-yaml`, pulled in transitively by the Hey API generator. `pnpm-workspace.yaml` overrides that package to patched version 4.3.1.

After the override:

- `pnpm audit --audit-level=low` reported no known vulnerabilities.
- `pnpm peers check` reported no peer dependency issues.
- Direct packages use MIT, Apache-2.0, or compatible permissive licenses.
- No direct package declares an install or postinstall hook.
- `.npmrc` sets `ignore-scripts=true` for the complete dependency tree.

## Python

`uv lock` resolved the backend and test dependency tree without installing it. The direct packages are:

- FastAPI 0.141.1, MIT
- Uvicorn 0.52.4, BSD-3-Clause
- httpx2 2.12.0, BSD-3-Clause
- pytest 9.1.1, MIT

The initial test tree used `httpx`, but FastAPI emitted a deprecation warning recommending `httpx2`. The replacement package metadata and advisories were checked before the lockfile was changed.

The final `uv.lock` contains 23 third-party packages. A batch query against the OSV vulnerability database returned no known vulnerabilities for the exact resolved versions. None of the direct Python releases are yanked.
