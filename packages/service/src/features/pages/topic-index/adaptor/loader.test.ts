import { MissingTaxonomyListError } from '@blog/service/features/pages/topic-index/adaptor/missing-taxonomy-list-error';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTopicIndexPage } from '@blog/service/testing/pages/fixtures';

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
  it('exposes the taxonomyList module id from page_topicIndex.taxonomyList', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicIndexPage({ taxonomyList: { _id: 'taxonomy-list-1' } }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();
    if (!result) throw new Error('expected a topic index page');

    expect(result.taxonomyListId).toBe('taxonomy-list-1');
  });

  it('takes heading/supportingText from the page_topicIndex singleton', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicIndexPage({
          heading: 'Browse by topic',
          supportingText: 'Find posts by subject.',
          seo: {
            metaTitle: 'Topics — Blog',
            metaDescription: 'Find posts by subject.',
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();
    if (!result) throw new Error('expected a topic index page');

    expect(result.heading).toBe('Browse by topic');
    expect(result.supportingText).toBe('Find posts by subject.');
    expect(result.seo).toEqual({
      title: 'Topics — Blog',
      description: 'Find posts by subject.',
      ogTitle: 'Topics — Blog',
      ogDescription: 'Find posts by subject.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('resolves seo from the heading and site settings when the page has no authored seo', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicIndexPage({ heading: 'Topics', seo: null }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Notes on building things.' }),
      );

    const result = await getIndexPage();
    if (!result) throw new Error('expected a topic index page');

    expect(result.seo).toEqual({
      title: 'Topics',
      description: 'Notes on building things.',
      ogTitle: 'Topics',
      ogDescription: 'Notes on building things.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('tags the page_topicIndex query with modules:taxonomyList alongside page_topicIndex', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTopicIndexPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getIndexPage();

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        next: expect.objectContaining({
          tags: ['page_topicIndex', 'modules:taxonomyList'],
        }),
      }),
    );
  });

  // Regression guard for the decision that a missing slot is a loud failure,
  // never a substituted default: this must reject rather than resolve with
  // an invented module id.
  it('rejects with MissingTaxonomyListError when page_topicIndex.taxonomyList is unset', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTopicIndexPage({ taxonomyList: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    await expect(getIndexPage()).rejects.toThrow(MissingTaxonomyListError);
    expect(mockRun).toHaveBeenCalledTimes(2);
  });

  it('resolves undefined, rather than rejecting, when no page_topicIndex document exists', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getIndexPage();

    expect(result).toBeUndefined();
  });
});
