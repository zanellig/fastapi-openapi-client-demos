import { useMemo } from 'react';
import { Link } from 'react-router';

import { useListDispatches } from '../api/generated/dispatch-desk';
import type { Dispatch } from '../api/generated/models';
import { formatStatus } from '../lib/format';

export function DashboardPage() {
  const dispatchQuery = useListDispatches();
  const dispatches: Dispatch[] =
    dispatchQuery.data?.status === 200 ? dispatchQuery.data.data : [];
  const error = dispatchQuery.isError
    ? 'The API did not answer. Start the backend and try again.'
    : dispatchQuery.data && dispatchQuery.data.status !== 200
      ? 'The dispatch board could not be loaded.'
      : null;

  const counts = useMemo(
    () => ({
      queued: dispatches.filter((item) => item.status === 'queued').length,
      moving: dispatches.filter((item) => item.status === 'in_transit').length,
      delivered: dispatches.filter((item) => item.status === 'delivered').length,
    }),
    [dispatches],
  );

  return (
    <div className="page-stack">
      <header className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">Generated query sample</p>
          <h1>Every read on this desk is cached by its generated query key.</h1>
        </div>
        <Link className="button button-primary" to="/dispatches">
          Open dispatch board
        </Link>
      </header>

      {error ? <div className="notice notice-error">{error}</div> : null}

      <section className="status-ledger" aria-label="Dispatch status summary">
        <div className="ledger-intro">
          <p>Today’s manifest</p>
          <span>
            {dispatchQuery.isPending
              ? 'Reading API…'
              : dispatchQuery.isFetching
                ? 'Refreshing cache…'
                : `${dispatches.length} cached records`}
          </span>
        </div>
        <div className="ledger-count ledger-count-blue">
          <strong>{counts.queued}</strong>
          <span>Queued</span>
        </div>
        <div className="ledger-count ledger-count-coral">
          <strong>{counts.moving}</strong>
          <span>In transit</span>
        </div>
        <div className="ledger-count ledger-count-green">
          <strong>{counts.delivered}</strong>
          <span>Delivered</span>
        </div>
      </section>

      <section className="split-section">
        <div className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest records</p>
              <h2>Manifest</h2>
            </div>
            <Link className="text-link" to="/dispatches">
              View all
            </Link>
          </div>
          <div className="manifest-list">
            {dispatches.slice(0, 3).map((dispatch) => (
              <Link
                className="manifest-row"
                to={`/dispatches/${dispatch.id}`}
                key={dispatch.id}
              >
                <span className={`status-dot status-${dispatch.status}`} />
                <span>
                  <strong>{dispatch.destination}</strong>
                  <small>{dispatch.contact}</small>
                </span>
                <em>{formatStatus(dispatch.status)}</em>
              </Link>
            ))}
          </div>
        </div>

        <aside className="field-note">
          <p className="eyebrow">What to notice</p>
          <h2>The query and mutation hooks are generated code.</h2>
          <p>
            Orval derives each hook, query key, parameter type, and response union
            from the same OpenAPI document. Mutations invalidate the dispatch query
            without inventing a second client-side contract.
          </p>
          <Link className="text-link" to="/contract">
            Inspect the contract flow
          </Link>
        </aside>
      </section>
    </div>
  );
}
