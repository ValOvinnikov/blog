import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTagPage } from '@blog/service/testing/pages/fixtures';
import { makeRawOptionalHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

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

const tenant = makeTenant();

describe('getTagPage', () => {
  it('loads a tag page with no list module in modules[]', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagPage({ modules: [] }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript', tenant);

    expect(result).toBeDefined();
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

    const result = await getTagPage('typescript', tenant);
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

    const result = await getTagPage('typescript', tenant);
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

    const result = await getTagPage('typescript', tenant);
    if (!result) throw new Error('expected a tag page');

    expect(result.seo.description).toBe('Posts about TypeScript.');
  });

  it('uses the authored headingBlock over the tag fallback', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPage({
          tag: {
            _id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: 'Posts about TypeScript.',
          },
          headingBlock: makeRawOptionalHeadingBlock({
            heading: 'TypeScript, curated',
            supportingText: 'Hand-picked reads.',
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript', tenant);
    if (!result) throw new Error('expected a tag page');

    expect(result.headingBlock).toEqual({
      heading: 'TypeScript, curated',
      supportingText: 'Hand-picked reads.',
    });
  });

  it('falls back to the tag title/description when headingBlock is unset', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPage({
          tag: {
            _id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: 'Posts about TypeScript.',
          },
          headingBlock: null,
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript', tenant);
    if (!result) throw new Error('expected a tag page');

    expect(result.headingBlock).toEqual({
      heading: 'TypeScript',
      supportingText: 'Posts about TypeScript.',
    });
  });

  it('falls back to the tag description only for an unset supportingText, keeping an authored heading', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPage({
          tag: {
            _id: 'tag-1',
            title: 'TypeScript',
            slug: 'typescript',
            description: 'Posts about TypeScript.',
          },
          headingBlock: makeRawOptionalHeadingBlock({
            heading: 'TypeScript, curated',
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript', tenant);
    if (!result) throw new Error('expected a tag page');

    expect(result.headingBlock).toEqual({
      heading: 'TypeScript, curated',
      supportingText: 'Posts about TypeScript.',
    });
  });

  it('leaves hero undefined when page_tag.hero is unset', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagPage({ hero: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript', tenant);
    if (!result) throw new Error('expected a tag page');

    expect(result.hero).toBeUndefined();
  });

  it('maps a set page_tag.hero to a hero slot', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTagPage({ hero: { _id: 'hero-1', _type: 'module_hero' } }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTagPage('typescript', tenant);
    if (!result) throw new Error('expected a tag page');

    expect(result.hero).toEqual({ id: 'hero-1', type: 'module_hero' });
  });

  it('rejects when page_tag.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTagPage({ hero: { _id: 'cta-1', _type: 'module_cta' as never } }),
    );

    await expect(getTagPage('typescript', tenant)).rejects.toThrow();
  });

  it('passes the slug as a query parameter', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getTagPage('typescript', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'typescript' } }),
    );
  });

  it('resolves undefined, rather than rejecting, when no page_tag matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getTagPage('nonexistent', tenant);

    expect(result).toBeUndefined();
  });

  it('does not fetch site settings when no page_tag matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getTagPage('nonexistent', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTagPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getTagPage('typescript', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:page_tag', 't:tenant-a:tag'],
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
