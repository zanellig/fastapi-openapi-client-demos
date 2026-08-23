import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';

import {
  advanceDispatch,
  createDispatch,
  listDispatches,
} from '../api/generated/sdk.gen';
import type {
  Dispatch,
  DispatchStatus,
  Priority,
} from '../api/generated/types.gen';
import { formatDate, formatStatus, nextStatusLabel } from '../lib/format';

type Filter = DispatchStatus | 'all';

export function DispatchesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDispatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listDispatches({
        query: filter === 'all' ? {} : { status: filter },
      });
      if (result.error || !result.data) {
        setError('The dispatch list could not be loaded.');
        return;
      }
      setDispatches(result.data);
    } catch {
      setError('The API did not answer. Start the backend and try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadDispatches();
  }, [loadDispatches]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const destination = String(formData.get('destination') ?? '').trim();
    const contact = String(formData.get('contact') ?? '').trim();
    const note = String(formData.get('note') ?? '').trim();
    const priorityValue = formData.get('priority');
    const priority: Priority =
      priorityValue === 'urgent' ? 'urgent' : 'standard';

    if (destination.length < 2 || contact.length < 2) {
      setError('Destination and contact must each contain at least two characters.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await createDispatch({
        body: { destination, contact, note, priority },
      });
      if (result.error) {
        setError('The API rejected the new dispatch. Check the form values.');
        return;
      }
      form.reset();
      await loadDispatches();
    } catch {
      setError('The API did not answer. The dispatch was not created.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdvance = async (dispatchId: number) => {
    setError(null);
    try {
      const result = await advanceDispatch({ path: { dispatch_id: dispatchId } });
      if (result.error) {
        setError('This dispatch could not move to its next state.');
        return;
      }
      await loadDispatches();
    } catch {
      setError('The API did not answer. No status was changed.');
    }
  };

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Typed list, body, and mutation</p>
          <h1>Dispatch board</h1>
          <p className="page-deck">
            Filter with a generated enum, create with a generated request body,
            then advance a record through a server-owned lifecycle.
          </p>
        </div>
      </header>

      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="dispatch-layout">
        <section className="section-block dispatch-board">
          <div className="section-heading section-heading-wrap">
            <div>
              <p className="eyebrow">API response</p>
              <h2>{loading ? 'Loading…' : `${dispatches.length} dispatches`}</h2>
            </div>
            <div className="filter-row" aria-label="Filter dispatches">
              {(['all', 'queued', 'in_transit', 'delivered'] as const).map(
                (value) => (
                  <button
                    className={filter === value ? 'filter filter-active' : 'filter'}
                    key={value}
                    onClick={() => setFilter(value)}
                    type="button"
                  >
                    {value === 'all' ? 'All' : formatStatus(value)}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="dispatch-table" aria-live="polite">
            {dispatches.map((dispatch) => {
              const advanceLabel = nextStatusLabel(dispatch.status);
              return (
                <article className="dispatch-row" key={dispatch.id}>
                  <div className="dispatch-id">D-{String(dispatch.id).padStart(3, '0')}</div>
                  <div className="dispatch-main">
                    <Link to={`/dispatches/${dispatch.id}`}>
                      {dispatch.destination}
                    </Link>
                    <span>
                      {dispatch.contact} · {formatDate(dispatch.created_at)}
                    </span>
                  </div>
                  <span className={`status-chip status-${dispatch.status}`}>
                    {formatStatus(dispatch.status)}
                  </span>
                  <span className={`priority priority-${dispatch.priority}`}>
                    {dispatch.priority}
                  </span>
                  {advanceLabel ? (
                    <button
                      className="button button-small"
                      onClick={() => void handleAdvance(dispatch.id)}
                      type="button"
                    >
                      {advanceLabel}
                    </button>
                  ) : (
                    <span className="complete-mark">Complete</span>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="create-panel">
          <p className="eyebrow">POST /api/dispatches</p>
          <h2>Add to the manifest</h2>
          <form onSubmit={handleCreate}>
            <label>
              Destination
              <input name="destination" minLength={2} maxLength={80} required />
            </label>
            <label>
              Contact
              <input name="contact" minLength={2} maxLength={50} required />
            </label>
            <label>
              Handling note
              <textarea name="note" maxLength={160} rows={3} />
            </label>
            <label>
              Priority
              <select name="priority" defaultValue="standard">
                <option value="standard">Standard</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <button className="button button-primary button-full" disabled={saving}>
              {saving ? 'Creating…' : 'Create dispatch'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
