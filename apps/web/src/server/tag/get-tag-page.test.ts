import { DEFAULT_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { getTagPage } from './get-tag-page';

const { getTagPageMock } = vi.hoisted(() => ({ getTagPageMock: vi.fn() }));

vi.mock('@blog/service', () => ({
  service: { pages: { tag: { v1: { getTagPage: getTagPageMock } } } },
}));

vi.mock('@web/server/request-context/request-context');

describe(getTagPage, () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
  });

  it('forwards the slug and the resolved tenant context to the tag page service', async () => {
    getTagPageMock.mockResolvedValue({ ok: true, data: undefined });

    await getTagPage('typescript');

    expect(getTagPageMock).toHaveBeenCalledWith(
      'typescript',
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('returns the raw TResult from getTagPage unchanged', async () => {
    const result = { ok: true, data: { tag: { title: 'TypeScript' } } };
    getTagPageMock.mockResolvedValue(result);

    await expect(getTagPage('typescript')).resolves.toBe(result);
  });
});

describe('getTagPage memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the tag-page query across one render pass with the same arguments', async () => {
    getTagPageMock.mockReset();
    getTagPageMock.mockResolvedValue({ ok: true, data: undefined });

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

    const { getTagPage: freshGetTagPage } = await import('./get-tag-page');

    await freshGetTagPage('typescript');
    await freshGetTagPage('typescript');

    expect(getTagPageMock).toHaveBeenCalledTimes(1);
  });
});
