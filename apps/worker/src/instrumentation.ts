export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerLokiSink } =
      await import('@worker/utils/register-loki-sink/register-loki-sink');
    registerLokiSink();
  }
}
