import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import { listDispatches } from '../api/generated/sdk.gen';
import type { Dispatch } from '../api/generated/types.gen';
import { formatStatus } from '../lib/format';

export function DashboardPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listDispatches()
      .then(({ data, error: responseError }) => {
        if (!active) {
          return;
        }
        if (responseError || !data) {
          setError('The dispatch board could not be loaded.');
          return;
        }
        setDispatches(data);
      })
      .catch(() => {
        if (active) {
          setError('The API did not answer. Start the backend and try again.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

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
          <p className="eyebrow">Live operations sample</p>
          <h1>Every call on this desk is generated from the Python contract.</h1>
        </div>
        <Link className="button button-primary" to="/dispatches">
          Open dispatch board
        </Link>
      </header>

      {error ? <div className="notice notice-error">{error}</div> : null}

      <section className="status-ledger" aria-label="Dispatch status summary">
        <div className="ledger-intro">
          <p>Today’s manifest</p>
          <span>{loading ? 'Reading API…' : `${dispatches.length} records`}</span>
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
          <h2>The handwritten client layer is only configuration.</h2>
          <p>
            Endpoint names, request bodies, path parameters, and response types
            come from the live OpenAPI document. Change the backend, regenerate,
            and TypeScript identifies every stale call.
          </p>
          <Link className="text-link" to="/contract">
            Inspect the contract flow
          </Link>
        </aside>
      </section>
    </div>
  );
}
