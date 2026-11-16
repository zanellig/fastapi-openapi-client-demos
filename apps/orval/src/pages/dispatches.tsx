import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';

import {
  getListDispatchesQueryKey,
  useAdvanceDispatch,
  useCreateDispatch,
  useListDispatches,
} from '../api/generated/dispatch-desk';
import type {
  Dispatch,
  DispatchStatus,
  ListDispatchesParams,
  Priority,
} from '../api/generated/models';
import { formatDate, formatStatus, nextStatusLabel } from '../lib/format';
import { responseDetail } from '../lib/response-detail';

type Filter = DispatchStatus | 'all';

export function DispatchesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const params: ListDispatchesParams | undefined =
    filter === 'all' ? undefined : { status: filter };
  const dispatchQuery = useListDispatches(params);
  const dispatches: Dispatch[] =
    dispatchQuery.data?.status === 200 ? dispatchQuery.data.data : [];

  const refreshDispatches = async () => {
    await queryClient.invalidateQueries({
      queryKey: getListDispatchesQueryKey(),
    });
  };

  const createMutation = useCreateDispatch({
    mutation: {
      onSuccess: async (response) => {
        if (response.status !== 201) {
          setError('The API rejected the new dispatch. Check the form values.');
          return;
        }
        await refreshDispatches();
      },
    },
  });

  const advanceMutation = useAdvanceDispatch({
    mutation: {
      onSuccess: (response) => {
        if (response.status !== 200) {
          setError(
            responseDetail(
              response,
              'This dispatch could not move to its next state.',
            ),
          );
        }
      },
      // A 404/409 also resolves here, and it means the cached list is out of
      // date, so refresh after every settled advance, not only on 200.
      onSettled: async () => {
        await refreshDispatches();
      },
    },
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
      const response = await createMutation.mutateAsync({
        data: { destination, contact, note, priority },
      });
      if (response.status === 201) {
        form.reset();
      }
    } catch {
      setError('The API did not answer. The dispatch was not created.');
    }
  };

  const handleAdvance = async (dispatchId: number) => {
    setError(null);
    try {
      await advanceMutation.mutateAsync({ dispatchId });
    } catch {
      setError('The API did not answer. No status was changed.');
    }
  };

  const queryError = dispatchQuery.isError
    ? 'The API did not answer. Start the backend and try again.'
    : dispatchQuery.data && dispatchQuery.data.status !== 200
      ? 'The dispatch list could not be loaded.'
      : null;

  return (
    <div className="page-stack">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Generated query and mutation hooks</p>
          <h1>Dispatch board</h1>
          <p className="page-deck">
            The filter changes the query key. Successful mutations invalidate every
            cached dispatch list, including lists with a status filter.
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
          <p className="eyebrow">useCreateDispatch()</p>
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
