import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getPostPage } from './get-post-page';

const { getPostMock } = vi.hoisted(() => ({ getPostMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { post: { v1: { getPost: getPostMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getPostPage, () => {
  beforeEach(() => {
    getPostMock.mockReset();
  });

  it('forwards the slug and the resolved tenant context to the post service', async () => {
    getPostMock.mockResolvedValue({ ok: true, data: undefined });

    await getPostPage('hello-world');

    expect(getPostMock).toHaveBeenCalledWith(
      'hello-world',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getPost unchanged', async () => {
    const result = { ok: true, data: { id: 'post-1' } };
    getPostMock.mockResolvedValue(result);

    await expect(getPostPage('hello-world')).resolves.toBe(result);
  });
});

describe('getPostPage memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the post query across one render pass with the same arguments', async () => {
    getPostMock.mockReset();
    getPostMock.mockResolvedValue({ ok: true, data: undefined });

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

    const { getPostPage: freshGetPostPage } = await import('./get-post-page');

    await freshGetPostPage('hello-world');
    await freshGetPostPage('hello-world');

    expect(getPostMock).toHaveBeenCalledTimes(1);
  });
});
