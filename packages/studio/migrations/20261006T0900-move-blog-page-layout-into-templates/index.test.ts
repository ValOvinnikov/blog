import type { MigrationContext } from 'sanity/migrate';

import { migrateBlogPageDocument } from './index';

const hero = { _type: 'reference', _ref: 'hero-blog-1' };
const modules = [{ _key: 'm1', _type: 'module_postList', _ref: 'post-list-1' }];

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

type TPage = Record<string, unknown> & { _id: string; _type: string };

const createContext = (pages: TPage[]): MigrationContext =>
  ({
    client: {
      fetch: async (query: string) => {
        if (query.includes('translation.metadata')) return [];
        if (query.includes('_type in $types')) return pages;
        throw new Error(`Unexpected query in test: ${query}`);
      },
    },
  }) as unknown as MigrationContext;

const run = (doc: TPage, pages: TPage[]) =>
  migrateBlogPageDocument({ ...baseDoc, ...doc }, createContext(pages));

describe('move-blog-page-layout-into-templates migration', () => {
  it.each([
    ['page_postIndex', 'template_postIndex'],
    ['page_topicIndex', 'template_topicIndex'],
    ['page_tagIndex', 'template_tagIndex'],
    ['page_topic', 'template_topic'],
    ['page_tag', 'template_tag'],
  ])(
    'moves a %s hero and modules into a %s of its own',
    async (pageType, templateType) => {
      const page: TPage = {
        _id: 'page-1',
        _type: pageType,
        title: 'Design',
        hero,
        modules,
      };

      await expect(run(page, [page])).resolves.toEqual([
        {
          type: 'createIfNotExists',
          document: {
            _id: 'template-page-1',
            _type: templateType,
            title: 'Design',
            hero,
            modules,
          },
        },
        {
          type: 'patch',
          id: 'page-1',
          patches: [
            {
              path: ['template'],
              op: {
                type: 'set',
                value: { _type: 'reference', _ref: 'template-page-1' },
              },
            },
            { path: ['hero'], op: { type: 'unset' } },
            { path: ['modules'], op: { type: 'unset' } },
          ],
        },
      ]);
    },
  );

  it('gives each Topic page its own template', async () => {
    const design: TPage = { _id: 'design', _type: 'page_topic', modules };
    const travel: TPage = { _id: 'travel', _type: 'page_topic', modules };

    const [designCreate] = await run(design, [design, travel]);
    const [travelCreate] = await run(travel, [design, travel]);

    expect(designCreate).toMatchObject({
      document: { _id: 'template-design' },
    });
    expect(travelCreate).toMatchObject({
      document: { _id: 'template-travel' },
    });
  });
});
