import requestConfig from './request';
import { routing } from './routing';

// The global setup file stubs `next-intl/server` without `getRequestConfig`
// (nothing else needed it before this file) — `getRequestConfig` itself is
// just an identity function (next-intl returns the callback unchanged so
// the Next.js plugin can invoke it directly), reproduced here rather than
// loaded for real: the real module's `react-server`-conditional build
// throws under jsdom's client-like resolution.
vi.mock('next-intl/server', () => ({
  getRequestConfig: (fn: unknown) => fn,
}));

describe('i18n request config', () => {
  it('resolves the base locale messages for a supported requestLocale', async () => {
    const config = await requestConfig({
      requestLocale: Promise.resolve('EN'),
    });

    expect(config.locale).toBe('EN');
    expect(
      (config.messages as { notFound: { commandNotFound: string } }).notFound
        .commandNotFound,
    ).toBe('Not found');
  });

  it('falls back to the default locale when requestLocale is unsupported', async () => {
    const config = await requestConfig({
      requestLocale: Promise.resolve('xx'),
    });

    expect(config.locale).toBe(routing.defaultLocale);
  });
});
