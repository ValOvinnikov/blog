import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  LINK_TYPE,
  SOCIAL_PLATFORMS,
} from '@blog/config/constants';
import { isCreateIfNotExistsMutation } from '@blog/studio/testing/migrations/mutation-guards';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import {
  mockMigrationContext,
  mockMigrationDocument,
  runDocumentMigration,
} from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';
import {
  at,
  createIfNotExists,
  patch,
  set,
  unset,
  type Mutation,
} from 'sanity/migrate';
import type { MockInstance } from 'vitest';

import { LINK_LABEL_MAX_LENGTH } from '../lib/link-label-max-length';

import migration from './index';

faker.seed(6019);

const MODULE_CTA_TYPE = 'module_cta';
const LINK_DOCUMENT_TYPE = 'link';
const CTA_BUTTON_TYPE = 'ctaButton';
const REFERENCE_TYPE = 'reference';
const PAGE_TYPE = 'page_landing';

const MOCK_FIRST_KEY = faker.string.uuid();
const MOCK_SECOND_KEY = faker.string.uuid();
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_PAGE_TITLE = faker.lorem.words(2);
const MOCK_START_LABEL = faker.lorem.words(2);
const MOCK_START_URL = faker.internet.url();
const MOCK_SHARED_LABEL = faker.lorem.words(2);
const MOCK_SHARED_URL = faker.internet.url();
const MOCK_INTERNAL_LABEL = faker.lorem.words(2);
const MOCK_OVERSIZED_LABEL = faker.string.alpha(LINK_LABEL_MAX_LENGTH + 1);
const MOCK_ACCESSIBLE_LABEL = faker.lorem.words(3);

const mockCtaDocument = (actions?: unknown[]) =>
  mockMigrationDocument({
    _type: MODULE_CTA_TYPE,
    ...(actions ? { actions: { actions } } : {}),
  });

const mockExternalLink = (fields: Record<string, unknown> = {}) => ({
  label: MOCK_SHARED_LABEL,
  linkType: LINK_TYPE.EXTERNAL,
  url: MOCK_SHARED_URL,
  ...fields,
});

const mockExternalAction = (
  fields: Record<string, unknown> & { _key: string },
) => ({
  link: mockExternalLink(),
  ...fields,
});

const migrate = async (
  document: ReturnType<typeof mockCtaDocument>,
  dataset: unknown[] = [],
) =>
  (await runDocumentMigration(
    migration,
    document,
    mockMigrationContext({ fetch: mockGroqFetch(dataset) }),
  )) as Mutation[];

const readLinkIds = (mutations: Mutation[]): string[] =>
  mutations
    .filter(isCreateIfNotExistsMutation)
    .map((linkMutation) => linkMutation.document._id);

const readLinkId = (mutations: Mutation[]): string => {
  const [linkId] = readLinkIds(mutations);

  if (!linkId) throw new Error('Expected a createIfNotExists mutation.');

  return linkId;
};

const ctaButtonsPatch = (documentId: string, ctaButtons: unknown[]) =>
  patch(documentId, [
    at('ctaButtons', set(ctaButtons)),
    at('actions', unset()),
  ]);

const expectedSingleButtonMutations = (
  documentId: string,
  linkId: string,
  label?: string,
) => [
  createIfNotExists({
    _id: linkId,
    _type: LINK_DOCUMENT_TYPE,
    title: `Link to ${MOCK_SHARED_URL}`,
    label,
    linkType: LINK_TYPE.EXTERNAL,
    url: MOCK_SHARED_URL,
  }),
  ctaButtonsPatch(documentId, [
    {
      _key: MOCK_FIRST_KEY,
      _type: CTA_BUTTON_TYPE,
      link: { _type: REFERENCE_TYPE, _ref: linkId },
    },
  ]),
];

describe('migrate-cta-actions-to-cta-buttons', () => {
  let warnSpy: MockInstance<typeof console.warn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns nothing for a CTA with no actions at all', async () => {
    const document = mockCtaDocument();

    expect(await migrate(document)).toEqual([]);
  });

  it('returns nothing for a CTA already migrated to ctaButtons', async () => {
    const document = mockMigrationDocument({
      _type: MODULE_CTA_TYPE,
      ctaButtons: [],
      actions: { actions: [] },
    });

    expect(await migrate(document)).toEqual([]);
  });

  it('migrates a single external-link button to a link document and ctaButton', async () => {
    const document = mockCtaDocument([
      {
        _key: MOCK_FIRST_KEY,
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        link: {
          label: MOCK_START_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_START_URL,
          openInNewTab: true,
        },
      },
    ]);

    const mutations = await migrate(document);
    const linkId = readLinkId(mutations);

    expect(mutations).toEqual([
      createIfNotExists({
        _id: linkId,
        _type: LINK_DOCUMENT_TYPE,
        title: `Link to ${MOCK_START_URL}`,
        label: MOCK_START_LABEL,
        linkType: LINK_TYPE.EXTERNAL,
        openInNewTab: true,
        url: MOCK_START_URL,
      }),
      ctaButtonsPatch(document._id, [
        {
          _key: MOCK_FIRST_KEY,
          _type: CTA_BUTTON_TYPE,
          variant: CTA_ACTION_VARIANT.PRIMARY,
          appearance: CTA_ACTION_APPEARANCE.CONTAINED,
          link: { _type: REFERENCE_TYPE, _ref: linkId },
        },
      ]),
    ]);
  });

  it('migrates two buttons in their original order, each to its own link', async () => {
    const document = mockCtaDocument([
      mockExternalAction({
        _key: MOCK_FIRST_KEY,
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
      }),
      {
        _key: MOCK_SECOND_KEY,
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: CTA_ACTION_APPEARANCE.INLINE,
        link: {
          label: MOCK_INTERNAL_LABEL,
          linkType: LINK_TYPE.INTERNAL,
          internalReference: { _ref: MOCK_PAGE_ID },
        },
      },
    ]);

    const mutations = await migrate(document, [
      { _id: MOCK_PAGE_ID, _type: PAGE_TYPE, title: MOCK_PAGE_TITLE },
    ]);
    const [externalLinkId = '', internalLinkId = ''] = readLinkIds(mutations);

    expect(mutations).toEqual([
      createIfNotExists({
        _id: externalLinkId,
        _type: LINK_DOCUMENT_TYPE,
        title: `Link to ${MOCK_SHARED_URL}`,
        label: MOCK_SHARED_LABEL,
        linkType: LINK_TYPE.EXTERNAL,
        url: MOCK_SHARED_URL,
      }),
      createIfNotExists({
        _id: internalLinkId,
        _type: LINK_DOCUMENT_TYPE,
        title: `Link to ${MOCK_PAGE_TITLE}`,
        label: MOCK_INTERNAL_LABEL,
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: REFERENCE_TYPE, _ref: MOCK_PAGE_ID },
      }),
      ctaButtonsPatch(document._id, [
        {
          _key: MOCK_FIRST_KEY,
          _type: CTA_BUTTON_TYPE,
          variant: CTA_ACTION_VARIANT.PRIMARY,
          appearance: CTA_ACTION_APPEARANCE.CONTAINED,
          link: { _type: REFERENCE_TYPE, _ref: externalLinkId },
        },
        {
          _key: MOCK_SECOND_KEY,
          _type: CTA_BUTTON_TYPE,
          variant: CTA_ACTION_VARIANT.SECONDARY,
          appearance: CTA_ACTION_APPEARANCE.INLINE,
          link: { _type: REFERENCE_TYPE, _ref: internalLinkId },
        },
      ]),
    ]);
    expect(externalLinkId).not.toBe(internalLinkId);
  });

  it('titles an internal link after its reference when the target is missing', async () => {
    const document = mockCtaDocument([
      {
        _key: MOCK_FIRST_KEY,
        link: {
          label: MOCK_INTERNAL_LABEL,
          linkType: LINK_TYPE.INTERNAL,
          internalReference: { _ref: MOCK_PAGE_ID },
        },
      },
    ]);

    const mutations = await migrate(document);
    const [linkMutation] = mutations.filter(isCreateIfNotExistsMutation);

    expect(linkMutation?.document.title).toBe(`Link to ${MOCK_PAGE_ID}`);
  });

  it('collapses two CTAs sharing one destination onto the same link id', async () => {
    const documentA = mockCtaDocument([
      mockExternalAction({
        _key: MOCK_FIRST_KEY,
        variant: CTA_ACTION_VARIANT.PRIMARY,
      }),
    ]);
    const documentB = mockCtaDocument([
      mockExternalAction({
        _key: MOCK_FIRST_KEY,
        variant: CTA_ACTION_VARIANT.SECONDARY,
      }),
    ]);

    const linkIdA = readLinkId(await migrate(documentA));
    const linkIdB = readLinkId(await migrate(documentB));

    expect(linkIdA).toBe(linkIdB);
  });

  it('creates one link when both buttons of a CTA share a destination', async () => {
    const document = mockCtaDocument([
      mockExternalAction({
        _key: MOCK_FIRST_KEY,
        variant: CTA_ACTION_VARIANT.PRIMARY,
      }),
      mockExternalAction({
        _key: MOCK_SECOND_KEY,
        variant: CTA_ACTION_VARIANT.SECONDARY,
      }),
    ]);

    const mutations = await migrate(document);
    const linkId = readLinkId(mutations);

    expect(mutations).toEqual([
      createIfNotExists({
        _id: linkId,
        _type: LINK_DOCUMENT_TYPE,
        title: `Link to ${MOCK_SHARED_URL}`,
        label: MOCK_SHARED_LABEL,
        linkType: LINK_TYPE.EXTERNAL,
        url: MOCK_SHARED_URL,
      }),
      ctaButtonsPatch(document._id, [
        {
          _key: MOCK_FIRST_KEY,
          _type: CTA_BUTTON_TYPE,
          variant: CTA_ACTION_VARIANT.PRIMARY,
          link: { _type: REFERENCE_TYPE, _ref: linkId },
        },
        {
          _key: MOCK_SECOND_KEY,
          _type: CTA_BUTTON_TYPE,
          variant: CTA_ACTION_VARIANT.SECONDARY,
          link: { _type: REFERENCE_TYPE, _ref: linkId },
        },
      ]),
    ]);
  });

  describe('warnings', () => {
    it('warns when the buttons would break the new ordering rules and keeps their order', async () => {
      const document = mockCtaDocument([
        mockExternalAction({
          _key: MOCK_FIRST_KEY,
          variant: CTA_ACTION_VARIANT.PRIMARY,
        }),
        mockExternalAction({
          _key: MOCK_SECOND_KEY,
          variant: CTA_ACTION_VARIANT.PRIMARY,
        }),
      ]);

      const mutations = await migrate(document);
      const linkId = readLinkId(mutations);
      const orderingIssues = [
        { type: 'DUPLICATE_VARIANT', variant: CTA_ACTION_VARIANT.PRIMARY },
      ];

      expect(mutations).toEqual([
        createIfNotExists({
          _id: linkId,
          _type: LINK_DOCUMENT_TYPE,
          title: `Link to ${MOCK_SHARED_URL}`,
          label: MOCK_SHARED_LABEL,
          linkType: LINK_TYPE.EXTERNAL,
          url: MOCK_SHARED_URL,
        }),
        ctaButtonsPatch(document._id, [
          {
            _key: MOCK_FIRST_KEY,
            _type: CTA_BUTTON_TYPE,
            variant: CTA_ACTION_VARIANT.PRIMARY,
            link: { _type: REFERENCE_TYPE, _ref: linkId },
          },
          {
            _key: MOCK_SECOND_KEY,
            _type: CTA_BUTTON_TYPE,
            variant: CTA_ACTION_VARIANT.PRIMARY,
            link: { _type: REFERENCE_TYPE, _ref: linkId },
          },
        ]),
      ]);
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `${document._id}: ctaButtons would violate the new ordering rules after migration — ${JSON.stringify(orderingIssues)}. Written in original order; needs a manual fix in Studio.`,
      );
    });

    it.each([
      { title: 'it has no link', link: undefined },
      { title: 'its link has no url', link: { linkType: LINK_TYPE.EXTERNAL } },
    ])(
      'skips an action without a link document or ctaButton when $title',
      async ({ link }) => {
        const document = mockCtaDocument([
          { _key: MOCK_FIRST_KEY, link },
          mockExternalAction({ _key: MOCK_SECOND_KEY }),
        ]);

        const mutations = await migrate(document);
        const linkId = readLinkId(mutations);

        expect(mutations).toEqual([
          createIfNotExists({
            _id: linkId,
            _type: LINK_DOCUMENT_TYPE,
            title: `Link to ${MOCK_SHARED_URL}`,
            label: MOCK_SHARED_LABEL,
            linkType: LINK_TYPE.EXTERNAL,
            url: MOCK_SHARED_URL,
          }),
          ctaButtonsPatch(document._id, [
            {
              _key: MOCK_SECOND_KEY,
              _type: CTA_BUTTON_TYPE,
              link: { _type: REFERENCE_TYPE, _ref: linkId },
            },
          ]),
        ]);
        expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
          `${document._id}: skipping a ctaAction with no resolvable destination (neither internalReference nor url set).`,
        );
      },
    );

    it('warns when a link has no label and leaves it empty', async () => {
      const document = mockCtaDocument([
        { _key: MOCK_FIRST_KEY, link: mockExternalLink({ label: undefined }) },
      ]);

      const mutations = await migrate(document);
      const linkId = readLinkId(mutations);

      expect(mutations).toEqual(
        expectedSingleButtonMutations(document._id, linkId),
      );
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `${document._id}: a ctaAction destined for external:${MOCK_SHARED_URL}|label: has no label — the new link.label is required and was left empty.`,
      );
    });

    it('warns when a label is over the link label limit and keeps it as is', async () => {
      const document = mockCtaDocument([
        {
          _key: MOCK_FIRST_KEY,
          link: mockExternalLink({ label: MOCK_OVERSIZED_LABEL }),
        },
      ]);

      const mutations = await migrate(document);
      const linkId = readLinkId(mutations);

      expect(mutations).toEqual(
        expectedSingleButtonMutations(
          document._id,
          linkId,
          MOCK_OVERSIZED_LABEL,
        ),
      );
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `${document._id}: ctaAction label "${MOCK_OVERSIZED_LABEL}" is ${String(LINK_LABEL_MAX_LENGTH + 1)} characters, over the ${String(LINK_LABEL_MAX_LENGTH)}-character link.label limit — kept as-is.`,
      );
    });

    it('warns that a link platform is dropped', async () => {
      const document = mockCtaDocument([
        {
          _key: MOCK_FIRST_KEY,
          link: mockExternalLink({ platform: SOCIAL_PLATFORMS.LINKEDIN }),
        },
      ]);

      const mutations = await migrate(document);
      const linkId = readLinkId(mutations);

      expect(mutations).toEqual(
        expectedSingleButtonMutations(document._id, linkId, MOCK_SHARED_LABEL),
      );
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `${document._id}: ctaAction link.platform "${SOCIAL_PLATFORMS.LINKEDIN}" has no field on the link document and was dropped.`,
      );
    });

    it('warns that a link accessible label is dropped', async () => {
      const document = mockCtaDocument([
        {
          _key: MOCK_FIRST_KEY,
          link: mockExternalLink({ accessibleLabel: MOCK_ACCESSIBLE_LABEL }),
        },
      ]);

      const mutations = await migrate(document);
      const linkId = readLinkId(mutations);

      expect(mutations).toEqual(
        expectedSingleButtonMutations(document._id, linkId, MOCK_SHARED_LABEL),
      );
      expect(warnSpy).toHaveBeenCalledExactlyOnceWith(
        `${document._id}: ctaAction link.accessibleLabel "${MOCK_ACCESSIBLE_LABEL}" has no field on the link document and was dropped.`,
      );
    });
  });
});
