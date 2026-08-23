import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { getDispatch } from '../api/generated/sdk.gen';
import type { Dispatch } from '../api/generated/types.gen';
import { formatDate, formatStatus } from '../lib/format';

export function DispatchDetailPage() {
  const params = useParams();
  const dispatchId = Number(params.dispatchId);
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(dispatchId) || dispatchId < 1) {
      setError('The dispatch identifier is invalid.');
      return;
    }
    let active = true;
    getDispatch({ path: { dispatch_id: dispatchId } })
      .then(({ data, error: responseError }) => {
        if (!active) {
          return;
        }
        if (responseError || !data) {
          setError('The API has no dispatch with this identifier.');
          return;
        }
        setDispatch(data);
      })
      .catch(() => {
        if (active) {
          setError('The API did not answer.');
        }
      });
    return () => {
      active = false;
    };
  }, [dispatchId]);

  return (
    <div className="page-stack narrow-page">
      <Link className="text-link back-link" to="/dispatches">
        ← Dispatch board
      </Link>
      {error ? <div className="notice notice-error">{error}</div> : null}
      {!dispatch && !error ? <div className="notice">Loading dispatch…</div> : null}
      {dispatch ? (
        <article className="detail-sheet">
          <header>
            <div>
              <p className="eyebrow">GET /api/dispatches/{'{dispatch_id}'}</p>
              <h1>{dispatch.destination}</h1>
            </div>
            <span className={`status-chip status-${dispatch.status}`}>
              {formatStatus(dispatch.status)}
            </span>
          </header>
          <dl>
            <div>
              <dt>Dispatch</dt>
              <dd>D-{String(dispatch.id).padStart(3, '0')}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{dispatch.contact}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd>{dispatch.priority}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(dispatch.created_at)}</dd>
            </div>
          </dl>
          <div className="handling-note">
            <span>Handling note</span>
            <p>{dispatch.note || 'No special handling instructions.'}</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}
