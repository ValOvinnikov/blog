import { createLokiSink, registerLogSink } from '@blog/insight';
import { waitUntil } from '@vercel/functions';
import { env } from '@worker/utils/env/env';

function isHttpUrl(value: string): boolean {
  if (!URL.canParse(value)) {
    return false;
  }

  const { protocol } = new URL(value);

  return protocol === 'https:' || protocol === 'http:';
}

export function registerLokiSink(): boolean {
  const { LOKI_PUSH_URL: url, LOKI_USER: user, LOKI_TOKEN: token } = env;

  if (!url || !user || !token || !isHttpUrl(url)) {
    return false;
  }

  const push = createLokiSink({ url, user, token });

  if (!push) {
    return false;
  }

  registerLogSink((line) => {
    waitUntil(push(line));
  });

  return true;
}
