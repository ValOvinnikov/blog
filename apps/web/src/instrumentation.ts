import type { Instrumentation } from 'next';

export const register = async (): Promise<void> => {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerLokiSink } =
      await import('@web/server/log-shipping/register-loki-sink/register-loki-sink');
    registerLokiSink();
    const { logPersonalDataFallbacks } =
      await import('@web/server/personal-data/log-personal-data-fallbacks/log-personal-data-fallbacks');
    logPersonalDataFallbacks();
  }
};

export const onRequestError: Instrumentation.onRequestError = async (
  ...args
) => {
  const { logRequestError } =
    await import('@web/server/log-shipping/log-request-error/log-request-error');
  await logRequestError(...args);
};
