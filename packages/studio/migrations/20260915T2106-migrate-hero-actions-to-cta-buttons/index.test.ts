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
  context: MigrationContext = createMockContext(),
): Promise<unknown[]> =>
  ((await documentHandler(doc, context)) ?? []) as unknown[];

const baseDoc = {
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
  _rev: 'rev-1',
};

describe('migrate-hero-actions-to-cta-buttons wiring', () => {
  it('returns nothing for an unrelated document type', async () => {
    const doc = { ...baseDoc, _id: 'hero-0', _type: 'module_hero' };

    const mutations = await runMigration(doc);

    expect(mutations).toEqual([]);
  });

  describe('module_heroStatement', () => {
    it('returns nothing when there is no actions field and no ctaButtons', async () => {
      const doc = {
        ...baseDoc,
        _id: 'statement-1',
        _type: 'module_heroStatement',
      };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('returns nothing when already migrated to ctaButtons', async () => {
      const doc = {
        ...baseDoc,
        _id: 'statement-1',
        _type: 'module_heroStatement',
        ctaButtons: [],
        actions: { actions: [] },
      };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('flattens a Primary+Secondary actions group into ctaButtons and unsets actions', async () => {
      const doc = {
        ...baseDoc,
        _id: 'statement-2',
        _type: 'module_heroStatement',
        actions: {
          actions: [
            {
              _key: 'action-1',
              variant: 'PRIMARY',
              appearance: 'CONTAINED',
              link: {
                _type: 'link',
                label: 'Get started',
                linkType: 'EXTERNAL',
                url: 'https://example.com/start',
                openInNewTab: true,
              },
            },
            {
              _key: 'action-2',
              variant: 'SECONDARY',
              appearance: 'INLINE',
              link: {
                _type: 'link',
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
      const createMutations = mutations.filter(isCreateIfNotExists);
      const patchMutation = mutations.find(isPatch);

      expect(createMutations).toHaveLength(2);

      const ctaButtonsPatch = patchMutation?.patches[0] as {
        op: { type: string; value: { _key: string; link: { _ref: string } }[] };
      };
      const ctaButtons = ctaButtonsPatch.op.value;

      expect(ctaButtons.map((button) => button._key)).toEqual([
        'action-1',
        'action-2',
      ]);
      expect(patchMutation?.patches[1]).toEqual(at('actions', unset()));
    });

    it('accepts a link of _type inlineLink, the post-rename shape', async () => {
      const doc = {
        ...baseDoc,
        _id: 'statement-3',
        _type: 'module_heroStatement',
        actions: {
          actions: [
            {
              _key: 'action-1',
              variant: 'PRIMARY',
              link: {
                _type: 'inlineLink',
                label: 'Visit',
                linkType: 'EXTERNAL',
                url: 'https://example.com/pricing',
              },
            },
          ],
        },
      };

      const mutations = await runMigration(doc);
      const createMutation = mutations.find(isCreateIfNotExists);

      expect(createMutation?.document).toMatchObject({
        _type: 'link',
        url: 'https://example.com/pricing',
      });
    });

    it('warns and skips an action whose link has an unrecognized _type', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const doc = {
        ...baseDoc,
        _id: 'statement-4',
        _type: 'module_heroStatement',
        actions: {
          actions: [
            {
              _key: 'action-1',
              variant: 'PRIMARY',
              link: {
                _type: 'someOtherLinkType',
                linkType: 'EXTERNAL',
                url: 'https://example.com',
              },
            },
          ],
        },
      };

      const mutations = await runMigration(doc);

      expect(mutations.filter(isCreateIfNotExists)).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('neither "link" nor "inlineLink"'),
      );

      warnSpy.mockRestore();
    });

    it('dedupes two buttons sharing one destination onto a single link document', async () => {
      const sharedLink = {
        _type: 'link' as const,
        label: 'Contact sales',
        linkType: 'EXTERNAL' as const,
        url: 'https://example.com/contact',
      };

      const doc = {
        ...baseDoc,
        _id: 'statement-5',
        _type: 'module_heroStatement',
        actions: {
          actions: [
            { _key: 'action-1', variant: 'PRIMARY', link: sharedLink },
            { _key: 'action-2', variant: 'SECONDARY', link: sharedLink },
          ],
        },
      };

      const mutations = await runMigration(doc);

      expect(mutations.filter(isCreateIfNotExists)).toHaveLength(1);
    });
  });

  describe('module_heroBlog', () => {
    it('returns nothing when there is no secondaryAction, no actions, and no ctaButtons', async () => {
      const doc = { ...baseDoc, _id: 'blog-1', _type: 'module_heroBlog' };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('returns nothing when already migrated to ctaButtons', async () => {
      const doc = {
        ...baseDoc,
        _id: 'blog-1',
        _type: 'module_heroBlog',
        ctaButtons: [],
      };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('folds a lone secondaryAction into a single-entry ctaButtons and unsets secondaryAction', async () => {
      const doc = {
        ...baseDoc,
        _id: 'blog-2',
        _type: 'module_heroBlog',
        secondaryAction: {
          _key: 'secondary',
          variant: 'SECONDARY',
          appearance: 'CONTAINED',
          link: {
            _type: 'link',
            linkType: 'INTERNAL',
            label: 'Read Latest',
            internalReference: { _ref: 'page_postIndex' },
            openInNewTab: false,
          },
        },
      };

      const mutations = await runMigration(
        doc,
        createMockContext({ page_postIndex: 'Blog' }),
      );
      const createMutations = mutations.filter(isCreateIfNotExists);
      const patchMutation = mutations.find(isPatch);

      expect(createMutations).toHaveLength(1);

      const linkId = createMutations[0]?.document._id;

      expect(patchMutation).toEqual(
        patch('blog-2', [
          at(
            'ctaButtons',
            set([
              {
                _key: 'secondary',
                _type: 'ctaButton',
                variant: 'SECONDARY',
                appearance: 'CONTAINED',
                link: { _type: 'reference', _ref: linkId },
              },
            ]),
          ),
          at('secondaryAction', unset()),
        ]),
      );
    });

    it('prefers secondaryAction over an inherited actions group and warns about the dropped group', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const doc = {
        ...baseDoc,
        _id: 'blog-3',
        _type: 'module_heroBlog',
        secondaryAction: {
          _key: 'secondary',
          variant: 'SECONDARY',
          link: {
            _type: 'link',
            linkType: 'EXTERNAL',
            label: 'From secondaryAction',
            url: 'https://example.com/secondary',
          },
        },
        actions: {
          actions: [
            {
              _key: 'group-primary',
              variant: 'PRIMARY',
              link: {
                _type: 'link',
                linkType: 'EXTERNAL',
                label: 'From actions group',
                url: 'https://example.com/group',
              },
            },
          ],
        },
      };

      const mutations = await runMigration(doc);
      const patchMutation = mutations.find(isPatch);

      const ctaButtonsPatch = patchMutation?.patches[0] as {
        op: { type: string; value: { _key: string }[] };
      };

      expect(ctaButtonsPatch.op.value.map((button) => button._key)).toEqual([
        'secondary',
      ]);
      expect(patchMutation?.patches).toContainEqual(at('actions', unset()));
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('secondaryAction takes precedence'),
      );

      warnSpy.mockRestore();
    });

    it('falls back to the Secondary entry of an actions group when there is no secondaryAction', async () => {
      const doc = {
        ...baseDoc,
        _id: 'blog-4',
        _type: 'module_heroBlog',
        actions: {
          actions: [
            {
              _key: 'group-primary',
              variant: 'PRIMARY',
              link: {
                _type: 'link',
                linkType: 'EXTERNAL',
                url: 'https://example.com/primary',
              },
            },
            {
              _key: 'group-secondary',
              variant: 'SECONDARY',
              link: {
                _type: 'link',
                linkType: 'EXTERNAL',
                url: 'https://example.com/secondary',
              },
            },
          ],
        },
      };

      const mutations = await runMigration(doc);
      const patchMutation = mutations.find(isPatch);

      const ctaButtonsPatch = patchMutation?.patches[0] as {
        op: { type: string; value: { _key: string }[] };
      };

      expect(ctaButtonsPatch.op.value.map((button) => button._key)).toEqual([
        'group-secondary',
      ]);
    });

    it('warns when an actions-group-only fallback has no Secondary entry to fall back to', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const doc = {
        ...baseDoc,
        _id: 'blog-5',
        _type: 'module_heroBlog',
        actions: {
          actions: [
            {
              _key: 'group-primary',
              variant: 'PRIMARY',
              link: {
                _type: 'link',
                linkType: 'EXTERNAL',
                url: 'https://example.com/primary',
              },
            },
          ],
        },
      };

      const mutations = await runMigration(doc);
      const patchMutation = mutations.find(isPatch);

      const ctaButtonsPatch = patchMutation?.patches[0] as {
        op: { type: string; value: { _key: string }[] };
      };

      expect(ctaButtonsPatch.op.value.map((button) => button._key)).toEqual([
        'group-primary',
      ]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('only allows Secondary'),
      );

      warnSpy.mockRestore();
    });
  });
});
