import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawPostDetail } from '@blog/service/testing/pages/fixtures';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getPost } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

vi.mock('@blog/service/sanity/image', () => ({
  urlForImage: vi.fn(
    () => 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
  ),
}));

const tenant = makeTenant();

describe('getPost', () => {
  it('resolves undefined, rather than rejecting, when no page_post matches the slug', async () => {
    mockRun
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('missing-slug', tenant);

    expect(result).toBeUndefined();
  });

  it('maps the raw post into a domain detail object', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          _id: 'post-abc',
          sectionHeader: { heading: 'Test Post', supportingText: null },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('test-post', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.id).toBe('post-abc');
    expect(result.title).toBe('Test Post');
  });

  it('takes slug and publishedAt from the page_post document', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          slug: 'page-post-slug',
          publishedAt: '2026-02-01T00:00:00Z',
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('page-post-slug', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.slug).toBe('page-post-slug');
    expect(result.publishedAt).toBe('2026-02-01T00:00:00Z');
  });

  it('maps the required author onto the post detail', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          author: {
            _id: 'author-9',
            name: 'Jane Doe',
            image: makeRawImage('Jane avatar'),
            profilePage: { slug: 'jane-doe' },
            role: 'Editor',
            bio: null,
            socialLinks: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.author).toEqual({
      id: 'author-9',
      name: 'Jane Doe',
      profilePageSlug: 'jane-doe',
      imageUrl: 'https://cdn.sanity.io/images/proj/dataset/og-800x600.jpg',
      role: 'Editor',
      bio: undefined,
      socialLinks: [],
    });
  });

  it('maps an author with no image to an undefined imageUrl', async () => {
    mockRun
      .mockResolvedValueOnce(
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
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.author.imageUrl).toBeUndefined();
  });

  it('requests a right-sized author avatar instead of the full-resolution asset', async () => {
    const { urlForImage } = await import('@blog/service/sanity/image');
    const authorImage = makeRawImage('Jane avatar');
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          author: {
            _id: 'author-9',
            name: 'Jane Doe',
            image: authorImage,
            profilePage: { slug: 'jane-doe' },
            role: 'Editor',
            bio: null,
            socialLinks: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('hello-world', tenant);

    expect(urlForImage).toHaveBeenCalledWith(authorImage, tenant, {
      width: 64,
      height: 64,
      fit: 'crop',
      quality: 75,
    });
  });

  it('maps a post with no heroImage to undefined image fields', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({ heroImage: null, heroImageAsset: null }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.heroImageUrl).toBeUndefined();
    expect(result.heroImageAlt).toBeUndefined();
    expect(result.heroImageSanity).toBeUndefined();
  });

  it('passes the slug as a query parameter', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('my-slug', tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'my-slug' } }),
    );
  });

  it('lets page_post.seo override the resolved defaults', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          seo: {
            metaTitle: 'Authored Title',
            metaDescription: 'Authored description',
            openGraph: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.seo.title).toBe('Authored Title');
    expect(result.seo.description).toBe('Authored description');
    expect(result.seo.ogTitle).toBe('Authored Title');
  });

  it('falls back to the post title, excerpt, and hero image when unauthored', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          seo: null,
          sectionHeader: {
            heading: 'Fallback Post',
            supportingText: 'Fallback excerpt',
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.seo.title).toBe('Fallback Post');
    expect(result.seo.description).toBe('Fallback excerpt');
    expect(result.seo.ogImageUrl).toContain('sanity.io');
  });

  it('falls back to the site settings default OG image when there is no hero image', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({ seo: null, heroImage: null, heroImageAsset: null }),
      )
      .mockResolvedValueOnce(
        makeRawSiteSettings({
          defaultOgImage: undefined,
        }),
      );

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.seo.ogImageUrl).toBeUndefined();
  });

  it('maps tags from raw input', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          tags: [{ _id: 'tag-1', title: 'TypeScript', slug: 'typescript' }],
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.tags).toEqual([
      { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
    ]);
  });

  it('maps an absent tags field to an empty array', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ tags: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.tags).toEqual([]);
  });

  it('maps the page-builder modules array to module refs', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          modules: [
            { _id: 'related-1', _type: 'module_postRelated' },
            { _id: 'newsletter-1', _type: 'module_newsletter' },
          ],
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.modules).toEqual([
      { id: 'related-1', type: 'module_postRelated' },
      { id: 'newsletter-1', type: 'module_newsletter' },
    ]);
  });

  it('defaults modules to an empty array when the post has none', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ modules: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.modules).toEqual([]);
  });

  it('computes readingTimeMinutes from the server-computed word count', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ wordCount: 401 }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.readingTimeMinutes).toBe(3);
  });

  it('rounds a wordless post up to a 1-minute read', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ wordCount: 0 }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.readingTimeMinutes).toBe(1);
  });

  it('maps a skim with 3+ takeaways onto the post detail', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          skim: {
            takeaways: ['One', 'Two', 'Three'],
            generatedAt: '2026-07-20T00:00:00Z',
            model: 'claude-haiku-4-5',
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.skim).toEqual({
      takeaways: ['One', 'Two', 'Three'],
      generatedAt: '2026-07-20T00:00:00Z',
      model: 'claude-haiku-4-5',
    });
  });

  it('treats an absent skim as undefined', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ skim: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.skim).toBeUndefined();
  });

  it('treats a skim with fewer than 3 takeaways as undefined, mirroring the schema min(3) rule', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          skim: {
            takeaways: ['One', 'Two'],
            generatedAt: null,
            model: null,
          },
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.skim).toBeUndefined();
  });

  it('reports hasAsides true when the body contains an aside block', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({ body: [{ _type: 'aside', _key: 'a1' }] }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.hasAsides).toBe(true);
  });

  it('reports hasAsides false when the body has no aside blocks', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail({ body: [] }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.hasAsides).toBe(false);
  });

  it('resolves a bodyImage block into an image view-model, keeping layout', async () => {
    mockRun
      .mockResolvedValueOnce(
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
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

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
    mockRun
      .mockResolvedValueOnce(
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
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.body).toHaveLength(1);
    expect(result.body[0]).toMatchObject({
      _type: 'bodyImage',
      image: undefined,
    });
  });

  it('renders a post with no supportingText as an undefined excerpt', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawPostDetail({
          sectionHeader: { heading: 'Hello World', supportingText: null },
          body: [],
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getPost('hello-world', tenant);
    if (!result) throw new Error('expected a post detail');

    expect(result.excerpt).toBeUndefined();
    expect(result.hasAsides).toBe(false);
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawPostDetail())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getPost('my-slug', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
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
    expect(mockRun).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({ tags: ['t:tenant-a:site-settings'] }),
      }),
    );
  });
});
