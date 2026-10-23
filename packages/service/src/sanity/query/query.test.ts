import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { MOCK_ABOUT_SLUG } from '@blog/service/testing/shared/translated-pages-dataset';
import {
  MOCK_TENANT_DATASET,
  MOCK_TENANT_PROJECT_ID,
} from '@blog/service/testing/tenant';
import type { IGroqBuilder } from 'groqd';

import { q, runQuery, type TSlugQueryParams } from './query';

const SLUG_FILTER = 'slug.current == $slug';
const { mockFetch, getClientMock } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  const getClientMock = vi.fn(() => ({ fetch: mockFetch }));
  return { mockFetch, getClientMock };
});

vi.mock('@blog/service/sanity/client/client', () => ({
  getClient: getClientMock,
}));

const { NL, DE } = LOCALE_ISO_CODES;

const testTenant = {
  projectId: MOCK_TENANT_PROJECT_ID,
  dataset: MOCK_TENANT_DATASET,
  token: 'tok',
};

describe(runQuery, () => {
  it('rejects when the fetch for a single non-null query resolves null', async () => {
    mockFetch.mockResolvedValue(null);

    const query = q
      .parameters<TSlugQueryParams>()
      .star.filterByType('page_post')
      .filterBy(SLUG_FILTER)
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
    .parameters<TSlugQueryParams & { locale: TLocaleIsoCode }>()
    .star.filterByType('page_landing')
    .filterBy(SLUG_FILTER)
    .filterBy('language == $locale')
    .slice(0)
    .project((sub) => ({ slug: sub.field('slug.current').notNull() }))
    .nullable(true);

  it('runs a query that declares locale without the caller passing it', () => {
    function run() {
      return runQuery(localizedQuery, {
        parameters: { slug: MOCK_ABOUT_SLUG },
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
  const query = q.star.filterByType('page_post').slice(0);

  beforeEach(() => {
    mockFetch.mockResolvedValue(null);
  });

  it('rejects a call site that omits tenant context at compile time', async () => {
    // @ts-expect-error -- `tenant` is required on `runQuery`'s options; there is no form that silently reads the platform's project.
    await runQuery(query, {}).catch(() => {});
  });

  it('passes the tenant context through to getClient', async () => {
    await runQuery(query, { tenant: testTenant }).catch(() => {});

    expect(getClientMock).toHaveBeenCalledWith(testTenant);
  });

  it("sends the tenant's request and default language as query params", async () => {
    await runQuery(query, {
      tenant: { ...testTenant, locale: NL, defaultLocale: DE },
    }).catch(() => {});
    const [, params, options] = mockFetch.mock.lastCall ?? [];

    expect(params).toEqual({ locale: NL, defaultLocale: DE });
    expect(options).toBeUndefined();
  });

  it('defaults the request language to the default language', async () => {
    await runQuery(query, {
      tenant: { ...testTenant, defaultLocale: DE },
    }).catch(() => {});
    const [, params, options] = mockFetch.mock.lastCall ?? [];

    expect(params).toEqual({ locale: DE, defaultLocale: DE });
    expect(options).toBeUndefined();
  });
});

describe('runQuery fetch cache options', () => {
  const query = q.star.filterByType('page_post').slice(0);

  beforeEach(() => {
    mockFetch.mockResolvedValue(null);
  });

  it('forwards no-store to the client fetch instead of the tagged cache', async () => {
    await runQuery(query, { cache: 'no-store', tenant: testTenant }).catch(
      () => {},
    );

    const [, , options] = mockFetch.mock.lastCall ?? [];

    expect(options).toEqual({ cache: 'no-store' });
  });
});
