const callExample = `const { data, error } = await createDispatch({
  body: {
    destination: 'Copper Ridge Observatory',
    contact: 'Nora Singh',
    priority: 'urgent',
  },
});`;

export function ContractPage() {
  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Generation path</p>
          <h1>One contract, no shared backend language.</h1>
          <p className="page-deck">
            FastAPI publishes JSON. The generator turns it into TypeScript types,
            named operations, and a Fetch-based client before application code runs.
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
          <span>TypeScript</span>
          <h2>Generated SDK</h2>
          <code>createDispatch(options)</code>
        </article>
      </section>

      <section className="code-panel">
        <div className="code-panel-heading">
          <span>src/pages/dispatches.tsx</span>
          <strong>Type-checked</strong>
        </div>
        <pre>
          <code>{callExample}</code>
        </pre>
      </section>

      <div className="contract-notes">
        <article>
          <h3>What the compiler catches</h3>
          <p>
            Misspelled operation names, missing request fields, invalid enum values,
            incorrect path parameters, and stale response assumptions.
          </p>
        </article>
        <article>
          <h3>What it cannot catch</h3>
          <p>
            A server response that violates its own OpenAPI document. Add generated
            runtime validators if that boundary needs active checking.
          </p>
        </article>
      </div>
    </div>
  );
}
