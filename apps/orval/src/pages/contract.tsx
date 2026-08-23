const callExample = `const dispatches = useListDispatches({ status: 'queued' });

const create = useCreateDispatch({
  mutation: {
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: getListDispatchesQueryKey(),
    }),
  },
});`;

export function ContractPage() {
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Orval generation path</p>
          <h1>One contract becomes Fetch calls and query hooks.</h1>
          <p className="page-deck">
            A small sync process copies the remote JSON only when it changes. Orval
            watches that local file and regenerates hooks while Vite keeps running.
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
          <span>Remote source</span>
          <h2>FastAPI OpenAPI</h2>
          <code>127.0.0.1:8010/openapi.json</code>
        </article>
        <i aria-hidden="true" />
        <article>
          <span>Watched file</span>
          <h2>Local contract</h2>
          <code>openapi/openapi.json</code>
        </article>
        <i aria-hidden="true" />
        <article>
          <span>Generated output</span>
          <h2>Query hooks</h2>
          <code>useListDispatches(params)</code>
        </article>
      </section>

      <section className="code-panel">
        <div className="code-panel-heading">
          <span>src/pages/dispatches.tsx</span>
          <strong>Generated hooks</strong>
        </div>
        <pre>
          <code>{callExample}</code>
        </pre>
      </section>

      <div className="contract-notes">
        <article>
          <h3>Query behavior</h3>
          <p>
            GET operations receive deterministic query keys, cancellation signals,
            cache state, background refetching, and typed parameters.
          </p>
        </article>
        <article>
          <h3>Mutation behavior</h3>
          <p>
            POST operations become mutation hooks. Application code still decides
            which cached reads a successful domain transition invalidates.
          </p>
        </article>
      </div>
    </div>
  );
}
