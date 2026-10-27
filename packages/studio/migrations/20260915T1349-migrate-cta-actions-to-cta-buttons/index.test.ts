import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  LINK_TYPE,
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

const mockCtaDocument = (actions?: unknown[]) =>
  mockMigrationDocument({
    _type: MODULE_CTA_TYPE,
    ...(actions ? { actions: { actions } } : {}),
  });

const mockExternalAction = (
  fields: Record<string, unknown> & { _key: string },
) => ({
  link: {
    label: MOCK_SHARED_LABEL,
    linkType: LINK_TYPE.EXTERNAL,
    url: MOCK_SHARED_URL,
  },
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

describe('migrate-cta-actions-to-cta-buttons', () => {
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
});
