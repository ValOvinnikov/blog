import { MissingPostListError } from '@blog/service/features/pages/topic/adaptor/missing-post-list-error';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTopicPage } from '@blog/service/testing/pages/fixtures';

import { getTopicPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

describe('getTopicPage', () => {
  it('exposes the postList module id from page_topic.postList', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicPage({ postList: { _id: 'post-list-1' } }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTopicPage('engineering');
    if (!result) throw new Error('expected a topic page');

    expect(result.postListId).toBe('post-list-1');
  });

  it('takes the heading/supporting text from the referenced topic, not page_topic.title', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicPage({
          topic: {
            _id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: 'Notes on building things.',
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTopicPage('engineering');
    if (!result) throw new Error('expected a topic page');

    expect(result.topic).toEqual({
      id: 'topic-1',
      title: 'Engineering',
      slug: 'engineering',
      description: 'Notes on building things.',
    });
    expect(result.seo.title).toBe('Engineering');
  });

  it('resolves seo from the topic title and site settings when the page has no authored seo', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicPage({
          topic: {
            _id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: null,
          },
          seo: null,
        }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Notes on building things.' }),
      );

    const result = await getTopicPage('engineering');
    if (!result) throw new Error('expected a topic page');

    expect(result.seo).toEqual({
      title: 'Engineering',
      description: 'Notes on building things.',
      ogTitle: 'Engineering',
      ogDescription: 'Notes on building things.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('resolves seo description from the topic description before falling back to site settings', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicPage({
          topic: {
            _id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: 'Notes on building things.',
          },
          seo: null,
        }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Site default description' }),
      );

    const result = await getTopicPage('engineering');
    if (!result) throw new Error('expected a topic page');

    expect(result.seo.description).toBe('Notes on building things.');
  });

  it('tags the page_topic query with topic and modules:postList alongside page_topic', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTopicPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getTopicPage('engineering');

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        parameters: { slug: 'engineering' },
        next: expect.objectContaining({
          tags: ['page_topic', 'topic', 'modules:postList'],
        }),
      }),
    );
  });

  // Regression guard for the decision that a missing slot is a loud failure,
  // never a substituted default: this must reject rather than resolve with
  // an invented module id.
  it('rejects with MissingPostListError when page_topic.postList is unset, without fetching site settings', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicPage({ postList: null }));

    await expect(getTopicPage('engineering')).rejects.toThrow(
      MissingPostListError,
    );
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('resolves undefined, rather than rejecting, when no page_topic matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getTopicPage('nonexistent');

    expect(result).toBeUndefined();
  });

  it('does not fetch site settings when no page_topic matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getTopicPage('nonexistent');

    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
