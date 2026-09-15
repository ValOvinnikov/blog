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

describe('migrate-nav-footer-to-link-library wiring', () => {
  it('returns nothing for an unrelated document type', async () => {
    const doc = { ...baseDoc, _id: 'other-1', _type: 'module_cta' };

    expect(await runMigration(doc)).toEqual([]);
  });

  describe('settings_navigation', () => {
    it('returns nothing when there is no items field', async () => {
      const doc = { ...baseDoc, _id: 'nav-1', _type: 'settings_navigation' };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('returns nothing when items is empty', async () => {
      const doc = {
        ...baseDoc,
        _id: 'nav-1',
        _type: 'settings_navigation',
        items: [],
      };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('returns nothing when every item is already a linkRef', async () => {
      const doc = {
        ...baseDoc,
        _id: 'nav-1',
        _type: 'settings_navigation',
        items: [
          {
            _key: 'nav-1',
            _type: 'linkRef',
            link: { _type: 'reference', _ref: 'link-existing' },
          },
        ],
      };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('migrates the live Blog entry to a linkRef and creates its link document', async () => {
      const doc = {
        ...baseDoc,
        _id: 'settings-navigation-singleton',
        _type: 'settings_navigation',
        items: [
          {
            _key: '8da0244eb0cc',
            _type: 'link',
            label: 'Blog',
            linkType: 'INTERNAL',
            internalReference: { _ref: 'page_postIndex' },
            openInNewTab: false,
          },
        ],
      };

      const mutations = await runMigration(
        doc,
        createMockContext({ page_postIndex: 'Blog' }),
      );

      const createMutation = mutations.find(isCreateIfNotExists);
      const patchMutation = mutations.find(isPatch);

      expect(createMutation?.document).toEqual({
        _id: expect.stringMatching(/^link-[a-f0-9]{16}$/) as string,
        _type: 'link',
        title: 'Link to Blog',
        label: 'Blog',
        linkType: 'INTERNAL',
        openInNewTab: false,
        internalReference: { _type: 'reference', _ref: 'page_postIndex' },
      });

      const linkId = createMutation?.document._id;

      expect(patchMutation).toEqual(
        patch('settings-navigation-singleton', [
          at(
            'items',
            set([
              {
                _key: '8da0244eb0cc',
                _type: 'linkRef',
                link: { _type: 'reference', _ref: linkId },
              },
            ]),
          ),
        ]),
      );
    });

    it('accepts a pre-rename "link" and a post-rename "inlineLink" item side by side', async () => {
      const doc = {
        ...baseDoc,
        _id: 'nav-2',
        _type: 'settings_navigation',
        items: [
          {
            _key: 'item-1',
            _type: 'link',
            label: 'Blog',
            linkType: 'EXTERNAL',
            url: 'https://example.com/blog',
          },
          {
            _key: 'item-2',
            _type: 'inlineLink',
            label: 'Pricing',
            linkType: 'EXTERNAL',
            url: 'https://example.com/pricing',
          },
        ],
      };

      const mutations = await runMigration(doc);

      expect(mutations.filter(isCreateIfNotExists)).toHaveLength(2);
    });

    it('passes an already-migrated item through unchanged alongside a legacy one', async () => {
      const doc = {
        ...baseDoc,
        _id: 'nav-3',
        _type: 'settings_navigation',
        items: [
          {
            _key: 'existing',
            _type: 'linkRef',
            link: { _type: 'reference', _ref: 'link-existing' },
          },
          {
            _key: 'legacy',
            _type: 'link',
            label: 'Contact',
            linkType: 'EXTERNAL',
            url: 'https://example.com/contact',
          },
        ],
      };

      const mutations = await runMigration(doc);
      const patchMutation = mutations.find(isPatch);

      if (!patchMutation) throw new Error('Expected a patch mutation.');

      const itemsPatch = patchMutation.patches[0] as {
        op: { value: { _key: string }[] };
      };
      const nextItems = itemsPatch.op.value;

      expect(nextItems[0]).toEqual({
        _key: 'existing',
        _type: 'linkRef',
        link: { _type: 'reference', _ref: 'link-existing' },
      });
      expect(nextItems[1]).toMatchObject({
        _key: 'legacy',
        _type: 'linkRef',
      });
    });

    it('warns and drops an item whose url is a relative path rather than a full address', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const doc = {
        ...baseDoc,
        _id: 'nav-4',
        _type: 'settings_navigation',
        items: [
          {
            _key: 'legacy',
            _type: 'link',
            label: 'Old Blog',
            linkType: 'EXTERNAL',
            url: '/blog',
          },
        ],
      };

      const mutations = await runMigration(doc);
      const patchMutation = mutations.find(isPatch);

      if (!patchMutation) throw new Error('Expected a patch mutation.');

      const itemsPatch = patchMutation.patches[0] as {
        op: { value: unknown[] };
      };

      expect(mutations.filter(isCreateIfNotExists)).toHaveLength(0);
      expect(itemsPatch.op.value).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('is not a full http(s) address'),
      );

      warnSpy.mockRestore();
    });
  });

  describe('settings_footer', () => {
    it('returns nothing when there is no social field', async () => {
      const doc = { ...baseDoc, _id: 'footer-1', _type: 'settings_footer' };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('returns nothing when every entry is already a socialProfile', async () => {
      const doc = {
        ...baseDoc,
        _id: 'footer-1',
        _type: 'settings_footer',
        social: [
          {
            _key: 'social-1',
            _type: 'socialProfile',
            platform: 'LINKEDIN',
            link: { _type: 'reference', _ref: 'link-existing' },
          },
        ],
      };

      expect(await runMigration(doc)).toEqual([]);
    });

    it('migrates the live Linkedin entry to a socialProfile, dropping accessibleLabel', async () => {
      const doc = {
        ...baseDoc,
        _id: 'settings-footer-singleton',
        _type: 'settings_footer',
        social: [
          {
            _key: 'decf174815c0',
            _type: 'link',
            label: 'Linkedin',
            accessibleLabel: 'Linkedin profile',
            linkType: 'EXTERNAL',
            url: 'https://www.linkedin.com/in/val-ovinnikov',
            openInNewTab: true,
            platform: 'LINKEDIN',
          },
        ],
      };

      const mutations = await runMigration(doc);
      const createMutation = mutations.find(isCreateIfNotExists);
      const patchMutation = mutations.find(isPatch);

      expect(createMutation?.document).toEqual({
        _id: expect.stringMatching(/^link-[a-f0-9]{16}$/) as string,
        _type: 'link',
        title: 'Link to https://www.linkedin.com/in/val-ovinnikov',
        label: 'Linkedin',
        linkType: 'EXTERNAL',
        openInNewTab: true,
        url: 'https://www.linkedin.com/in/val-ovinnikov',
      });
      expect(createMutation?.document).not.toHaveProperty('accessibleLabel');

      const linkId = createMutation?.document._id;

      expect(patchMutation).toEqual(
        patch('settings-footer-singleton', [
          at(
            'social',
            set([
              {
                _key: 'decf174815c0',
                _type: 'socialProfile',
                platform: 'LINKEDIN',
                link: { _type: 'reference', _ref: linkId },
              },
            ]),
          ),
        ]),
      );
    });

    it('dedupes two social entries sharing one destination and label onto a single link document', async () => {
      const sharedFields = {
        label: 'Linkedin',
        linkType: 'EXTERNAL' as const,
        url: 'https://www.linkedin.com/in/val-ovinnikov',
        platform: 'LINKEDIN',
      };

      const doc = {
        ...baseDoc,
        _id: 'footer-2',
        _type: 'settings_footer',
        social: [
          { _key: 'social-1', _type: 'link', ...sharedFields },
          { _key: 'social-2', _type: 'link', ...sharedFields },
        ],
      };

      const mutations = await runMigration(doc);

      expect(mutations.filter(isCreateIfNotExists)).toHaveLength(1);
    });

    it('warns when platform is missing but still migrates the entry', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const doc = {
        ...baseDoc,
        _id: 'footer-3',
        _type: 'settings_footer',
        social: [
          {
            _key: 'social-1',
            _type: 'link',
            label: 'Mystery',
            linkType: 'EXTERNAL',
            url: 'https://example.com/mystery',
          },
        ],
      };

      const mutations = await runMigration(doc);

      expect(mutations.filter(isCreateIfNotExists)).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('has no platform set'),
      );

      warnSpy.mockRestore();
    });
  });
});
