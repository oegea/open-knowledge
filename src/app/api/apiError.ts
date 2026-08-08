/**
 * Maps use case errors to HTTP responses. Domain/use case errors carry a
 * `[context]` prefix and a human-readable message; "not found" messages map
 * to 404, validation errors to 400.
 */
export function apiError(error: unknown): Response {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message.includes('not found') ? 404 : 400;
  return Response.json({ error: message }, { status });
}
