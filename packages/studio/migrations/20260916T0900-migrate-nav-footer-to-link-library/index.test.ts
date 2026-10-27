import { LINK_TYPE, SOCIAL_PLATFORMS } from '@blog/config/constants';
import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/migrations/migration-document';
import { isCreateIfNotExistsMutation } from '@blog/studio/testing/migrations/mutation-guards';
import { faker } from '@faker-js/faker';
import {
  at,
  createIfNotExists,
  patch,
  set,
  type Mutation,
} from 'sanity/migrate';
import type { MockInstance } from 'vitest';

import { LINK_REF_TYPE, SOCIAL_PROFILE_TYPE } from './transform';

import migration from './index';

faker.seed(6019);

const NAVIGATION_TYPE = 'settings_navigation';
const FOOTER_TYPE = 'settings_footer';
const LINK_DOCUMENT_TYPE = 'link';
const INLINE_LINK_TYPE = 'inlineLink';
const REFERENCE_TYPE = 'reference';
const PAGE_TYPE = 'page_postIndex';
const UNTOUCHED_SUFFIX =
  'The document was left untouched — fix this entry in Studio, then re-run the migration.';

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_PAGE_TITLE = faker.lorem.words(2);
const MOCK_FIRST_KEY = faker.string.uuid();
const MOCK_SECOND_KEY = faker.string.uuid();
const MOCK_EXISTING_LINK_ID = faker.string.uuid();
const MOCK_FIRST_LABEL = faker.lorem.words(2);
const MOCK_SECOND_LABEL = faker.lorem.words(2);
const MOCK_FIRST_URL = faker.internet.url();
const MOCK_SECOND_URL = faker.internet.url();
const MOCK_RELATIVE_URL = `/${faker.lorem.word()}`;
const MOCK_ACCESSIBLE_LABEL = faker.lorem.words(3);
const MOCK_UNKNOWN_TYPE = faker.lorem.word();

const mockLegacyLink = (
  fields: Record<string, unknown> & { _key: string },
) => ({
  _type: LINK_DOCUMENT_TYPE,
  label: MOCK_FIRST_LABEL,
  linkType: LINK_TYPE.EXTERNAL,
  url: MOCK_FIRST_URL,
  ...fields,
});

const mockLinkRef = (key: string) => ({
  _key: key,
  _type: LINK_REF_TYPE,
  link: { _type: REFERENCE_TYPE, _ref: MOCK_EXISTING_LINK_ID },
});

const mockSocialProfile = (key: string) => ({
  _key: key,
  _type: SOCIAL_PROFILE_TYPE,
  platform: SOCIAL_PLATFORMS.LINKEDIN,
  link: { _type: REFERENCE_TYPE, _ref: MOCK_EXISTING_LINK_ID },
});

const migrate = async (
  document: ReturnType<typeof mockMigrationDocument>,
  dataset: unknown[] = [],
) =>
  (await runDocumentMigration(
    migration,
    document,
    mockMigrationContext(dataset),
  )) as Mutation[];

const readLinkIds = (mutations: Mutation[]): string[] =>
  mutations
    .filter(isCreateIfNotExistsMutation)
    .map((linkMutation) => linkMutation.document._id);

const skippedWarning = (documentId: string, issue: string) =>
  `${documentId}: ${issue}. ${UNTOUCHED_SUFFIX}`;

describe('migrate-nav-footer-to-link-library', () => {
  let warnSpy: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns nothing for an unrelated document type', async () => {
    const document = mockMigrationDocument({ _type: 'module_cta' });

    expect(await migrate(document)).toEqual([]);
  });

  describe(NAVIGATION_TYPE, () => {
    it.each([
      { title: 'there is no items field', fields: {} },
      { title: 'items is empty', fields: { items: [] } },
      {
        title: 'every item is already a linkRef',
        fields: { items: [mockLinkRef(MOCK_FIRST_KEY)] },
      },
    ])('returns nothing when $title', async ({ fields }) => {
      const document = mockMigrationDocument({
        _type: NAVIGATION_TYPE,
        ...fields,
      });

      expect(await migrate(document)).toEqual([]);
    });

    it('migrates an internal entry to a linkRef and creates its link document', async () => {
      const document = mockMigrationDocument({
        _type: NAVIGATION_TYPE,
        items: [
          mockLegacyLink({
            _key: MOCK_FIRST_KEY,
            linkType: LINK_TYPE.INTERNAL,
            internalReference: { _ref: MOCK_PAGE_ID },
            url: undefined,
            openInNewTab: false,
          }),
        ],
      });

      const mutations = await migrate(document, [
        { _id: MOCK_PAGE_ID, _type: PAGE_TYPE, title: MOCK_PAGE_TITLE },
      ]);
      const [linkId = ''] = readLinkIds(mutations);

      expect(mutations).toEqual([
        createIfNotExists({
          _id: linkId,
          _type: LINK_DOCUMENT_TYPE,
          title: `Link to ${MOCK_PAGE_TITLE}`,
          label: MOCK_FIRST_LABEL,
          linkType: LINK_TYPE.INTERNAL,
          openInNewTab: false,
          internalReference: { _type: REFERENCE_TYPE, _ref: MOCK_PAGE_ID },
        }),
        patch(document._id, [
          at(
            'items',
            set([
              {
                _key: MOCK_FIRST_KEY,
                _type: LINK_REF_TYPE,
                link: { _type: REFERENCE_TYPE, _ref: linkId },
              },
            ]),
          ),
        ]),
      ]);
    });

    it('accepts a pre-rename link and a post-rename inlineLink side by side', async () => {
      const document = mockMigrationDocument({
        _type: NAVIGATION_TYPE,
        items: [
          mockLegacyLink({ _key: MOCK_FIRST_KEY }),
          mockLegacyLink({
            _key: MOCK_SECOND_KEY,
            _type: INLINE_LINK_TYPE,
            label: MOCK_SECOND_LABEL,
            url: MOCK_SECOND_URL,
          }),
        ],
      });

      const mutations = await migrate(document);
      const [firstLinkId = '', secondLinkId = ''] = readLinkIds(mutations);

      expect(mutations).toEqual([
        createIfNotExists({
          _id: firstLinkId,
          _type: LINK_DOCUMENT_TYPE,
          title: `Link to ${MOCK_FIRST_URL}`,
          label: MOCK_FIRST_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_FIRST_URL,
        }),
        createIfNotExists({
          _id: secondLinkId,
          _type: LINK_DOCUMENT_TYPE,
          title: `Link to ${MOCK_SECOND_URL}`,
          label: MOCK_SECOND_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_SECOND_URL,
        }),
        patch(document._id, [
          at(
            'items',
            set([
              {
                _key: MOCK_FIRST_KEY,
                _type: LINK_REF_TYPE,
                link: { _type: REFERENCE_TYPE, _ref: firstLinkId },
              },
              {
                _key: MOCK_SECOND_KEY,
                _type: LINK_REF_TYPE,
                link: { _type: REFERENCE_TYPE, _ref: secondLinkId },
              },
            ]),
          ),
        ]),
      ]);
    });

    it('keeps an already-migrated item as is alongside a legacy one', async () => {
      const existingItem = mockLinkRef(MOCK_FIRST_KEY);
      const document = mockMigrationDocument({
        _type: NAVIGATION_TYPE,
        items: [existingItem, mockLegacyLink({ _key: MOCK_SECOND_KEY })],
      });

      const mutations = await migrate(document);
      const [linkId = ''] = readLinkIds(mutations);

      expect(mutations).toEqual([
        createIfNotExists({
          _id: linkId,
          _type: LINK_DOCUMENT_TYPE,
          title: `Link to ${MOCK_FIRST_URL}`,
          label: MOCK_FIRST_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_FIRST_URL,
        }),
        patch(document._id, [
          at(
            'items',
            set([
              existingItem,
              {
                _key: MOCK_SECOND_KEY,
                _type: LINK_REF_TYPE,
                link: { _type: REFERENCE_TYPE, _ref: linkId },
              },
            ]),
          ),
        ]),
      ]);
    });

    describe('with unresolvable items', () => {
      it.each([
        {
          title: 'an item has an unrecognized _type',
          item: mockLegacyLink({
            _key: MOCK_FIRST_KEY,
            _type: MOCK_UNKNOWN_TYPE,
          }),
          issue: `a link entry (key "${MOCK_FIRST_KEY}") has _type "${MOCK_UNKNOWN_TYPE}", neither "link" nor "inlineLink"`,
        },
        {
          title: 'an item has no resolvable destination',
          item: mockLegacyLink({
            _key: MOCK_FIRST_KEY,
            linkType: undefined,
            url: undefined,
          }),
          issue: `a link entry (key "${MOCK_FIRST_KEY}") has no resolvable destination (neither internalReference nor url set)`,
        },
        {
          title: 'an item url is a relative path',
          item: mockLegacyLink({
            _key: MOCK_FIRST_KEY,
            url: MOCK_RELATIVE_URL,
          }),
          issue: `a link entry (key "${MOCK_FIRST_KEY}")'s url "${MOCK_RELATIVE_URL}" is not a full http(s) address with a host — the new link.url requires one`,
        },
      ])(
        'warns and leaves the document untouched when $title',
        async ({ item, issue }) => {
          const document = mockMigrationDocument({
            _type: NAVIGATION_TYPE,
            items: [item],
          });

          const mutations = await migrate(document);

          expect(mutations).toEqual([]);
          expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
            skippedWarning(document._id, issue),
          );
        },
      );

      it('leaves the whole document untouched when only one entry is unresolvable', async () => {
        const document = mockMigrationDocument({
          _type: NAVIGATION_TYPE,
          items: [
            mockLegacyLink({ _key: MOCK_FIRST_KEY }),
            mockLegacyLink({
              _key: MOCK_SECOND_KEY,
              url: MOCK_RELATIVE_URL,
            }),
          ],
        });

        const mutations = await migrate(document);

        expect(mutations).toEqual([]);
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
          skippedWarning(
            document._id,
            `a link entry (key "${MOCK_SECOND_KEY}")'s url "${MOCK_RELATIVE_URL}" is not a full http(s) address with a host — the new link.url requires one`,
          ),
        );
      });
    });
  });

  describe(FOOTER_TYPE, () => {
    it.each([
      { title: 'there is no social field', fields: {} },
      {
        title: 'every entry is already a socialProfile',
        fields: { social: [mockSocialProfile(MOCK_FIRST_KEY)] },
      },
    ])('returns nothing when $title', async ({ fields }) => {
      const document = mockMigrationDocument({ _type: FOOTER_TYPE, ...fields });

      expect(await migrate(document)).toEqual([]);
    });

    it('migrates a social entry and warns that its accessible label is dropped', async () => {
      const document = mockMigrationDocument({
        _type: FOOTER_TYPE,
        social: [
          mockLegacyLink({
            _key: MOCK_FIRST_KEY,
            accessibleLabel: MOCK_ACCESSIBLE_LABEL,
            openInNewTab: true,
            platform: SOCIAL_PLATFORMS.LINKEDIN,
          }),
        ],
      });

      const mutations = await migrate(document);
      const [linkId = ''] = readLinkIds(mutations);

      expect(mutations).toEqual([
        createIfNotExists({
          _id: linkId,
          _type: LINK_DOCUMENT_TYPE,
          title: `Link to ${MOCK_FIRST_URL}`,
          label: MOCK_FIRST_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          openInNewTab: true,
          url: MOCK_FIRST_URL,
        }),
        patch(document._id, [
          at(
            'social',
            set([
              {
                _key: MOCK_FIRST_KEY,
                _type: SOCIAL_PROFILE_TYPE,
                platform: SOCIAL_PLATFORMS.LINKEDIN,
                link: { _type: REFERENCE_TYPE, _ref: linkId },
              },
            ]),
          ),
        ]),
      ]);
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `${document._id}: link entry accessibleLabel "${MOCK_ACCESSIBLE_LABEL}" has no field on the link document and was dropped.`,
      );
    });

    it('creates one link for two social entries sharing a destination and label', async () => {
      const sharedFields = { platform: SOCIAL_PLATFORMS.LINKEDIN };
      const document = mockMigrationDocument({
        _type: FOOTER_TYPE,
        social: [
          mockLegacyLink({ _key: MOCK_FIRST_KEY, ...sharedFields }),
          mockLegacyLink({ _key: MOCK_SECOND_KEY, ...sharedFields }),
        ],
      });

      const mutations = await migrate(document);
      const [linkId = ''] = readLinkIds(mutations);

      expect(mutations).toEqual([
        createIfNotExists({
          _id: linkId,
          _type: LINK_DOCUMENT_TYPE,
          title: `Link to ${MOCK_FIRST_URL}`,
          label: MOCK_FIRST_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_FIRST_URL,
        }),
        patch(document._id, [
          at(
            'social',
            set([
              {
                _key: MOCK_FIRST_KEY,
                _type: SOCIAL_PROFILE_TYPE,
                platform: SOCIAL_PLATFORMS.LINKEDIN,
                link: { _type: REFERENCE_TYPE, _ref: linkId },
              },
              {
                _key: MOCK_SECOND_KEY,
                _type: SOCIAL_PROFILE_TYPE,
                platform: SOCIAL_PLATFORMS.LINKEDIN,
                link: { _type: REFERENCE_TYPE, _ref: linkId },
              },
            ]),
          ),
        ]),
      ]);
    });

    it('warns when platform is missing but still migrates the entry', async () => {
      const document = mockMigrationDocument({
        _type: FOOTER_TYPE,
        social: [mockLegacyLink({ _key: MOCK_FIRST_KEY })],
      });

      const mutations = await migrate(document);
      const [linkId = ''] = readLinkIds(mutations);

      expect(mutations).toEqual([
        createIfNotExists({
          _id: linkId,
          _type: LINK_DOCUMENT_TYPE,
          title: `Link to ${MOCK_FIRST_URL}`,
          label: MOCK_FIRST_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_FIRST_URL,
        }),
        patch(document._id, [
          at(
            'social',
            set([
              {
                _key: MOCK_FIRST_KEY,
                _type: SOCIAL_PROFILE_TYPE,
                link: { _type: REFERENCE_TYPE, _ref: linkId },
              },
            ]),
          ),
        ]),
      ]);
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `${document._id}: a social link entry has no platform set — the new socialProfile.platform is required and was left empty.`,
      );
    });
  });
});
