import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostDetail } from '@blog/service/testing/pages/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSanityImage,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPost } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getPost', () => {
  it('resolves undefined, rather than rejecting, when no page_post matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getPost('missing-slug', tenant);

    expect(result).toBeUndefined();
  });

  it('maps the raw post into a domain detail object', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        _id: 'post-abc',
        headingBlock: makeRawHeadingBlock('Test Post'),
      }),
    );

    const result = await getPost('test-post', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.id).toBe('post-abc');
    expect(result.title).toBe('Test Post');
  });

  it('takes slug and publishedAt from the page_post document', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        slug: 'page-post-slug',
        publishedAt: '2026-02-01T00:00:00Z',
      }),
    );

    const result = await getPost('page-post-slug', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.slug).toBe('page-post-slug');
    expect(result.publishedAt).toBe('2026-02-01T00:00:00Z');
  });

  it('maps the required author onto the post detail', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        author: {
          _id: 'author-9',
          name: 'Jane Doe',
          image: makeRawSanityImage('Jane avatar'),
          profilePage: { slug: 'jane-doe' },
          role: 'Editor',
          bio: null,
          socialLinks: null,
        },
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.author).toEqual({
      id: 'author-9',
      name: 'Jane Doe',
      profilePageSlug: 'jane-doe',
      image: expect.objectContaining({ assetId: 'image-abc123-800x600-jpg' }),
      role: 'Editor',
      bio: undefined,
      socialLinks: [],
    });
  });

  it('maps an author with no image to an undefined image', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        author: {
          _id: 'author-9',
          name: 'Jane Doe',
          image: null,
          profilePage: null,
          role: null,
          bio: null,
          socialLinks: null,
        },
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.author.image).toBeUndefined();
  });

  it('maps a post with no heroImage to an undefined heroImage', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail({ heroImage: null }));

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.heroImage).toBeUndefined();
  });

  it('passes the slug as a query parameter', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail());

    await getPost('my-slug', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'my-slug' } }),
    );
  });

  it('resolves seo from the authored value, with no fallback for an unauthored openGraph', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        seo: makeRawSeo({
          metaTitle: 'Authored Title',
          metaDescription: 'Authored description',
        }),
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.seo.title).toBe('Authored Title');
    expect(result.seo.description).toBe('Authored description');
    expect(result.seo.ogTitle).toBeUndefined();
  });

  it('leaves seo.ogImage undefined when no ogImage is authored, without falling back to the hero image', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail({ heroImage: null }));

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.seo.ogImage).toBeUndefined();
  });

  it('maps tags from raw input', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.tags).toEqual([
      { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
    ]);
  });

  it('maps an absent tags field to an empty array', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail({ tags: null }));

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.tags).toEqual([]);
  });

  it('maps the page-builder modules array to module refs', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        modules: [
          { _id: 'related-1', _type: 'module_postRelated' },
          { _id: 'newsletter-1', _type: 'module_newsletter' },
        ],
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.modules).toEqual([
      { id: 'related-1', type: 'module_postRelated' },
      { id: 'newsletter-1', type: 'module_newsletter' },
    ]);
  });

  it('defaults modules to an empty array when the post has none', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail({ modules: null }));

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.modules).toEqual([]);
  });

  it('computes readingTimeMinutes from the server-computed word count', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail({ wordCount: 401 }));

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.readingTimeMinutes).toBe(3);
  });

  it('rounds a wordless post up to a 1-minute read', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail({ wordCount: 0 }));

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.readingTimeMinutes).toBe(1);
  });

  it('maps a skim with 3+ takeaways onto the post detail', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        skim: {
          takeaways: ['One', 'Two', 'Three'],
          generatedAt: '2026-07-20T00:00:00Z',
          model: 'claude-haiku-4-5',
        },
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.skim).toEqual({
      takeaways: ['One', 'Two', 'Three'],
      generatedAt: '2026-07-20T00:00:00Z',
      model: 'claude-haiku-4-5',
    });
  });

  it('treats an absent skim as undefined', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail({ skim: null }));

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.skim).toBeUndefined();
  });

  it('treats a skim with fewer than 3 takeaways as undefined, mirroring the schema min(3) rule', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        skim: {
          takeaways: ['One', 'Two'],
          generatedAt: null,
          model: null,
        },
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.skim).toBeUndefined();
  });

  it('reports hasAsides true when the body contains an aside block', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({ body: [{ _type: 'aside', _key: 'a1' }] }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.hasAsides).toBe(true);
  });

  it('reports hasAsides false when the body has no aside blocks', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail({ body: [] }));

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.hasAsides).toBe(false);
  });

  it('resolves a bodyImage block into an image view-model, keeping layout', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        body: [
          {
            _type: 'bodyImage',
            _key: 'image-1',
            asset: {
              _id: 'image-abc123-800x600-jpg',
              metadata: {
                lqip: null,
                dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
              },
            },
            hotspot: null,
            crop: null,
            alt: 'A diagram',
            layout: 'FLOAT_RIGHT',
          },
        ],
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.body[0]).toEqual({
      _type: 'bodyImage',
      _key: 'image-1',
      layout: 'FLOAT_RIGHT',
      image: expect.objectContaining({ assetId: 'image-abc123-800x600-jpg' }),
    });
  });

  it('keeps a bodyImage block whose asset never resolved, with image undefined', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        body: [
          {
            _type: 'bodyImage',
            _key: 'image-1',
            asset: null,
            hotspot: null,
            crop: null,
            alt: 'A diagram',
            layout: null,
          },
        ],
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.body).toHaveLength(1);
    expect(result.body[0]).toMatchObject({
      _type: 'bodyImage',
      image: undefined,
    });
  });

  it('renders a post with no supportingText as an undefined excerpt', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawPostDetail({
        headingBlock: makeRawHeadingBlock('Hello World'),
        body: [],
      }),
    );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.excerpt).toBeUndefined();
    expect(result.hasAsides).toBe(false);
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawPostDetail());

    await getPost('my-slug', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:page_post',
            't:tenant-a:author',
            't:tenant-a:topic',
            't:tenant-a:tag',
          ],
        }),
      }),
    );
  });
});
