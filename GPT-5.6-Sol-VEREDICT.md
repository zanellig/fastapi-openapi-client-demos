# Hey API vs Orval verdict

My production pick today is Orval, but narrowly. Hey API was much nicer to integrate.

| Category | Hey API | Orval |
|---|---:|---:|
| Developer experience | 9.2/10 | 7.1/10 |
| Robustness | 7.8/10 | 8.6/10 |
| Production readiness | 7.6/10 | 8.7/10 |
| TanStack Query integration | 8.6/10 | 9.3/10 |
| Code-generation performance | 9.2/10* | 7.8/10* |
| Runtime performance | 9.0/10* | 9.0/10* |
| Overall | 8.2/10 | 8.6/10 |

`*` Performance scores are provisional.

## Why I would choose Orval

Orval has existed under the same package identity since 2020, has a stable major version, and has years of React Query integration behind it. It generates hooks, query keys, option factories, mutations, invalidation helpers, Fetch clients, Zod schemas, mocks, and runtime validation. [Orval React Query documentation](https://orval.dev/docs/guides/react-query/), [configuration options](https://orval.dev/docs/reference/configuration/output/).

Its biggest advantage is boring maturity. I would expect fewer major workflow changes over the life of a production application.

Orval 8 also made Fetch the default transport to reduce bundle size and added better runtime-validation support. [Orval 8 migration guide](https://orval.dev/docs/versions/v8).

Its weaknesses showed up clearly while building:

- Remote development watching required our polling bridge.
- Its configuration has many interacting options.
- I initially enabled `useQuery` and `useMutation` together and accidentally generated mutations for GET endpoints.
- The default Fetch output returns `{ data, status, headers }` for non-2xx responses instead of throwing. TanStack Query therefore considers an HTTP 500 a successful query execution unless application code checks the status or a custom mutator throws.
- Some generated naming was clumsy, such as `hTTPValidationError.ts`.
- Generated output was larger and noisier.

For production, I would use Orval with a custom Fetch mutator that throws on `!response.ok`, a runtime-configurable base URL, and optional response validation.

## Why Hey API is tempting

Hey API’s developer experience was noticeably better:

- Vite starts generation automatically.
- Remote polling is built in.
- Runtime client configuration is clean.
- The generated `data` and `error` result is pleasant to consume.
- Reserved operation IDs were sanitized correctly.
- Generation was very fast in our small contract.
- Its current TanStack Query plugin generates typed query options, mutation options, and query keys. [Hey API TanStack Query plugin](https://heyapi.dev/docs/openapi/typescript/plugins/tanstack-query).

The query-options approach is arguably more idiomatic TanStack Query v5 than wrapping everything in generated `useSomething()` hooks:

```ts
useQuery({
  ...getDispatchOptions({
    path: { dispatchId },
  }),
});
```

The problem is release stability. Hey API explicitly says `@hey-api/openapi-ts` is in initial development and recommends exact version pinning. [Hey API versioning guidance](https://heyapi.dev/docs/openapi/typescript/get-started).

We also found two high-severity advisories in its transitive YAML parser. A workspace override fixed them, but I would rather not encounter that while adopting a client generator. This does not make Hey API unsafe after the override, but it reduced my confidence in the default dependency tree.

## Performance

We did not run a controlled benchmark, so I would not claim a runtime winner.

Both ultimately call native `fetch()`. Network latency and JSON parsing will dwarf the difference between their generated request functions.

Our observed numbers were:

- Hey API generation reported roughly 56 to 100 milliseconds.
- Orval’s complete CLI invocation took roughly 1.3 seconds.
- Hey API example bundle: 96.50 kB gzip.
- Orval example bundle: 103.95 kB gzip.

The bundle comparison is unfair because the Orval application included TanStack Query while the Hey API application did not. If both used TanStack Query, I would expect nearly identical browser performance.

TanStack Query may make the application feel faster because caching avoids requests. That benefit comes from TanStack Query, not Orval itself.

## My experience building them

Hey API: 9/10.

It mostly got out of the way. The Vite integration felt like the workflow you originally described. The main friction was one TypeScript import-extension setting and the dependency audit override.

Orval: 7/10.

Once generated, the hooks were excellent. Getting there required more machinery and more understanding of Orval’s configuration model. The non-throwing HTTP behavior is also something I would fix before calling the client production-ready.

## Recommendation

For an AuditorIA-like application today, I would choose Orval because TanStack Query is central and I value long-term stability more than a polished development setup.

I would configure it with:

- Exact package versions
- A versioned local OpenAPI file in CI
- Generated output checked into source control
- A custom Fetch mutator with consistent typed errors
- Runtime response validation on critical endpoints
- A CI check that regeneration produces no diff

If Hey API reaches a stable major release and keeps its current Vite experience, I could easily see it becoming my preferred choice. It already feels better to use. The remaining question is whether its release and dependency stability catches up with its design.

## Post-verdict addendum: TanStack Query parity build

After writing the verdict above, the Hey API example was updated to generate and consume its official TanStack Query v5 artifacts. The application now uses `listDispatchesOptions()`, `getDispatchOptions()`, `getForecastOptions()`, `createDispatchMutation()`, `advanceDispatchMutation()`, and generated query keys through the same global `QueryClient` policy as the Orval application.

The generated query functions call the Hey API SDK with `throwOnError: true`. HTTP failures therefore enter TanStack Query's error state without the manual status checks required by the default Orval Fetch output in this experiment.

The equivalent production builds measured:

- Hey API with TanStack Query: 106.83 kB gzip
- Orval with TanStack Query: 103.95 kB gzip
- Difference: Hey API was 2.88 kB larger, about 2.8 percent

Hey API generated its five top-level artifacts in 109 milliseconds during the measured build. Orval's full command remained slower to start, but no controlled repeated benchmark was run.

This parity build strengthens my opinion of Hey API's TanStack Query integration. The generated option-factory approach is compact at the call site, inherits global `QueryClient` defaults, preserves direct access to the typed SDK, and has better default HTTP error semantics for TanStack Query. It does not change the version-stability concern or the overall production recommendation yet.

## Sources consulted during this session

### OpenAPI TypeScript and openapi-fetch

- [OpenAPI TypeScript introduction](https://openapi-ts.dev/introduction)
- [OpenAPI TypeScript CLI](https://openapi-ts.dev/cli)
- [OpenAPI TypeScript Node API](https://openapi-ts.dev/node)
- [OpenAPI TypeScript migration guide](https://openapi-ts.dev/migration-guide)
- [openapi-fetch introduction and setup](https://openapi-ts.dev/openapi-fetch/)
- [openapi-fetch API, custom Fetch, and middleware](https://openapi-ts.dev/openapi-fetch/api)
- [openapi-fetch testing guidance](https://openapi-ts.dev/openapi-fetch/testing)
- [OpenAPI TypeScript source repository](https://github.com/openapi-ts/openapi-typescript)

### Hey API

- [Hey API getting started and versioning](https://heyapi.dev/docs/openapi/typescript/get-started)
- [Hey API input and remote watch configuration](https://heyapi.dev/docs/openapi/typescript/configuration/input)
- [Hey API Vite plugin](https://heyapi.dev/docs/openapi/typescript/configuration/vite)
- [Hey API Fetch client](https://heyapi.dev/docs/openapi/typescript/clients/fetch)
- [Hey API SDK plugin](https://heyapi.dev/docs/openapi/typescript/plugins/sdk)
- [Hey API TanStack Query v5 plugin](https://heyapi.dev/docs/openapi/typescript/plugins/tanstack-query)
- [Hey API migration history and project lineage](https://heyapi.dev/docs/openapi/typescript/migrating)
- [Hey API source repository](https://github.com/hey-api/hey-api)
- [Hey API 0.48.2 source snapshot](https://github.com/hey-api/hey-api/tree/8bded06bb89b908f412d5fd61d06ebb11263a1c2)

### Orval

- [Orval home](https://orval.dev/)
- [Orval quick start](https://orval.dev/docs/quick-start/)
- [Orval installation](https://orval.dev/docs/installation/)
- [Orval basic configuration](https://orval.dev/docs/guides/basics/)
- [Orval Fetch generation](https://orval.dev/docs/guides/fetch/)
- [Orval Fetch client for query integrations](https://orval.dev/docs/guides/fetch-client/)
- [Orval React Query generation](https://orval.dev/docs/guides/react-query/)
- [Orval custom HTTP clients and mutators](https://orval.dev/docs/guides/custom-client/)
- [Orval client with Zod](https://orval.dev/docs/guides/client-with-zod/)
- [Orval runtime base URL configuration](https://orval.dev/docs/guides/set-base-url/)
- [Orval CLI and watch mode](https://orval.dev/docs/reference/cli/)
- [Orval configuration overview](https://orval.dev/docs/reference/configuration/)
- [Orval input configuration](https://orval.dev/docs/reference/configuration/input/)
- [Orval output and TanStack Query options](https://orval.dev/docs/reference/configuration/output/)
- [Orval complete configuration example](https://orval.dev/docs/reference/configuration/full-example/)
- [Orval programmatic API and watch integration](https://orval.dev/docs/reference/integration/)
- [Orval 8 migration guide](https://orval.dev/docs/versions/v8)
- [Orval source repository](https://github.com/orval-labs/orval)
- [Orval 6.31.0 source snapshot](https://github.com/orval-labs/orval/tree/v6.31.0)

### FastAPI

- [FastAPI client generation guidance](https://fastapi.tiangolo.com/advanced/generate-clients/)
- [FastAPI OpenAPI URL configuration](https://fastapi.tiangolo.com/how-to/conditional-openapi/)
- [FastAPI application and route reference](https://fastapi.tiangolo.com/reference/fastapi/)
- [FastAPI router reference](https://fastapi.tiangolo.com/reference/apirouter/)
- [FastAPI response model examples](https://fastapi.tiangolo.com/tutorial/extra-models/)

### React Router

- [React Router operating modes](https://github.com/remix-run/react-router/blob/main/docs/start/modes.md)
- [React Router nested routing and Outlet](https://github.com/remix-run/react-router/blob/main/docs/tutorials/address-book.md)
- [React Router client error reporting](https://github.com/remix-run/react-router/blob/main/docs/how-to/error-reporting.md)
- [React Router SPA and SSR configuration](https://github.com/remix-run/react-router/blob/main/docs/api/framework-conventions/react-router.config.ts.md)

### TanStack Query

- [TanStack Query React quick start](https://tanstack.com/query/latest/docs/framework/react/quick-start)
- [TanStack Query invalidation after mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
- [TanStack Query default query function and global configuration](https://tanstack.com/query/latest/docs/framework/react/guides/default-query-function)

### Package registries and release history

- [@hey-api/openapi-ts on npm](https://www.npmjs.com/package/@hey-api/openapi-ts)
- [@hey-api/vite-plugin on npm](https://www.npmjs.com/package/@hey-api/vite-plugin)
- [@hey-api/client-fetch on npm](https://www.npmjs.com/package/@hey-api/client-fetch)
- [Orval on npm](https://www.npmjs.com/package/orval)
- [openapi-typescript-codegen on npm](https://www.npmjs.com/package/openapi-typescript-codegen)
- [React on npm](https://www.npmjs.com/package/react)
- [React DOM on npm](https://www.npmjs.com/package/react-dom)
- [React Router on npm](https://www.npmjs.com/package/react-router)
- [TanStack React Query on npm](https://www.npmjs.com/package/@tanstack/react-query)
- [Vite on npm](https://www.npmjs.com/package/vite)
- [Vite React plugin on npm](https://www.npmjs.com/package/@vitejs/plugin-react)
- [TypeScript on npm](https://www.npmjs.com/package/typescript)
- [js-yaml on npm](https://www.npmjs.com/package/js-yaml)
- [npm download count API for Orval](https://api.npmjs.org/downloads/point/last-month/orval)
- [npm download count API for @hey-api/openapi-ts](https://api.npmjs.org/downloads/point/last-month/%40hey-api%2Fopenapi-ts)
- [FastAPI on PyPI](https://pypi.org/project/fastapi/)
- [Uvicorn on PyPI](https://pypi.org/project/uvicorn/)
- [httpx on PyPI](https://pypi.org/project/httpx/)
- [httpx2 on PyPI](https://pypi.org/project/httpx2/)
- [pytest on PyPI](https://pypi.org/project/pytest/)

### Security and dependency audit sources

- [OSV vulnerability database](https://osv.dev/)
- [OSV query API](https://api.osv.dev/v1/query)
- [OSV batch query API](https://api.osv.dev/v1/querybatch)
- [GHSA-52cp-r559-cp3m, js-yaml quadratic CPU consumption](https://github.com/advisories/GHSA-52cp-r559-cp3m)
- [GHSA-5p4m-2wfm-xmqj, js-yaml omap CPU consumption](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj)

### Repository and project-history sources

- [AuditorIA frontend repository, private](https://github.com/zanellig/Transcriber-Management-Frontend)
- [Published FastAPI OpenAPI client demos](https://github.com/zanellig/fastapi-openapi-client-demos)
- [Hey API GitHub project metadata and release tags](https://github.com/hey-api/hey-api)
- [Orval GitHub project metadata and release tags](https://github.com/orval-labs/orval)

### Local empirical evidence produced during this session

- [Demo setup and commands](./README.md)
- [Dependency audit record](./DEPENDENCY_AUDIT.md)
- [Hey API generated SDK](./apps/hey-api/src/api/generated/sdk.gen.ts)
- [Hey API generated TanStack Query options and keys](./apps/hey-api/src/api/generated/@tanstack/react-query.gen.ts)
- [Orval generated Fetch functions and TanStack Query hooks](./apps/orval/src/api/generated/dispatch-desk.ts)
- [Reserved-keyword OpenAPI fixture](./apps/hey-api/experiments/reserved-keywords.openapi.json)
- [Reserved-keyword generated SDK](./apps/hey-api/experiments/generated/sdk.gen.ts)
- [FastAPI interface tests](./backend/tests/test_api.py)
- [JavaScript dependency lockfile](./pnpm-lock.yaml)
- [Python dependency lockfile](./backend/uv.lock)

The local measurements came from repeated generator runs, strict TypeScript compilation, production Vite builds, `pnpm audit`, pnpm peer checks, OSV queries against the locked Python tree, FastAPI interface tests, and browser checks at desktop and 390-pixel widths. No controlled runtime benchmark was run.
