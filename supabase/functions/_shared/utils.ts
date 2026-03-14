export function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function parseJson(request: Request) {
  try {
    const payload = await request.json();
    return { payload, error: null };
  } catch {
    return { payload: null, error: 'Invalid JSON payload' };
  }
}

export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 400): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

export function logEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ...details, ts: new Date().toISOString() }));
}

