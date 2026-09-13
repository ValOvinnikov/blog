import { at, patch, set, type createOrReplace } from 'sanity/migrate';

import migration from './index';

type TCreateOrReplaceMutation = ReturnType<typeof createOrReplace>;

const isCreateOrReplace = (
  mutation: unknown,
): mutation is TCreateOrReplaceMutation =>
  Boolean(
    mutation &&
    typeof mutation === 'object' &&
    'type' in mutation &&
    mutation.type === 'createOrReplace',
  );

const getCreateOrReplace = (
  mutations: unknown[],
): TCreateOrReplaceMutation | undefined => mutations.find(isCreateOrReplace);

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

const pageBlogDoc = {
  ...baseDoc,
  _id: 'page_blog',
  _type: 'page_blog',
  title: 'The Blog',
  headingBlock: { _type: 'headingBlock', heading: 'Latest posts' },
  hero: { _type: 'reference', _ref: 'module-hero-1' },
  modules: [
    { _type: 'reference', _key: 'list', _ref: 'module-post-list-1' },
    { _type: 'reference', _key: 'cta', _ref: 'module-cta-1' },
  ],
  seo: { _type: 'seo', metaTitle: 'Read our blog' },
};

describe('copy-page-blog-to-page-post-index migration — page_blog documents', () => {
  it('creates page_postIndex with page_blog’s content fields copied over', async () => {
    const mutations = (await migration.migrate.document(
      pageBlogDoc,
    )) as unknown[];

    expect(getCreateOrReplace(mutations)?.document).toMatchObject({
      _id: 'page_postIndex',
      _type: 'page_postIndex',
      title: 'The Blog',
      headingBlock: { _type: 'headingBlock', heading: 'Latest posts' },
      hero: { _type: 'reference', _ref: 'module-hero-1' },
      modules: pageBlogDoc.modules,
      seo: { _type: 'seo', metaTitle: 'Read our blog' },
    });
  });

  it('maps a draft page_blog onto a draft page_postIndex', async () => {
    const draftDoc = { ...pageBlogDoc, _id: 'drafts.page_blog' };

    const mutations = (await migration.migrate.document(draftDoc)) as unknown[];

    expect(getCreateOrReplace(mutations)?.document._id).toBe(
      'drafts.page_postIndex',
    );
  });

  it('rewrites a page_blog self-reference inside a copied field', async () => {
    const docWithSelfRef = {
      ...pageBlogDoc,
      hero: { _type: 'reference', _ref: 'page_blog' },
    };

    const mutations = (await migration.migrate.document(
      docWithSelfRef,
    )) as unknown[];

    expect(getCreateOrReplace(mutations)?.document).toMatchObject({
      hero: { _type: 'reference', _ref: 'page_postIndex' },
    });
  });

  it('is idempotent — a second run against the same input returns the same mutations', async () => {
    const firstRun = await migration.migrate.document(pageBlogDoc);
    const secondRun = await migration.migrate.document(pageBlogDoc);

    expect(secondRun).toEqual(firstRun);
  });
});

describe('copy-page-blog-to-page-post-index migration — reference rewriting', () => {
  it('rewrites a link.internalReference pointing at page_blog', async () => {
    const ctaDoc = {
      ...baseDoc,
      _id: 'module-cta-1',
      _type: 'module_cta',
      actions: [
        {
          _type: 'link',
          _key: 'primary',
          linkType: 'INTERNAL',
          internalReference: { _type: 'reference', _ref: 'page_blog' },
        },
      ],
    };

    const mutations = (await migration.migrate.document(ctaDoc)) as unknown[];

    expect(mutations).toEqual([
      patch('module-cta-1', [
        at(
          ['actions', { _key: 'primary' }, 'internalReference', '_ref'],
          set('page_postIndex'),
        ),
      ]),
    ]);
  });

  it('rewrites a reference pointing at drafts.page_blog', async () => {
    const heroDoc = {
      ...baseDoc,
      _id: 'module-hero-1',
      _type: 'module_hero',
      featuredPage: { _type: 'reference', _ref: 'drafts.page_blog' },
    };

    const mutations = (await migration.migrate.document(heroDoc)) as unknown[];

    expect(mutations).toEqual([
      patch('module-hero-1', [
        at(['featuredPage', '_ref'], set('drafts.page_postIndex')),
      ]),
    ]);
  });

  it('produces no mutations for a document with no matching references', async () => {
    const otherDoc = {
      ...baseDoc,
      _id: 'author-1',
      _type: 'blog_author',
      name: 'Jane',
    };

    const mutations = await migration.migrate.document(otherDoc);

    expect(mutations).toEqual([]);
  });
});
