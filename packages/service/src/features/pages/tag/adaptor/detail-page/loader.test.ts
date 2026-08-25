import { MissingPostListError } from '@blog/service/features/pages/tag/adaptor/missing-post-list-error';
import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTagPage } from '@blog/service/testing/pages/fixtures';

import { getTagPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

describe('getTagPage', () => {
  it('exposes the postList module id from page_tag.postList', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPage({ postList: { _id: 'post-list-1' } }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript');
    if (!result) throw new Error('expected a tag page');

    expect(result.postListId).toBe('post-list-1');
  });

  it('takes the heading/supporting text from the referenced tag, not page_tag.title', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPage({
          tag: {
            _id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: 'Posts about TypeScript.',
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript');
    if (!result) throw new Error('expected a tag page');

    expect(result.tag).toEqual({
      id: 'tag-1',
      title: 'TypeScript',
      slug: 'typescript',
      description: 'Posts about TypeScript.',
    });
    expect(result.seo.title).toBe('TypeScript');
  });

  it('resolves seo from the tag title and site settings when the page has no authored seo', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPage({
          tag: {
            _id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: null,
          },
          seo: null,
        }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Notes on building things.' }),
      );

    const result = await getTagPage('typescript');
    if (!result) throw new Error('expected a tag page');

    expect(result.seo).toEqual({
      title: 'TypeScript',
      description: 'Notes on building things.',
      ogTitle: 'TypeScript',
      ogDescription: 'Notes on building things.',
      ogImageUrl: expect.stringContaining('sanity.io'),
    });
  });

  it('resolves seo description from the tag description before falling back to site settings', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPage({
          tag: {
            _id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: 'Posts about TypeScript.',
          },
          seo: null,
        }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Site default description' }),
      );

    const result = await getTagPage('typescript');
    if (!result) throw new Error('expected a tag page');

    expect(result.seo.description).toBe('Posts about TypeScript.');
  });

  it('tags the page_tag query with tag and modules:postList alongside page_tag', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getTagPage('typescript');

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        parameters: { slug: 'typescript' },
        next: expect.objectContaining({
          tags: ['page_tag', 'tag', 'modules:postList'],
        }),
      }),
    );
  });

  // Regression guard for the decision that a missing slot is a loud failure,
  // never a substituted default: this must reject rather than resolve with
  // an invented module id.
  it('rejects with MissingPostListError when page_tag.postList is unset, without fetching site settings', async () => {
    mockRun.mockResolvedValueOnce(makeRawTagPage({ postList: null }));

    await expect(getTagPage('typescript')).rejects.toThrow(
      MissingPostListError,
    );
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('resolves undefined, rather than rejecting, when no page_tag matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getTagPage('nonexistent');

    expect(result).toBeUndefined();
  });

  it('does not fetch site settings when no page_tag matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getTagPage('nonexistent');

    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
