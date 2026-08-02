/**
 * Access Control Utilities
 *
 * Small helpers for handling HTTP 403 (Forbidden) responses from the backend.
 *
 * The global `Error403Modal` watches `sessionStorage['error_403']` and shows a
 * blocking modal whenever the api-client records a 403. Some areas (e.g. the
 * manager role on admin-only endpoints) are *expected* to receive 403 — for
 * those we want a graceful inline message instead of the global modal hijacking
 * the page. These helpers centralize that suppression.
 */

/** Returns true when the error represents a 403 Forbidden response. */
export function isForbiddenError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: unknown; response?: { status?: unknown } };
  return e?.status === 403 || e?.response?.status === 403;
}

/** Clear the global 403 flag so the Error403Modal does not fire. */
export function clearGlobal403(): void {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('error_403');
    }
  } catch {
    // Ignore storage access errors (e.g. SSR / private mode)
  }
}

/**
 * Swallow a 403 response: suppresses the global modal and returns `true`.
 * Use this in catch blocks where a 403 is an expected outcome for the
 * current role, so the page can render its own inline message instead.
 */
export function swallowForbidden(err: unknown): boolean {
  if (isForbiddenError(err)) {
    clearGlobal403();
    return true;
  }
  return false;
}
