import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTopicPage } from './get-topic-page';

const { getTopicPageMock } = vi.hoisted(() => ({ getTopicPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { topic: { v1: { getTopicPage: getTopicPageMock } } } },
}));

vi.mock('@web/server/tenant/get-tenant-sanity-context', () => ({
  getTenantSanityContext: vi.fn(),
}));

describe(getTopicPage, () => {
  beforeEach(() => {
    getTopicPageMock.mockReset();
    vi.mocked(getTenantSanityContext).mockReset();
    vi.mocked(getTenantSanityContext).mockResolvedValue(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('resolves the tenant Sanity context, then forwards the slug and that context to service.pages.topic.v1.getTopicPage', async () => {
    getTopicPageMock.mockResolvedValue({ ok: true, data: undefined });

    await getTopicPage('engineering', 'tenant-1');

    expect(getTenantSanityContext).toHaveBeenCalledWith('tenant-1');
    expect(getTopicPageMock).toHaveBeenCalledWith(
      'engineering',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getTopicPage unchanged', async () => {
    const result = { ok: true, data: { topic: { title: 'Engineering' } } };
    getTopicPageMock.mockResolvedValue(result);

    await expect(getTopicPage('engineering', 'tenant-1')).resolves.toBe(result);
  });
});

describe('getTopicPage memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the topic-page query when called more than once in the same render pass with the same arguments', async () => {
    getTopicPageMock.mockReset();
    vi.mocked(getTenantSanityContext).mockReset();
    vi.mocked(getTenantSanityContext).mockResolvedValue(
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
    getTopicPageMock.mockResolvedValue({ ok: true, data: undefined });

    vi.doMock('react', async (importOriginal) => {
      const actual = await importOriginal<typeof import('react')>();
      return {
        ...actual,
        cache: <T extends (...args: never[]) => unknown>(fn: T) => {
          const cacheByArgs = new Map<string, unknown>();
          return ((...args: never[]) => {
            const key = JSON.stringify(args);
            if (!cacheByArgs.has(key)) {
              cacheByArgs.set(key, fn(...args));
            }
            return cacheByArgs.get(key);
          }) as T;
        },
      };
    });
    vi.resetModules();

    const { getTopicPage: freshGetTopicPage } =
      await import('./get-topic-page');

    await freshGetTopicPage('engineering', 'tenant-1');
    await freshGetTopicPage('engineering', 'tenant-1');

    expect(getTopicPageMock).toHaveBeenCalledTimes(1);
  });
});
