import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { MOCK_ABOUT_SLUG } from '@blog/service/testing/shared/translated-pages-dataset';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';
import type { IGroqBuilder } from 'groqd';

import { q, runQuery, type TSlugQueryParams } from './query';

faker.seed(6016);

const MOCK_MISSING_SLUG = faker.lorem.slug();
const SLUG_FILTER = 'slug.current == $slug';
const NO_STORE = 'no-store';

const { mockFetch, getClientMock } = vi.hoisted(() => {
  const mockFetch = vi.fn();
  const getClientMock = vi.fn(() => ({ fetch: mockFetch }));
  return { mockFetch, getClientMock };
});

vi.mock('@blog/service/sanity/client/client', () => ({
  getClient: getClientMock,
}));

const { NL, DE } = LOCALE_ISO_CODES;

describe(runQuery, () => {
  const query = q.star.filterByType('page_post').slice(0);

  beforeEach(() => {
    mockFetch.mockResolvedValue(null);
  });

  it('rejects when a non-null single-document query resolves null', async () => {
    const slugQuery = q
      .parameters<TSlugQueryParams>()
      .star.filterByType('page_post')
      .filterBy(SLUG_FILTER)
      .slice(0)
      .project((sub) => ({ title: sub.field('title').notNull() }));

    await expect(
      runQuery(slugQuery, {
        parameters: { slug: MOCK_MISSING_SLUG },
        tenant: mockTenant(),
      }),
    ).rejects.toThrow();
  });

  it('rejects a call site that omits tenant context at compile time', async () => {
    // @ts-expect-error -- `tenant` is required on `runQuery`'s options; there is no form that silently reads the platform's project.
    await runQuery(query, {}).catch(() => {});
  });

  it('reads through the client of the given tenant', async () => {
    await runQuery(query, { tenant: mockTenant() }).catch(() => {});

    expect(getClientMock).toHaveBeenCalledWith(mockTenant());
  });

  it.each([
    {
      case: 'the request and default language',
      tenant: { locale: NL, defaultLocale: DE },
      expected: { locale: NL, defaultLocale: DE },
    },
    {
      case: 'the default language for a request without one',
      tenant: { defaultLocale: DE },
      expected: { locale: DE, defaultLocale: DE },
    },
  ])('sends $case as query params', async ({ tenant, expected }) => {
    await runQuery(query, { tenant: mockTenant(tenant) }).catch(() => {});

    const [, params, options] = mockFetch.mock.lastCall ?? [];

    expect(params).toEqual(expected);
    expect(options).toBeUndefined();
  });

  it('forwards no-store to the client fetch', async () => {
    await runQuery(query, { cache: NO_STORE, tenant: mockTenant() }).catch(
      () => {},
    );

    const [, , options] = mockFetch.mock.lastCall ?? [];

    expect(options).toEqual({ cache: NO_STORE });
  });

  describe('with a query that declares a locale', () => {
    const localizedQuery = q
      .parameters<TSlugQueryParams & { locale: TLocaleIsoCode }>()
      .star.filterByType('page_landing')
      .filterBy(SLUG_FILTER)
      .filterBy('language == $locale')
      .slice(0)
      .project((sub) => ({ slug: sub.field('slug.current').notNull() }))
      .nullable(true);

    it('runs without the caller passing the locale', () => {
      function run() {
        return runQuery(localizedQuery, {
          parameters: { slug: MOCK_ABOUT_SLUG },
          tenant: mockTenant(),
        });
      }

      expectTypeOf(run).returns.resolves.toEqualTypeOf<{
        slug: string;
      } | null>();
    });

    it('still requires the parameters the tenant does not inject', () => {
      type TConfig =
        typeof localizedQuery extends IGroqBuilder<unknown, infer C>
          ? C
          : never;
      type TOptions = Parameters<typeof runQuery<unknown, TConfig>>[1];

      expectTypeOf<TOptions['parameters']>().toEqualTypeOf<{
        slug: string;
      }>();
    });
  });
});
