import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router';

import {
  advanceDispatchMutation,
  createDispatchMutation,
  listDispatchesOptions,
  listDispatchesQueryKey,
} from '../api/generated/@tanstack/react-query.gen';
import type {
  Dispatch,
  DispatchStatus,
  Priority,
} from '../api/generated/types.gen';
import { formatDate, formatStatus, nextStatusLabel } from '../lib/format';

type Filter = DispatchStatus | 'all';

export function DispatchesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const dispatchQuery = useQuery(
    filter === 'all'
      ? listDispatchesOptions()
      : listDispatchesOptions({ query: { status: filter } }),
  );
  const dispatches: Dispatch[] = dispatchQuery.data ?? [];

  const refreshDispatches = () =>
    queryClient.invalidateQueries({ queryKey: listDispatchesQueryKey() });

  const createMutation = useMutation({
    ...createDispatchMutation(),
    onSuccess: refreshDispatches,
  });

  const advanceMutation = useMutation({
    ...advanceDispatchMutation(),
    onSuccess: refreshDispatches,
  });

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

    setError(null);
    try {
      await createMutation.mutateAsync({
        body: { destination, contact, note, priority },
      });
      form.reset();
    } catch {
      setError('The API rejected the dispatch or did not answer.');
    }
  };

  const handleAdvance = async (dispatchId: number) => {
    setError(null);
    try {
      await advanceMutation.mutateAsync({
        path: { dispatch_id: dispatchId },
      });
    } catch {
      setError('This dispatch could not move to its next state.');
    }
  };

  const queryError = dispatchQuery.isError
    ? 'The API did not answer. Start the backend and try again.'
    : null;

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Generated query and mutation options</p>
          <h1>Dispatch board</h1>
          <p className="page-deck">
            The filter changes the generated query key. Successful generated
            mutations invalidate every cached dispatch list.
          </p>
        </div>
      </header>

      {error || queryError ? (
        <div className="notice notice-error">{error ?? queryError}</div>
      ) : null}

      <div className="dispatch-layout">
        <section className="section-block dispatch-board">
          <div className="section-heading section-heading-wrap">
            <div>
              <p className="eyebrow">TanStack Query cache</p>
              <h2>
                {dispatchQuery.isPending
                  ? 'Loading…'
                  : `${dispatches.length} dispatches`}
              </h2>
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
                  <div className="dispatch-id">
                    D-{String(dispatch.id).padStart(3, '0')}
                  </div>
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
                      disabled={advanceMutation.isPending}
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
          <p className="eyebrow">createDispatchMutation()</p>
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
            <button
              className="button button-primary button-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create dispatch'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
