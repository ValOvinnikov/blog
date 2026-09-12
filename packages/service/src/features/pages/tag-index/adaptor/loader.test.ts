import { mockRun } from '@blog/service/testing/mock-run-query';
import { makeRawTagIndexPage } from '@blog/service/testing/pages/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getIndexPage } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getIndexPage', () => {
  it('exposes the headingBlock from the page_tagIndex singleton', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTagIndexPage({
        headingBlock: makeRawHeadingBlock('Browse by tag', {
          supportingText: 'Find posts by keyword.',
        }),
        seo: makeRawSeo({
          metaTitle: 'Tags — Blog',
          metaDescription: 'Find posts by keyword.',
        }),
      }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a tag index page');

    expect(result.headingBlock).toEqual({
      heading: 'Browse by tag',
      supportingText: 'Find posts by keyword.',
    });
    expect(result.seo.title).toBe('Tags — Blog');
    expect(result.seo.description).toBe('Find posts by keyword.');
  });

  it('maps the thin page-builder modules array to module refs', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTagIndexPage({
        modules: [{ _id: 'taxonomy-list-1', _type: 'module_taxonomyList' }],
      }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a tag index page');

    expect(result.modules).toEqual([
      { id: 'taxonomy-list-1', type: 'module_taxonomyList' },
    ]);
  });

  it('defaults modules to an empty array when the page has none', async () => {
    mockRun.mockResolvedValueOnce(makeRawTagIndexPage({ modules: null }));

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a tag index page');

    expect(result.modules).toEqual([]);
  });

  it('leaves hero undefined when page_tagIndex.hero is unset', async () => {
    mockRun.mockResolvedValueOnce(makeRawTagIndexPage({ hero: null }));

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a tag index page');

    expect(result.hero).toBeUndefined();
  });

  it('maps a set page_tagIndex.hero to a hero slot', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTagIndexPage({
        hero: { _id: 'hero-1', _type: 'module_hero' },
      }),
    );

    const result = await getIndexPage(tenant);
    if (!result) throw new Error('expected a tag index page');

    expect(result.hero).toEqual({ id: 'hero-1', type: 'module_hero' });
  });

  it('rejects when page_tagIndex.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      makeRawTagIndexPage({
        hero: { _id: 'cta-1', _type: 'module_cta' as never },
      }),
    );

    await expect(getIndexPage(tenant)).rejects.toThrow();
  });

  it('resolves undefined, rather than rejecting, when no page_tagIndex document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getIndexPage(tenant);

    expect(result).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(makeRawTagIndexPage());

    await getIndexPage(tenant);

    expect(mockRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenant,
        next: expect.objectContaining({
          tags: ['t:tenant-a:page_tagIndex', 't:tenant-a:modules:taxonomyList'],
        }),
      }),
    );
  });
});
