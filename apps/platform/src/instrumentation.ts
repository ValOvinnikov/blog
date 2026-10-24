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

export const onRequestError: Instrumentation.onRequestError = async (
  ...args
) => {
  const { logRequestError } =
    await import('@platform/server/log-shipping/log-request-error/log-request-error');
  await logRequestError(...args);
};
