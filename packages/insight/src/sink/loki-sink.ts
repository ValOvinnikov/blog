import type { TLogContext } from '@blog/insight/logger/logger';

export interface ILokiSinkOptions {
  url: string;
  user: string;
  token: string;
}

// Bounds how long a hung Loki can hold a function open through waitUntil.
const PUSH_TIMEOUT_MS = 5_000;

function toStreamLabels(line: TLogContext): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const key of ['service', 'level'] as const) {
    const value = line[key];
    if (typeof value === 'string') {
      labels[key] = value;
    }
  }

  return labels;
}

function toUnixNanoseconds(line: TLogContext): string {
  const parsed = typeof line.ts === 'string' ? Date.parse(line.ts) : NaN;
  const millis = Number.isNaN(parsed) ? Date.now() : parsed;

  return `${millis}000000`;
}

function toBasicAuthorization(user: string, token: string): string | undefined {
  try {
    return `Basic ${btoa(`${user}:${token}`)}`;
  } catch {
    return undefined;
  }
}

export function createLokiSink({
  url,
  user,
  token,
}: ILokiSinkOptions): ((line: TLogContext) => Promise<void>) | undefined {
  const authorization = toBasicAuthorization(user, token);

  if (authorization === undefined) {
    return undefined;
  }

  return (line) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, PUSH_TIMEOUT_MS);

    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        streams: [
          {
            stream: toStreamLabels(line),
            values: [[toUnixNanoseconds(line), JSON.stringify(line)]],
          },
        ],
      }),
      signal: controller.signal,
    })
      .then(
        () => undefined,
        () => undefined,
      )
      .finally(() => {
        clearTimeout(timeout);
      });
  };
}
