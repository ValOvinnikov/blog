import { waitUntil } from '@vercel/functions';
import type { Instrumentation } from 'next';

export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerLokiSink } =
      await import('@web/server/log-shipping/register-loki-sink/register-loki-sink');
    registerLokiSink();
  }
};

// Next does not await this for a render error, so the function can end before the import and the Loki push finish unless held open first.
export const onRequestError: Instrumentation.onRequestError = (...args) => {
  const logged =
    import('@web/server/log-shipping/log-request-error/log-request-error').then(
      ({ logRequestError }) => logRequestError(...args),
    );
  waitUntil(logged);

  return logged;
};
