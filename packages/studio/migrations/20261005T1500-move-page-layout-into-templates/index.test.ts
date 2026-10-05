import type { MigrationContext } from 'sanity/migrate';

import { migratePageDocument } from './index';

const hero = { _type: 'reference', _ref: 'hero-1' };
const modules = [{ _key: 'm1', _type: 'module_cta', _ref: 'cta-1' }];

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

type TPage = Record<string, unknown> & { _id: string; _type: string };

const createContext = (
  pages: TPage[],
  groups: { pageIds: string[] }[] = [],
): MigrationContext =>
  ({
    client: {
      fetch: async (query: string) => {
        if (query.includes('translation.metadata')) return groups;
        if (query.includes('_type in $types')) return pages;
        throw new Error(`Unexpected query in test: ${query}`);
      },
    },
  }) as unknown as MigrationContext;

const run = (doc: TPage, context: MigrationContext) =>
  migratePageDocument({ ...baseDoc, ...doc }, context);

const englishAbout: TPage = {
  _id: 'about-en',
  _type: 'page_landing',
  language: 'EN',
  title: 'About',
  hero,
  modules,
};
const dutchAbout: TPage = {
  _id: 'about-nl',
  _type: 'page_landing',
  language: 'NL',
  title: 'Over ons',
  modules: [],
};
const aboutGroup = [{ pageIds: ['about-en', 'about-nl'] }];

const templateCreate = {
  type: 'createIfNotExists',
  document: {
    _id: 'template-about-en',
    _type: 'page_template',
    title: 'About',
    hero,
    modules,
  },
};

const pagePatch = (id: string, withHero: boolean) => ({
  type: 'patch',
  id,
  patches: [
    {
      path: ['template'],
      op: {
        type: 'set',
        value: { _type: 'reference', _ref: 'template-about-en' },
      },
    },
    ...(withHero ? [{ path: ['hero'], op: { type: 'unset' } }] : []),
    { path: ['modules'], op: { type: 'unset' } },
  ],
});

describe('move-page-layout-into-templates migration', () => {
  it("points a translated page at the template built from its default-language page's layout", async () => {
    const context = createContext([englishAbout, dutchAbout], aboutGroup);

    await expect(run(dutchAbout, context)).resolves.toEqual([
      templateCreate,
      pagePatch('about-nl', false),
    ]);
  });

  it('moves the default-language page onto the same template', async () => {
    const context = createContext([englishAbout, dutchAbout], aboutGroup);

    await expect(run(englishAbout, context)).resolves.toEqual([
      templateCreate,
      pagePatch('about-en', true),
    ]);
  });

  it('builds a standalone page a template of its own', async () => {
    const home: TPage = {
      _id: 'page_home',
      _type: 'page_home',
      title: 'Home',
      modules,
    };

    await expect(run(home, createContext([home]))).resolves.toEqual([
      {
        type: 'createIfNotExists',
        document: {
          _id: 'template-page_home',
          _type: 'page_template',
          title: 'Home',
          modules,
        },
      },
      {
        type: 'patch',
        id: 'page_home',
        patches: [
          {
            path: ['template'],
            op: {
              type: 'set',
              value: { _type: 'reference', _ref: 'template-page_home' },
            },
          },
          { path: ['modules'], op: { type: 'unset' } },
        ],
      },
    ]);
  });

  it('leaves an already-migrated page untouched on a second run', async () => {
    const migrated: TPage = {
      _id: 'about-nl',
      _type: 'page_landing',
      language: 'NL',
      title: 'Over ons',
      template: { _type: 'reference', _ref: 'template-about-en' },
    };

    await expect(
      run(migrated, createContext([migrated], aboutGroup)),
    ).resolves.toEqual([]);
  });

  it('keeps a template an editor already chose while clearing the old layout', async () => {
    const chosen: TPage = {
      ...dutchAbout,
      template: { _type: 'reference', _ref: 'template-custom' },
    };

    await expect(
      run(chosen, createContext([englishAbout, chosen], aboutGroup)),
    ).resolves.toEqual([
      {
        type: 'patch',
        id: 'about-nl',
        patches: [{ path: ['modules'], op: { type: 'unset' } }],
      },
    ]);
  });
});
