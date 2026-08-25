import { MissingTaxonomyListError } from '@blog/service/features/pages/tag-index/adaptor/missing-taxonomy-list-error';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTagIndexPage } from '@blog/service/testing/pages/fixtures';

import { getIndexPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

describe('getIndexPage', () => {
  it('exposes the taxonomyList module id from page_tagIndex.taxonomyList', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagIndexPage({ taxonomyList: { _id: 'taxonomy-list-1' } }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();
    if (!result) throw new Error('expected a tag index page');

    expect(result.taxonomyListId).toBe('taxonomy-list-1');
  });

  it('takes heading/supportingText from the page_tagIndex singleton', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagIndexPage({
          heading: 'Browse by tag',
          supportingText: 'Find posts by keyword.',
          seo: {
            metaTitle: 'Tags — Blog',
            metaDescription: 'Find posts by keyword.',
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();
    if (!result) throw new Error('expected a tag index page');

    expect(result.heading).toBe('Browse by tag');
    expect(result.supportingText).toBe('Find posts by keyword.');
    expect(result.seo).toEqual({
      title: 'Tags — Blog',
      description: 'Find posts by keyword.',
      ogTitle: 'Tags — Blog',
      ogDescription: 'Find posts by keyword.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('resolves seo from the heading and site settings when the page has no authored seo', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagIndexPage({ heading: 'Tags', seo: null }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Notes on building things.' }),
      );

    const result = await getIndexPage();
    if (!result) throw new Error('expected a tag index page');

    expect(result.seo).toEqual({
      title: 'Tags',
      description: 'Notes on building things.',
      ogTitle: 'Tags',
      ogDescription: 'Notes on building things.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('tags the page_tagIndex query with modules:taxonomyList alongside page_tagIndex', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagIndexPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getIndexPage();

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['page_tagIndex', 'modules:taxonomyList'],
        }),
      }),
    );
  });

  // Regression guard for the decision that a missing slot is a loud failure,
  // never a substituted default: this must reject rather than resolve with
  // an invented module id.
  it('rejects with MissingTaxonomyListError when page_tagIndex.taxonomyList is unset, without fetching site settings', async () => {
    mockRun.mockResolvedValueOnce(makeRawTagIndexPage({ taxonomyList: null }));

    await expect(getIndexPage()).rejects.toThrow(MissingTaxonomyListError);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('resolves undefined, rather than rejecting, when no page_tagIndex document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getIndexPage();

    expect(result).toBeUndefined();
  });

  it('does not fetch site settings when no page_tagIndex document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getIndexPage();

    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
