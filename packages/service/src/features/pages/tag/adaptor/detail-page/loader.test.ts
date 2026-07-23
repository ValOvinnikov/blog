import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawPostCard,
  makeRawTagPageTag,
} from '@blog/service/testing/pages/fixtures';

import { getTagPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getTagPage', () => {
  it('returns null when the tag is not found', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('missing');

    expect(result).toBeNull();
  });

  it('maps the tag and its posts into a page object', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPageTag({ _id: 'tag-abc', title: 'React' }),
      )
      .mockResolvedValueOnce([
        makeRawPostCard(),
        makeRawPostCard({ _id: 'post-2' }),
      ])
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('react');

    expect(result).not.toBeNull();
    expect(result?.tag.id).toBe('tag-abc');
    expect(result?.tag.title).toBe('React');
    expect(result?.posts).toHaveLength(2);
  });

  it('returns an empty posts list when no posts belong to the tag', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagPageTag())
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript');

    expect(result?.posts).toEqual([]);
  });

  it('leaves pagination fields undefined when called without a page', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagPageTag())
      .mockResolvedValueOnce([makeRawPostCard()])
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript');

    expect(result?.currentPage).toBeUndefined();
    expect(result?.totalPages).toBeUndefined();
    expect(result?.total).toBeUndefined();
  });

  it('returns the sliced page window with pagination metadata when a page is given', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagPageTag())
      .mockResolvedValueOnce({
        posts: [makeRawPostCard({ _id: 'a' }), makeRawPostCard({ _id: 'b' })],
        total: 20,
      })
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript', {
      page: 2,
      itemsPerPage: 5,
    });

    expect(result?.posts.map((p) => p.id)).toEqual(['a', 'b']);
    expect(result?.currentPage).toBe(2);
    expect(result?.total).toBe(20);
    expect(result?.totalPages).toBe(4);
  });

  it('returns null for a paginated request when the tag is not found', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ posts: [], total: 0 })
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('missing', {
      page: 2,
      itemsPerPage: 9,
    });

    expect(result).toBeNull();
  });

  it('maps the authored description and resolves seo from it', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPageTag({
          title: 'TypeScript',
          description: 'Posts about TypeScript.',
          seo: {
            metaTitle: 'Authored Title',
            metaDescription: 'Authored description',
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript');

    expect(result?.tag.description).toBe('Posts about TypeScript.');
    expect(result?.tag.seo.title).toBe('Authored Title');
    expect(result?.tag.seo.description).toBe('Authored description');
  });

  it('falls back to the tag title and site description when description/seo are both absent, without failing', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPageTag({
          title: 'Rust',
          description: null,
          seo: null,
        }),
      )
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(
        makeRawSiteSettings({ description: 'Site default description' }),
      );

    const result = await getTagPage('rust');

    expect(result).not.toBeNull();
    expect(result?.tag.description).toBeUndefined();
    expect(result?.tag.seo.title).toBe('Rust');
    expect(result?.tag.seo.description).toBe('Site default description');
  });
});
