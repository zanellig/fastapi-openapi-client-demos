const callExample = `const dispatches = useQuery(
  listDispatchesOptions({ query: { status: 'queued' } }),
);

const create = useMutation({
  ...createDispatchMutation(),
  onSuccess: () => queryClient.invalidateQueries({
    queryKey: listDispatchesQueryKey(),
  }),
});`;

export function ContractPage() {
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Hey API query generation path</p>
          <h1>One contract becomes an SDK and reusable query options.</h1>
          <p className="page-deck">
            FastAPI publishes JSON. The generator turns it into TypeScript types,
            Fetch operations, query keys, and TanStack Query options before
            application code runs.
          </p>
        </div>
        <a
          className="button button-primary"
          href="http://127.0.0.1:8010/docs"
          target="_blank"
          rel="noreferrer"
        >
          Open API docs
        </a>
      </header>

      <section className="contract-map">
        <article>
          <span>Python</span>
          <h2>FastAPI route</h2>
          <code>operation_id="createDispatch"</code>
        </article>
        <i aria-hidden="true" />
        <article>
          <span>HTTP</span>
          <h2>OpenAPI document</h2>
          <a href="http://127.0.0.1:8010/openapi.json">/openapi.json</a>
        </article>
        <i aria-hidden="true" />
        <article>
          <span>TanStack Query</span>
          <h2>Generated options</h2>
          <code>listDispatchesOptions()</code>
        </article>
      </section>

      <section className="code-panel">
        <div className="code-panel-heading">
          <span>src/pages/dispatches.tsx</span>
          <strong>Generated cache keys</strong>
        </div>
        <pre>
          <code>{callExample}</code>
        </pre>
      </section>

      <div className="contract-notes">
        <article>
          <h3>Query behavior</h3>
          <p>
            Generated option factories carry the request type, response type, query
            function, abort signal, and normalized query key into TanStack Query.
          </p>
        </article>
        <article>
          <h3>Mutation behavior</h3>
          <p>
            Generated mutation options call the typed SDK with error throwing enabled.
            Application code decides which query families to invalidate on success.
          </p>
        </article>
      </div>
    </div>
  );
}
