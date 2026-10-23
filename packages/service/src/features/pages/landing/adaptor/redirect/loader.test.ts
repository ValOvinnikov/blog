import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES, REDIRECT_STATUS } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockTenant } from '@blog/service/testing/tenant';

import { getRedirect } from './loader';
import { redirectsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const { EN, NL } = LOCALE_ISO_CODES;
const FAQ_DESTINATION = '/modules/faq';
const tenant = mockTenant();

function permanent(destination: string) {
  return { destination, status: REDIRECT_STATUS.PERMANENT };
}

const redirects = [
  { source: '/old-faq', destination: FAQ_DESTINATION, isPrefix: false },
  { source: '/old', destination: '/new', isPrefix: true },
  { source: '/old/deep', destination: '/elsewhere', isPrefix: true },
  { source: '/flat', destination: '/target', isPrefix: null },
  { source: '/legacy', destination: '/', isPrefix: true },
];

describe(getRedirect, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(redirects);
  });

  it.each([
    [
      'resolves an exact source to its destination',
      ['old-faq'],
      permanent(FAQ_DESTINATION),
    ],
    [
      'rebases a path beneath a prefix source onto its destination',
      ['old', 'faq'],
      permanent('/new/faq'),
    ],
    [
      'prefers the longest matching prefix',
      ['old', 'deep', 'page'],
      permanent('/elsewhere/page'),
    ],
    [
      'does not rebase paths beneath a source that is not a prefix',
      ['flat', 'child'],
      undefined,
    ],
    [
      'does not treat a source as a prefix of a sibling sharing its start',
      ['older'],
      undefined,
    ],
    [
      'rebases onto the home page without doubling the slash',
      ['legacy', 'faq'],
      permanent('/faq'),
    ],
    [
      'rebases a nested path onto a prefix destination',
      ['old', 'a', 'b'],
      permanent('/new/a/b'),
    ],
    ['resolves undefined when no redirect matches', ['unknown'], undefined],
  ])('%s', async (_, segments, expected) => {
    await expect(getRedirect(segments, tenant)).resolves.toEqual(expected);
  });

  it('prefers an exact source over a prefix that also matches', async () => {
    mockRun.mockResolvedValueOnce([
      { source: '/old', destination: '/new', isPrefix: true },
      { source: '/old/faq', destination: '/help', isPrefix: false },
    ]);

    await expect(getRedirect(['old', 'faq'], tenant)).resolves.toEqual(
      permanent('/help'),
    );
  });

  it.each([
    ['a decoded slash', ['legacy', '/evil.com']],
    ['an empty segment', ['legacy', '', 'evil.com']],
    ['a decoded backslash', ['legacy', '\\evil.com']],
  ])(
    'refuses a prefix redirect that would leave the site via %s',
    async (_, segments) => {
      await expect(getRedirect(segments, tenant)).resolves.toBe(undefined);
    },
  );

  it('refuses an exact destination that would leave the site', async () => {
    mockRun.mockResolvedValueOnce([
      { source: '/old', destination: '//evil.com', isPrefix: false },
    ]);

    await expect(getRedirect(['old'], tenant)).resolves.toBe(undefined);
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
      { source: '/sale', destination: '/offers', isPrefix: false, status },
    ]);

    await expect(getRedirect(['sale'], tenant)).resolves.toEqual({
      destination: '/offers',
      status: expectedStatus,
    });
  });

  it('carries the status of a matched prefix redirect', async () => {
    mockRun.mockResolvedValueOnce([
      {
        source: '/old',
        destination: '/new',
        isPrefix: true,
        status: REDIRECT_STATUS.TEMPORARY,
      },
    ]);

    await expect(getRedirect(['old', 'faq'], tenant)).resolves.toEqual({
      destination: '/new/faq',
      status: REDIRECT_STATUS.TEMPORARY,
    });
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getRedirect(['old-faq'], tenant);

    expect(mockRun).toHaveBeenCalledWith(redirectsQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: ['t:tenant-a:redirect'],
      },
    });
  });
});

describe('redirectsQuery', () => {
  it("returns the request language's redirects only", async () => {
    const dataset = [
      {
        _id: 'a',
        _type: 'redirect',
        language: EN,
        source: '/old',
        destination: '/new',
        isPrefix: true,
        status: REDIRECT_STATUS.TEMPORARY,
      },
      {
        _id: 'b',
        _type: 'redirect',
        language: NL,
        source: '/oud',
        destination: '/nieuw',
      },
      { _id: 'c', _type: 'page_landing', language: EN },
    ];

    expect(
      await evaluateGroqExpression(redirectsQuery.query, dataset, null, {
        locale: EN,
        defaultLocale: EN,
      }),
    ).toEqual([
      {
        source: '/old',
        destination: '/new',
        isPrefix: true,
        status: REDIRECT_STATUS.TEMPORARY,
      },
    ]);
  });
});
