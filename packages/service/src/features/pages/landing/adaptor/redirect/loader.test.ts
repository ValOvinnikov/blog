import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { makeTenant } from '@blog/service/testing/tenant';

import { getRedirect } from './loader';
import { redirectsQuery } from './query';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const { EN, NL } = LOCALE_ISO_CODES;
const tenant = makeTenant();

const redirects = [
  { source: '/old-faq', destination: '/modules/faq', isPrefix: false },
  { source: '/old', destination: '/new', isPrefix: true },
  { source: '/old/deep', destination: '/elsewhere', isPrefix: true },
  { source: '/flat', destination: '/target', isPrefix: null },
  { source: '/legacy', destination: '/', isPrefix: true },
];

describe('getRedirect', () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(redirects);
  });

  it('resolves an exact source to its destination', async () => {
    await expect(getRedirect(['old-faq'], tenant)).resolves.toBe(
      '/modules/faq',
    );
  });

  it('rebases a path beneath a prefix source onto its destination', async () => {
    await expect(getRedirect(['old', 'faq'], tenant)).resolves.toBe('/new/faq');
  });

  it('prefers the longest matching prefix', async () => {
    await expect(getRedirect(['old', 'deep', 'page'], tenant)).resolves.toBe(
      '/elsewhere/page',
    );
  });

  it('prefers an exact source over a prefix that also matches', async () => {
    mockRun.mockResolvedValue([
      { source: '/old', destination: '/new', isPrefix: true },
      { source: '/old/faq', destination: '/help', isPrefix: false },
    ]);

    await expect(getRedirect(['old', 'faq'], tenant)).resolves.toBe('/help');
  });

  it('does not rebase paths beneath a source that is not a prefix', async () => {
    await expect(getRedirect(['flat', 'child'], tenant)).resolves.toBe(
      undefined,
    );
  });

  it('does not treat a source as a prefix of a sibling sharing its start', async () => {
    await expect(getRedirect(['older'], tenant)).resolves.toBe(undefined);
  });

  it('rebases onto the home page without doubling the slash', async () => {
    await expect(getRedirect(['legacy', 'faq'], tenant)).resolves.toBe('/faq');
  });

  it('rebases a nested path onto a prefix destination', async () => {
    await expect(getRedirect(['old', 'a', 'b'], tenant)).resolves.toBe(
      '/new/a/b',
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
    mockRun.mockResolvedValue([
      { source: '/old', destination: '//evil.com', isPrefix: false },
    ]);

    await expect(getRedirect(['old'], tenant)).resolves.toBe(undefined);
  });

  it('resolves undefined when no redirect matches', async () => {
    await expect(getRedirect(['unknown'], tenant)).resolves.toBe(undefined);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getRedirect(['old-faq'], tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:redirect'] }),
      }),
    );
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
    ).toEqual([{ source: '/old', destination: '/new', isPrefix: true }]);
  });
});
