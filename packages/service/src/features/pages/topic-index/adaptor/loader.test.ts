import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTopicIndexPage } from '@blog/service/testing/pages/fixtures';
import {
  makeRawOptionalHeadingBlock,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

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

const tenant = makeTenant();

describe('getIndexPage', () => {
  it('exposes the headingBlock from the page_topicIndex singleton', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicIndexPage({
        headingBlock: makeRawOptionalHeadingBlock({
          heading: 'Browse by topic',
          supportingText: 'Find posts by subject.',
        }),
        seo: makeRawSeo({
          metaTitle: 'Topics — Blog',
          metaDescription: 'Find posts by subject.',
        }),
      }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a topic index page');

    expect(result.headingBlock).toEqual({
      heading: 'Browse by topic',
      supportingText: 'Find posts by subject.',
    });
    expect(result.seo.title).toBe('Topics — Blog');
    expect(result.seo.description).toBe('Find posts by subject.');
  });

  it('falls the headingBlock back to an empty object when unset', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicIndexPage({ headingBlock: null }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a topic index page');

    expect(result.headingBlock).toEqual({
      heading: undefined,
      supportingText: undefined,
    });
  });

  it('maps the thin page-builder modules array to module refs', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicIndexPage({
        modules: [{ _id: 'taxonomy-list-1', _type: 'module_taxonomyList' }],
      }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a topic index page');

    expect(result.modules).toEqual([
      { id: 'taxonomy-list-1', type: 'module_taxonomyList' },
    ]);
  });

  it('defaults modules to an empty array when the page has none', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicIndexPage({ modules: null }));

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a topic index page');

    expect(result.modules).toEqual([]);
  });

  it('leaves hero undefined when page_topicIndex.hero is unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicIndexPage({ hero: null }));

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a topic index page');

    expect(result.hero).toBeUndefined();
  });

  it('maps a set page_topicIndex.hero to a hero slot', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicIndexPage({
        hero: { _id: 'hero-1', _type: 'module_hero' },
      }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a topic index page');

    expect(result.hero).toEqual({ id: 'hero-1', type: 'module_hero' });
  });

  it('rejects when page_topicIndex.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTopicIndexPage({
        hero: { _id: 'cta-1', _type: 'module_cta' as never },
      }),
    );

    await expect(getIndexPage(tenant)).rejects.toThrow();
  });

  it('resolves undefined, rather than rejecting, when no page_topicIndex document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getIndexPage(tenant);

    expect(result).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawTopicIndexPage());

    await getIndexPage(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: [
            't:tenant-a:page_topicIndex',
            't:tenant-a:modules:taxonomyList',
          ],
        }),
      }),
    );
  });
});
