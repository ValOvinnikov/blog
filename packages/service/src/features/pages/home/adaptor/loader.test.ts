import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawHomePage } from '@blog/service/testing/pages/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getHomePageDocument } from './loader';

vi.mock('@blog/service/sanity/query/query', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@blog/service/sanity/query/query')
  >()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getHomePageDocument', () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(makeRawHomePage());
  });

  it('maps the thin page_home document to module refs', async () => {
    const page = await getHomePageDocument(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.hero).toEqual({
      id: 'hero-1',
      type: 'module_heroBlog',
    });
    expect(page.modules).toEqual([
      { id: 'post-latest-1', type: 'module_postLatest' },
      { id: 'cta-1', type: 'module_cta' },
    ]);
  });

  it('maps a headingBlock heading with no hero to an undefined hero', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        hero: null,
        headingBlock: makeRawHeadingBlock('Welcome'),
      }),
    );

    const page = await getHomePageDocument(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.hero).toBeUndefined();
    expect(page.headingBlock.heading).toBe('Welcome');
    expect(page.headingBlock.supportingText).toBeUndefined();
  });

  it('maps both a hero and a headingBlock heading when both are authored', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        headingBlock: makeRawHeadingBlock('Welcome', {
          supportingText: 'A subtitle',
        }),
      }),
    );

    const page = await getHomePageDocument(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.hero).toEqual({ id: 'hero-1', type: 'module_heroBlog' });
    expect(page.headingBlock.heading).toBe('Welcome');
    expect(page.headingBlock.supportingText).toBe('A subtitle');
  });

  it('rejects when page_home.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        hero: { _id: 'cta-1', _type: 'module_cta' as never },
      }),
    );

    await expect(getHomePageDocument(tenant)).rejects.toThrow();
  });

  it('resolves seo from the authored value, with no fallback for an unauthored description', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        seo: makeRawSeo({ metaTitle: 'Home', metaDescription: null }),
      }),
    );

    const page = await getHomePageDocument(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.seo.title).toBe('Home');
    expect(page.seo.description).toBeUndefined();
    expect(page.seo.ogTitle).toBeUndefined();
  });

  it('lists the Home translations, counting a Home with no language as the default', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawHomePage({
        translations: [{ language: null }, { language: LOCALE_ISO_CODES.NL }],
      }),
    );

    const page = await getHomePageDocument(tenant);
    if (!page) throw new Error('expected a home page');

    expect(page.translations).toEqual([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
  });

  it('resolves undefined, rather than rejecting, when no page_home document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getHomePageDocument(tenant);

    expect(page).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    await getHomePageDocument(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:homePage', 't:tenant-a:template_home'],
        }),
      }),
    );
  });
});
