import {
  at,
  patch,
  set,
  unset,
  type CreateIfNotExistsMutation,
  type MigrationContext,
} from 'sanity/migrate';

import migration from './index';

const documentHandler = migration.migrate.document;

if (!documentHandler) {
  throw new Error('Expected the migration to define a document() handler.');
}

const createMockContext = (
  titlesByRef: Record<string, string | undefined> = {},
): MigrationContext => {
  const fetch = async (_query: string, params: unknown) => {
    const ref = (params as { ref: string }).ref;

    return { title: titlesByRef[ref] };
  };

  return { client: { fetch } } as unknown as MigrationContext;
};

type TLinkDocument = {
  _id: string;
  _type: string;
  title?: string;
  label?: string;
  linkType?: string;
  openInNewTab?: boolean;
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
  _type: 'module_cta',
};

describe('migrate-cta-actions-to-cta-buttons wiring', () => {
  it('returns nothing for a CTA with no actions at all', async () => {
    const doc = { ...baseDoc, _id: 'cta-1' };

    const mutations = await runMigration(doc, createMockContext());

    expect(mutations).toEqual([]);
  });

  it('returns nothing for a CTA already migrated to ctaButtons', async () => {
    const doc = {
      ...baseDoc,
      _id: 'cta-1',
      ctaButtons: [],
      actions: { actions: [] },
    };

    const mutations = await runMigration(doc, createMockContext());

    expect(mutations).toEqual([]);
  });

  it('migrates a single-button CTA with an external link', async () => {
    const doc = {
      ...baseDoc,
      _id: 'cta-1',
      actions: {
        actions: [
          {
            _key: 'action-1',
            variant: 'PRIMARY',
            appearance: 'CONTAINED',
            link: {
              label: 'Get started',
              linkType: 'EXTERNAL',
              url: 'https://example.com/start',
              openInNewTab: true,
            },
          },
        ],
      },
    };

    const mutations = await runMigration(doc, createMockContext());
    const createMutations = mutations.filter(isCreateIfNotExists);
    const patchMutation = mutations.find(isPatch);

    expect(createMutations).toHaveLength(1);

    const [createMutation] = createMutations;

    if (!createMutation)
      throw new Error('Expected a createIfNotExists mutation.');

    expect(createMutation.document).toMatchObject({
      _type: 'link',
      label: 'Get started',
      linkType: 'EXTERNAL',
      url: 'https://example.com/start',
      openInNewTab: true,
    });

    const linkId = createMutation.document._id;

    expect(patchMutation).toEqual(
      patch('cta-1', [
        at(
          'ctaButtons',
          set([
            {
              _key: 'action-1',
              _type: 'ctaButton',
              variant: 'PRIMARY',
              appearance: 'CONTAINED',
              link: { _type: 'reference', _ref: linkId },
            },
          ]),
        ),
        at('actions', unset()),
      ]),
    );
  });

  it('migrates a two-button CTA preserving original order', async () => {
    const doc = {
      ...baseDoc,
      _id: 'cta-2',
      actions: {
        actions: [
          {
            _key: 'action-1',
            variant: 'PRIMARY',
            appearance: 'CONTAINED',
            link: {
              label: 'Sign up',
              linkType: 'EXTERNAL',
              url: 'https://example.com/signup',
            },
          },
          {
            _key: 'action-2',
            variant: 'SECONDARY',
            appearance: 'INLINE',
            link: {
              label: 'Learn more',
              linkType: 'INTERNAL',
              internalReference: { _ref: 'page-landing-1' },
            },
          },
        ],
      },
    };

    const mutations = await runMigration(
      doc,
      createMockContext({ 'page-landing-1': 'About Us' }),
    );
    const patchMutation = mutations.find(isPatch);

    if (!patchMutation) throw new Error('Expected a patch mutation.');

    const ctaButtonsPatch = patchMutation.patches[0] as {
      op: { type: string; value: { _key: string; link: { _ref: string } }[] };
    };
    const ctaButtons = ctaButtonsPatch.op.value;

    expect(ctaButtons.map((button) => button._key)).toEqual([
      'action-1',
      'action-2',
    ]);

    const [firstButton, secondButton] = ctaButtons;

    if (!firstButton || !secondButton) {
      throw new Error('Expected two ctaButtons entries.');
    }

    expect(firstButton.link._ref).not.toBe(secondButton.link._ref);
  });

  it('resolves an internal-reference link title and reference from the target document', async () => {
    const doc = {
      ...baseDoc,
      _id: 'cta-3',
      actions: {
        actions: [
          {
            _key: 'action-1',
            variant: 'PRIMARY',
            link: {
              label: 'Read the post',
              linkType: 'INTERNAL',
              internalReference: { _ref: 'page-post-42' },
            },
          },
        ],
      },
    };

    const mutations = await runMigration(
      doc,
      createMockContext({ 'page-post-42': 'Understanding GROQ' }),
    );
    const createMutation = mutations.find(isCreateIfNotExists);

    expect(createMutation?.document).toMatchObject({
      _type: 'link',
      title: 'Link to Understanding GROQ',
      linkType: 'INTERNAL',
      internalReference: { _type: 'reference', _ref: 'page-post-42' },
    });
    expect(createMutation?.document).not.toHaveProperty('url');
  });

  it('builds a title from the raw url for an external link', async () => {
    const doc = {
      ...baseDoc,
      _id: 'cta-5',
      actions: {
        actions: [
          {
            _key: 'action-1',
            variant: 'PRIMARY',
            link: {
              label: 'Visit',
              linkType: 'EXTERNAL',
              url: 'https://example.com/pricing',
            },
          },
        ],
      },
    };

    const mutations = await runMigration(doc, createMockContext());
    const createMutation = mutations.find(isCreateIfNotExists);

    expect(createMutation?.document.title).toBe(
      'Link to https://example.com/pricing',
    );
  });

  it('collapses two CTAs sharing one destination onto a single link document', async () => {
    const sharedLink = {
      label: 'Contact sales',
      linkType: 'EXTERNAL' as const,
      url: 'https://example.com/contact',
    };

    const docA = {
      ...baseDoc,
      _id: 'cta-a',
      actions: {
        actions: [{ _key: 'action-1', variant: 'PRIMARY', link: sharedLink }],
      },
    };
    const docB = {
      ...baseDoc,
      _id: 'cta-b',
      actions: {
        actions: [{ _key: 'action-1', variant: 'SECONDARY', link: sharedLink }],
      },
    };

    const [mutationsA, mutationsB] = await Promise.all([
      runMigration(docA, createMockContext()),
      runMigration(docB, createMockContext()),
    ]);

    const linkIdA = mutationsA.filter(isCreateIfNotExists)[0]?.document._id;
    const linkIdB = mutationsB.filter(isCreateIfNotExists)[0]?.document._id;

    expect(linkIdA).toBeDefined();
    expect(linkIdA).toBe(linkIdB);
  });

  it('dedupes a single CTA whose two buttons share one destination into one link document', async () => {
    const sharedLink = {
      label: 'Contact sales',
      linkType: 'EXTERNAL' as const,
      url: 'https://example.com/contact',
    };

    const doc = {
      ...baseDoc,
      _id: 'cta-4',
      actions: {
        actions: [
          { _key: 'action-1', variant: 'PRIMARY', link: sharedLink },
          { _key: 'action-2', variant: 'SECONDARY', link: sharedLink },
        ],
      },
    };

    const mutations = await runMigration(doc, createMockContext());

    expect(mutations.filter(isCreateIfNotExists)).toHaveLength(1);
  });
});
