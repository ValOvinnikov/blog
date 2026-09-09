import { makeRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTopicPage } from '@blog/service/testing/pages/fixtures';
import { makeRawOptionalHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

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

const tenant = makeTenant();

describe('getTopicPage', () => {
  it('loads a topic page with no list module in modules[]', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTopicPage({ modules: [] }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTopicPage('engineering', tenant);

    expect(result).toBeDefined();
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

    const result = await getTopicPage('engineering', tenant);
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

    const result = await getTopicPage('engineering', tenant);
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

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.seo.description).toBe('Notes on building things.');
  });

  it('uses the authored headingBlock over the topic fallback', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicPage({
          topic: {
            _id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: 'Notes on building things.',
          },
          headingBlock: makeRawOptionalHeadingBlock({
            heading: 'Engineering, curated',
            supportingText: 'Hand-picked reads.',
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.headingBlock).toEqual({
      heading: 'Engineering, curated',
      supportingText: 'Hand-picked reads.',
    });
  });

  it('falls back to the topic title/description when headingBlock is unset', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicPage({
          topic: {
            _id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: 'Notes on building things.',
          },
          headingBlock: null,
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.headingBlock).toEqual({
      heading: 'Engineering',
      supportingText: 'Notes on building things.',
    });
  });

  it('falls back to the topic description only for an unset supportingText, keeping an authored heading', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicPage({
          topic: {
            _id: 'topic-1',
            title: 'Engineering',
            slug: 'engineering',
            description: 'Notes on building things.',
          },
          headingBlock: makeRawOptionalHeadingBlock({
            heading: 'Engineering, curated',
          }),
        }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.headingBlock).toEqual({
      heading: 'Engineering, curated',
      supportingText: 'Notes on building things.',
    });
  });

  it('leaves hero undefined when page_topic.hero is unset', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTopicPage({ hero: null }))
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.hero).toBeUndefined();
  });

  it('maps a set page_topic.hero to a hero slot', async () => {
    mockRun
      .mockResolvedValueOnce(
        makeRawTopicPage({ hero: { _id: 'hero-1', _type: 'module_hero' } }),
      )
      .mockResolvedValueOnce(makeRawSiteSettings());

    const result = await getTopicPage('engineering', tenant);
    if (!result) throw new Error('expected a topic page');

    expect(result.hero).toEqual({ id: 'hero-1', type: 'module_hero' });
  });

  it('rejects when page_topic.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicPage({
        hero: { _id: 'cta-1', _type: 'module_cta' as never },
      }),
    );

    await expect(getTopicPage('engineering', tenant)).rejects.toThrow();
  });

  it('passes the slug as a query parameter', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTopicPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getTopicPage('engineering', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ parameters: { slug: 'engineering' } }),
    );
  });

  it('resolves undefined, rather than rejecting, when no page_topic matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getTopicPage('nonexistent', tenant);

    expect(result).toBeUndefined();
  });

  it('does not fetch site settings when no page_topic matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getTopicPage('nonexistent', tenant);

    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it('threads tenant context into both queries and scopes their tags to it', async () => {
    mockRun
      .mockResolvedValueOnce(makeRawTopicPage())
      .mockResolvedValueOnce(makeRawSiteSettings());

    await getTopicPage('engineering', tenant);

    expect(mockRun).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:page_topic', 't:tenant-a:topic'],
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
