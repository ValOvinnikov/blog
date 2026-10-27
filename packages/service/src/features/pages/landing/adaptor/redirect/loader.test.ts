import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES, REDIRECT_STATUS } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import { mockSlug } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getRedirect } from './loader';
import { redirectsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015107);

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = mockTenant();

const MOCK_EXACT_SEGMENT = mockSlug();
const MOCK_EXACT_DESTINATION = `/${mockSlug()}`;
const MOCK_PREFIX_SEGMENT = mockSlug();
const MOCK_PREFIX_DESTINATION = `/${mockSlug()}`;
const MOCK_DEEP_SEGMENT = mockSlug();
const MOCK_DEEP_DESTINATION = `/${mockSlug()}`;
const MOCK_FLAT_SEGMENT = mockSlug();
const MOCK_FLAT_DESTINATION = `/${mockSlug()}`;
const MOCK_HOME_PREFIX_SEGMENT = mockSlug();
const MOCK_UNKNOWN_SEGMENT = mockSlug();
const MOCK_LEAF_SEGMENT = mockSlug();
const MOCK_NESTED_LEAF_SEGMENT = mockSlug();
const MOCK_EXTERNAL_HOST = faker.internet.domainName();

function mockRedirect(
  overrides: Partial<{
    source: string;
    destination: string;
    isPrefix: boolean | null;
    status: string | null;
  }> = {},
) {
  return {
    source: `/${mockSlug()}`,
    destination: `/${mockSlug()}`,
    isPrefix: false,
    ...overrides,
  };
}

function permanent(destination: string) {
  return { destination, status: REDIRECT_STATUS.PERMANENT };
}

const redirects = [
  mockRedirect({
    source: `/${MOCK_EXACT_SEGMENT}`,
    destination: MOCK_EXACT_DESTINATION,
  }),
  mockRedirect({
    source: `/${MOCK_PREFIX_SEGMENT}`,
    destination: MOCK_PREFIX_DESTINATION,
    isPrefix: true,
  }),
  mockRedirect({
    source: `/${MOCK_PREFIX_SEGMENT}/${MOCK_DEEP_SEGMENT}`,
    destination: MOCK_DEEP_DESTINATION,
    isPrefix: true,
  }),
  mockRedirect({
    source: `/${MOCK_FLAT_SEGMENT}`,
    destination: MOCK_FLAT_DESTINATION,
    isPrefix: null,
  }),
  mockRedirect({
    source: `/${MOCK_HOME_PREFIX_SEGMENT}`,
    destination: '/',
    isPrefix: true,
  }),
];

describe(getRedirect, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(redirects);
  });

  it.each([
    [
      'resolves an exact source to its destination',
      [MOCK_EXACT_SEGMENT],
      permanent(MOCK_EXACT_DESTINATION),
    ],
    [
      'rebases a path beneath a prefix source onto its destination',
      [MOCK_PREFIX_SEGMENT, MOCK_LEAF_SEGMENT, MOCK_NESTED_LEAF_SEGMENT],
      permanent(
        `${MOCK_PREFIX_DESTINATION}/${MOCK_LEAF_SEGMENT}/${MOCK_NESTED_LEAF_SEGMENT}`,
      ),
    ],
    [
      'prefers the longest matching prefix',
      [MOCK_PREFIX_SEGMENT, MOCK_DEEP_SEGMENT, MOCK_LEAF_SEGMENT],
      permanent(`${MOCK_DEEP_DESTINATION}/${MOCK_LEAF_SEGMENT}`),
    ],
    [
      'does not rebase paths beneath a source that is not a prefix',
      [MOCK_FLAT_SEGMENT, MOCK_LEAF_SEGMENT],
      undefined,
    ],
    [
      'does not treat a source as a prefix of a sibling sharing its start',
      [`${MOCK_PREFIX_SEGMENT}${MOCK_LEAF_SEGMENT}`],
      undefined,
    ],
    [
      'rebases onto the home page without doubling the slash',
      [MOCK_HOME_PREFIX_SEGMENT, MOCK_LEAF_SEGMENT],
      permanent(`/${MOCK_LEAF_SEGMENT}`),
    ],
    [
      'resolves undefined when no redirect matches',
      [MOCK_UNKNOWN_SEGMENT],
      undefined,
    ],
  ])('%s', async (_, segments, expected) => {
    await expect(getRedirect(segments, tenant)).resolves.toEqual(expected);
  });

  it('prefers an exact source over a prefix that also matches', async () => {
    const exactDestination = `/${mockSlug()}`;
    mockRun.mockResolvedValueOnce([
      mockRedirect({
        source: `/${MOCK_PREFIX_SEGMENT}`,
        isPrefix: true,
      }),
      mockRedirect({
        source: `/${MOCK_PREFIX_SEGMENT}/${MOCK_LEAF_SEGMENT}`,
        destination: exactDestination,
      }),
    ]);

    await expect(
      getRedirect([MOCK_PREFIX_SEGMENT, MOCK_LEAF_SEGMENT], tenant),
    ).resolves.toEqual(permanent(exactDestination));
  });

  it.each([
    ['a decoded slash', [MOCK_HOME_PREFIX_SEGMENT, `/${MOCK_EXTERNAL_HOST}`]],
    ['an empty segment', [MOCK_HOME_PREFIX_SEGMENT, '', MOCK_EXTERNAL_HOST]],
    [
      'a decoded backslash',
      [MOCK_HOME_PREFIX_SEGMENT, `\\${MOCK_EXTERNAL_HOST}`],
    ],
  ])(
    'refuses a prefix redirect that would leave the site via %s',
    async (_, segments) => {
      await expect(getRedirect(segments, tenant)).resolves.toBe(undefined);
    },
  );

  it('refuses an exact destination that would leave the site', async () => {
    mockRun.mockResolvedValueOnce([
      mockRedirect({
        source: `/${MOCK_EXACT_SEGMENT}`,
        destination: `//${MOCK_EXTERNAL_HOST}`,
      }),
    ]);

    await expect(getRedirect([MOCK_EXACT_SEGMENT], tenant)).resolves.toBe(
      undefined,
    );
  });

  it.each([
    [
      'the status of a temporary redirect',
      REDIRECT_STATUS.TEMPORARY,
      REDIRECT_STATUS.TEMPORARY,
    ],
    ['a redirect with no status as permanent', null, REDIRECT_STATUS.PERMANENT],
  ])('reports %s', async (_, status, expectedStatus) => {
    mockRun.mockResolvedValueOnce([
      mockRedirect({
        source: `/${MOCK_EXACT_SEGMENT}`,
        destination: MOCK_EXACT_DESTINATION,
        status,
      }),
    ]);

    await expect(getRedirect([MOCK_EXACT_SEGMENT], tenant)).resolves.toEqual({
      destination: MOCK_EXACT_DESTINATION,
      status: expectedStatus,
    });
  });

  it('carries the status of a matched prefix redirect', async () => {
    mockRun.mockResolvedValueOnce([
      mockRedirect({
        source: `/${MOCK_PREFIX_SEGMENT}`,
        destination: MOCK_PREFIX_DESTINATION,
        isPrefix: true,
        status: REDIRECT_STATUS.TEMPORARY,
      }),
    ]);

    await expect(
      getRedirect([MOCK_PREFIX_SEGMENT, MOCK_LEAF_SEGMENT], tenant),
    ).resolves.toEqual({
      destination: `${MOCK_PREFIX_DESTINATION}/${MOCK_LEAF_SEGMENT}`,
      status: REDIRECT_STATUS.TEMPORARY,
    });
  });

  it('queries the redirects for the tenant and scopes the tags to it', async () => {
    await getRedirect([MOCK_EXACT_SEGMENT], tenant);

    expect(mockRun).toHaveBeenCalledWith(redirectsQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [mockCacheTag('redirect')],
      },
    });
  });
});

describe('redirectsQuery', () => {
  it("returns the request language's redirects only", async () => {
    const redirect = mockRedirect({
      isPrefix: true,
      status: REDIRECT_STATUS.TEMPORARY,
    });
    const dataset = [
      {
        _id: faker.string.uuid(),
        _type: 'redirect',
        language: EN,
        ...redirect,
      },
      {
        _id: faker.string.uuid(),
        _type: 'redirect',
        language: NL,
        source: `/${mockSlug()}`,
        destination: `/${mockSlug()}`,
      },
      { _id: faker.string.uuid(), _type: 'page_landing', language: EN },
    ];

    expect(
      await evaluateGroqExpression(redirectsQuery.query, dataset, null, {
        locale: EN,
        defaultLocale: EN,
      }),
    ).toEqual([redirect]);
  });
});
