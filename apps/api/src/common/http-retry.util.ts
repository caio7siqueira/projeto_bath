export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
  backoffMs = 500,
): Promise<Response> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, init);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        if (attempt === retries) return res;
      } else {
        return res;
      }
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
    }
    attempt += 1;
    const sleep = backoffMs * Math.pow(2, attempt);
    await new Promise((resolve) => setTimeout(resolve, sleep));
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed');
}
