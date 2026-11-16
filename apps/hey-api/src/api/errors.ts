import { client } from './generated/client.gen';

/** An HTTP error response from the API, with its status and parsed body. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export const isClientError = (error: unknown): boolean =>
  error instanceof ApiRequestError && error.status >= 400 && error.status < 500;

/**
 * The server's `detail` message when it sent one as a string (FastAPI 404/409).
 * Validation errors (422) carry an array instead, so they return `null`.
 */
export const errorDetail = (error: unknown): string | null => {
  if (!(error instanceof ApiRequestError)) {
    return null;
  }
  const { body } = error;
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const { detail } = body;
    return typeof detail === 'string' && detail.length > 0 ? detail : null;
  }
  return null;
};

let registered = false;

/**
 * Wraps HTTP error responses in `ApiRequestError` so callers keep the status.
 * Network failures (no response) pass through unchanged.
 */
export function registerApiErrorInterceptor(): void {
  if (registered) {
    return;
  }
  registered = true;
  client.interceptors.error.use((error, response) =>
    response && !response.ok && !(error instanceof ApiRequestError)
      ? new ApiRequestError(response.status, error)
      : error,
  );
}

/**
 * Picks a UI message: the server's `detail` when present, `rejected` for other
 * HTTP errors, and `unreachable` when the API produced no response at all.
 */
export const apiErrorMessage = (
  error: unknown,
  messages: { rejected: string; unreachable: string },
): string =>
  error instanceof ApiRequestError
    ? (errorDetail(error) ?? messages.rejected)
    : messages.unreachable;
