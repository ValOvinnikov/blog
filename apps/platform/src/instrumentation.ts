import { waitUntil } from '@vercel/functions';
import type { Instrumentation } from 'next';

export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerLokiSink } =
      await import('@platform/server/log-shipping/register-loki-sink/register-loki-sink');
    registerLokiSink();
    const { logPersonalDataFallbacks } =
      await import('@platform/server/personal-data/log-personal-data-fallbacks/log-personal-data-fallbacks');
    logPersonalDataFallbacks();
  }
};

// Next does not await this for a render error, so the function can end before the import and the Loki push finish unless held open first.
export const onRequestError: Instrumentation.onRequestError = (...args) => {
  const logged =
    import('@platform/server/log-shipping/log-request-error/log-request-error').then(
      ({ logRequestError }) => logRequestError(...args),
    );
  waitUntil(logged);

  return logged;
};
