// The backend returns `{ detail: string }` (ApiError) for 404 and 409.
// FastAPI's 422 `detail` is an array of validation errors, so callers keep a
// generic message for it. Orval casts `status` to the documented union, so the
// body is checked at runtime rather than trusted from the type.
export const responseDetail = (
  response: { status: number; data: unknown },
  fallback: string,
): string => {
  if (response.status !== 404 && response.status !== 409) {
    return fallback;
  }
  const { data } = response;
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const { detail } = data;
    if (typeof detail === 'string' && detail.length > 0) {
      return detail;
    }
  }
  return fallback;
};
