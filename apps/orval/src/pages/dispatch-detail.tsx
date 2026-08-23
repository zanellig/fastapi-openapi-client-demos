import { Link, useParams } from 'react-router';

import { useGetDispatch } from '../api/generated/dispatch-desk';
import { formatDate, formatStatus } from '../lib/format';

export function DispatchDetailPage() {
  const params = useParams();
  const dispatchId = Number(params.dispatchId);
  const validId = Number.isInteger(dispatchId) && dispatchId > 0;
  const dispatchQuery = useGetDispatch(dispatchId, {
    query: { enabled: validId },
  });
  const dispatch =
    dispatchQuery.data?.status === 200 ? dispatchQuery.data.data : null;
  const error = !validId
    ? 'The dispatch identifier is invalid.'
    : dispatchQuery.isError
      ? 'The API did not answer.'
      : dispatchQuery.data && dispatchQuery.data.status !== 200
        ? 'The API has no dispatch with this identifier.'
        : null;

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
              <p className="eyebrow">useGetDispatch(dispatchId)</p>
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
