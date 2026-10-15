import type { TLogContext } from '@blog/insight/logger/logger';

export interface ILokiSinkOptions {
  url: string;
  user: string;
  token: string;
}

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

export function createLokiSink({
  url,
  user,
  token,
}: ILokiSinkOptions): (line: TLogContext) => Promise<void> {
  const authorization = `Basic ${btoa(`${user}:${token}`)}`;

  return (line) =>
    fetch(url, {
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
    }).then(
      () => undefined,
      () => undefined,
    );
}
