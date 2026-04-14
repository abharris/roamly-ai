export function ok(body: unknown, statusCode = 200) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export function created(body: unknown) {
  return ok(body, 201);
}

export function noContent() {
  return { statusCode: 204, body: '' };
}

export function error(statusCode: number, message: string) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: message }) };
}

export function handleError(e: unknown) {
  console.error(e);
  const err = e as any;
  const statusCode = err?.statusCode ?? 500;
  const message = err?.message ?? 'Internal server error';
  return error(statusCode, message);
}
