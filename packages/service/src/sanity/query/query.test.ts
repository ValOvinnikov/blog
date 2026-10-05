import type { TLocaleIsoCode } from '@blog/config/constants';
import type { IGroqBuilder } from 'groqd';

import { q, runQuery, type TSlugParams } from './query';

const { mockFetch, getClientMock } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  const getClientMock = vi.fn(() => ({ fetch: mockFetch }));
  return { mockFetch, getClientMock };
});

vi.mock('@blog/service/sanity/client/client', () => ({
  getClient: getClientMock,
}));

const testTenant = {
  projectId: 'tenant-a',
  dataset: 'production',
  token: 'tok',
};

describe(runQuery, () => {
  it('rejects, rather than resolving to a falsy value, when the fetch resolves null for a slice(0)+notNull query', async () => {
    mockFetch.mockResolvedValue(null);

    const query = q
      .parameters<TSlugParams>()
      .star.filterByType('page_post')
      .filterBy('slug.current == $slug')
      .slice(0)
      .project((sub) => ({ title: sub.field('title').notNull() }));

    await expect(
      runQuery(query, {
        parameters: { slug: 'nonexistent' },
        tenant: testTenant,
      }),
    ).rejects.toThrow();
  });
});

describe('runQuery injected locale parameters', () => {
  const localizedQuery = q
    .parameters<TSlugParams & { locale: TLocaleIsoCode }>()
    .star.filterByType('page_landing')
    .filterBy('slug.current == $slug')
    .filterBy('language == $locale')
    .slice(0)
    .project((sub) => ({ slug: sub.field('slug.current').notNull() }))
    .nullable(true);

  it('runs a query that declares locale without the caller passing it', () => {
    function run() {
      return runQuery(localizedQuery, {
        parameters: { slug: 'about' },
        tenant: testTenant,
      });
    }

    expectTypeOf(run).returns.resolves.toEqualTypeOf<{
      slug: string;
    } | null>();
  });

  it('still requires the parameters the tenant does not inject', () => {
    type TConfig =
      typeof localizedQuery extends IGroqBuilder<unknown, infer C> ? C : never;
    type TOptions = Parameters<typeof runQuery<unknown, TConfig>>[1];

    expectTypeOf<TOptions['parameters']>().toEqualTypeOf<{ slug: string }>();
  });
});

describe('runQuery tenant threading', () => {
  it('rejects a call site that omits tenant context at compile time', async () => {
    const query = q.star.filterByType('page_post').slice(0);

    // @ts-expect-error -- `tenant` is required on `runQuery`'s options; there is no form that silently reads the platform's project.
    await runQuery(query, {}).catch(() => {});
  });

  it('passes the tenant context through to getClient', async () => {
    mockFetch.mockResolvedValue(null);

    const query = q.star.filterByType('page_post').slice(0);
    await runQuery(query, { tenant: testTenant }).catch(() => {});

    expect(getClientMock).toHaveBeenCalledWith(testTenant);
  });

  it("sends the tenant's request and default language as query params", async () => {
    mockFetch.mockResolvedValue(null);

    const query = q.star.filterByType('page_post').slice(0);
    await runQuery(query, {
      tenant: { ...testTenant, locale: 'NL', defaultLocale: 'DE' },
    }).catch(() => {});

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      { locale: 'NL', defaultLocale: 'DE' },
      undefined,
    );
  });

  it('defaults the request language to the default language', async () => {
    mockFetch.mockResolvedValue(null);

    const query = q.star.filterByType('page_post').slice(0);
    await runQuery(query, {
      tenant: { ...testTenant, defaultLocale: 'DE' },
    }).catch(() => {});

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      { locale: 'DE', defaultLocale: 'DE' },
      undefined,
    );
  });
});
