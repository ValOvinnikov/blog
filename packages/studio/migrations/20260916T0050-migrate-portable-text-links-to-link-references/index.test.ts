import {
  at,
  patch,
  set,
  type CreateIfNotExistsMutation,
  type MigrationContext,
} from 'sanity/migrate';

import migration from './index';

const documentHandler = migration.migrate.document;

if (!documentHandler) {
  throw new Error('Expected the migration to define a document() handler.');
}

const createMockContext = (
  postsBySlug: Record<string, { _id: string; title?: string } | undefined> = {},
): MigrationContext => {
  const fetch = async (query: string, params: unknown) => {
    if (query.includes('slug.current')) {
      const slug = (params as { slug: string }).slug;
      const post = postsBySlug[slug];

      return post ? [post] : [];
    }

    return { title: undefined };
  };

  return { client: { fetch } } as unknown as MigrationContext;
};

type TLinkDocument = {
  _id: string;
  _type: string;
  title?: string;
  label?: string;
  linkType?: string;
  internalReference?: { _ref: string };
  url?: string;
};

const isCreateIfNotExists = (
  mutation: unknown,
): mutation is CreateIfNotExistsMutation<TLinkDocument> =>
  typeof mutation === 'object' &&
  mutation !== null &&
  (mutation as { type?: string }).type === 'createIfNotExists';

const isPatch = (mutation: unknown): mutation is ReturnType<typeof patch> =>
  typeof mutation === 'object' &&
  mutation !== null &&
  (mutation as { type?: string }).type === 'patch';

type TTestDocument = {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  [key: string]: unknown;
};

const runMigration = async (
  doc: TTestDocument,
  context: MigrationContext,
): Promise<unknown[]> =>
  ((await documentHandler(doc, context)) ?? []) as unknown[];

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
  _type: 'page_post',
};

describe('migrate-portable-text-links-to-link-references wiring', () => {
  it('returns nothing for a document with no Portable Text field at all', async () => {
    const doc = { ...baseDoc, _id: 'post-1' };

    expect(await runMigration(doc, createMockContext())).toEqual([]);
  });

  it('returns nothing for a document whose blocks carry no markDefs', async () => {
    const doc = {
      ...baseDoc,
      _id: 'post-1',
      content: [
        { _key: 'block-1', _type: 'block', markDefs: [], children: [] },
      ],
    };

    expect(await runMigration(doc, createMockContext())).toEqual([]);
  });

  it('is a no-op on a document already migrated to linkRef', async () => {
    const doc = {
      ...baseDoc,
      _id: 'post-1',
      content: [
        {
          _key: 'block-1',
          _type: 'block',
          markDefs: [
            {
              _key: 'mark-1',
              _type: 'linkRef',
              link: { _type: 'reference', _ref: 'link-1' },
            },
          ],
          children: [
            { _key: 'span-1', _type: 'span', text: 'a', marks: ['mark-1'] },
          ],
        },
      ],
    };

    expect(await runMigration(doc, createMockContext())).toEqual([]);
  });

  it('converts a resolvable /blog/<slug> href to a linkRef, seeding a link document', async () => {
    const doc = {
      ...baseDoc,
      _id: 'post-1',
      content: [
        {
          _key: 'block-1',
          _type: 'block',
          markDefs: [
            { _key: 'mark-1', _type: 'link', href: '/blog/understanding-groq' },
          ],
          children: [
            {
              _key: 'span-1',
              _type: 'span',
              text: 'read this',
              marks: ['mark-1'],
            },
          ],
        },
      ],
    };

    const mutations = await runMigration(
      doc,
      createMockContext({
        'understanding-groq': {
          _id: 'page-post-1',
          title: 'Understanding GROQ',
        },
      }),
    );

    const createMutations = mutations.filter(isCreateIfNotExists);
    const patchMutation = mutations.find(isPatch);

    expect(createMutations).toHaveLength(1);
    expect(createMutations[0]?.document).toMatchObject({
      _type: 'link',
      title: 'Link to Understanding GROQ',
      label: 'Understanding GROQ',
      linkType: 'INTERNAL',
      internalReference: { _type: 'reference', _ref: 'page-post-1' },
    });

    const linkId = createMutations[0]?.document._id;

    if (!patchMutation) throw new Error('Expected a patch mutation.');

    expect(patchMutation).toEqual(
      patch('post-1', [
        at(
          ['content', { _key: 'block-1' }, 'markDefs'],
          set([
            {
              _key: 'mark-1',
              _type: 'linkRef',
              link: { _type: 'reference', _ref: linkId },
            },
          ]),
        ),
        at(
          ['content', { _key: 'block-1' }, 'children'],
          set([
            {
              _key: 'span-1',
              _type: 'span',
              text: 'read this',
              marks: ['mark-1'],
            },
          ]),
        ),
      ]),
    );
  });

  it('strips a href resolving to no page_post, leaving the span text plain', async () => {
    const doc = {
      ...baseDoc,
      _id: 'post-1',
      content: [
        {
          _key: 'block-1',
          _type: 'block',
          markDefs: [
            {
              _key: 'mark-1',
              _type: 'link',
              href: '/blog/nothing-merges-on-vibes',
            },
          ],
          children: [
            { _key: 'span-1', _type: 'span', text: 'gone', marks: ['mark-1'] },
          ],
        },
      ],
    };

    const mutations = await runMigration(doc, createMockContext());

    expect(mutations.filter(isCreateIfNotExists)).toHaveLength(0);

    const patchMutation = mutations.find(isPatch);

    if (!patchMutation) throw new Error('Expected a patch mutation.');

    expect(patchMutation).toEqual(
      patch('post-1', [
        at(['content', { _key: 'block-1' }, 'markDefs'], set([])),
        at(
          ['content', { _key: 'block-1' }, 'children'],
          set([{ _key: 'span-1', _type: 'span', text: 'gone', marks: [] }]),
        ),
      ]),
    );
  });

  it('converts an external https:// href to a linkRef', async () => {
    const doc = {
      ...baseDoc,
      _id: 'post-1',
      content: [
        {
          _key: 'block-1',
          _type: 'block',
          markDefs: [
            {
              _key: 'mark-1',
              _type: 'link',
              href: 'https://github.com/FormidableLabs/groqd',
            },
          ],
          children: [
            { _key: 'span-1', _type: 'span', text: 'groqd', marks: ['mark-1'] },
          ],
        },
      ],
    };

    const mutations = await runMigration(doc, createMockContext());
    const createMutation = mutations.find(isCreateIfNotExists);

    expect(createMutation?.document).toMatchObject({
      _type: 'link',
      title: 'Link to https://github.com/FormidableLabs/groqd',
      label: 'github.com/FormidableLabs/groqd',
      linkType: 'EXTERNAL',
      url: 'https://github.com/FormidableLabs/groqd',
    });
  });

  it('dedupes two blocks in one document sharing one destination onto one link document', async () => {
    const doc = {
      ...baseDoc,
      _id: 'post-1',
      content: [
        {
          _key: 'block-1',
          _type: 'block',
          markDefs: [
            { _key: 'mark-1', _type: 'link', href: '/blog/understanding-groq' },
          ],
          children: [
            { _key: 'span-1', _type: 'span', text: 'a', marks: ['mark-1'] },
          ],
        },
        {
          _key: 'block-2',
          _type: 'block',
          markDefs: [
            { _key: 'mark-2', _type: 'link', href: '/blog/understanding-groq' },
          ],
          children: [
            { _key: 'span-2', _type: 'span', text: 'b', marks: ['mark-2'] },
          ],
        },
      ],
    };

    const mutations = await runMigration(
      doc,
      createMockContext({
        'understanding-groq': {
          _id: 'page-post-1',
          title: 'Understanding GROQ',
        },
      }),
    );

    expect(mutations.filter(isCreateIfNotExists)).toHaveLength(1);
  });

  it('converts a legacy structured inlineLink markDef too', async () => {
    const doc = {
      ...baseDoc,
      _type: 'module_cta',
      _id: 'cta-1',
      content: [
        {
          _key: 'block-1',
          _type: 'block',
          markDefs: [
            {
              _key: 'mark-1',
              _type: 'inlineLink',
              label: 'Get started',
              linkType: 'EXTERNAL',
              url: 'https://example.com/start',
            },
          ],
          children: [
            { _key: 'span-1', _type: 'span', text: 'go', marks: ['mark-1'] },
          ],
        },
      ],
    };

    const mutations = await runMigration(doc, createMockContext());
    const createMutation = mutations.find(isCreateIfNotExists);

    expect(createMutation?.document).toMatchObject({
      _type: 'link',
      label: 'Get started',
      linkType: 'EXTERNAL',
      url: 'https://example.com/start',
    });
  });

  it('resolves a block nested inside an aside object', async () => {
    const doc = {
      ...baseDoc,
      _id: 'post-1',
      content: [
        {
          _key: 'aside-1',
          _type: 'aside',
          kind: 'tip',
          body: [
            {
              _key: 'block-1',
              _type: 'block',
              markDefs: [
                { _key: 'mark-1', _type: 'link', href: 'https://example.com' },
              ],
              children: [
                { _key: 'span-1', _type: 'span', text: 'a', marks: ['mark-1'] },
              ],
            },
          ],
        },
      ],
    };

    const mutations = await runMigration(doc, createMockContext());
    const patchMutation = mutations.find(isPatch);

    if (!patchMutation) throw new Error('Expected a patch mutation.');

    const paths = patchMutation.patches.map(
      (nodePatch: { path: unknown }) => nodePatch.path,
    );

    expect(paths).toEqual([
      ['content', { _key: 'aside-1' }, 'body', { _key: 'block-1' }, 'markDefs'],
      ['content', { _key: 'aside-1' }, 'body', { _key: 'block-1' }, 'children'],
    ]);
  });
});
