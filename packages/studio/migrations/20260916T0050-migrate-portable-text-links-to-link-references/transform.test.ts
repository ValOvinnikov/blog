import { LINK_TYPE, PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import {
  MOCK_EXTERNAL_HOSTNAME,
  MOCK_EXTERNAL_LABEL,
  MOCK_EXTERNAL_PATH,
  MOCK_EXTERNAL_URL,
  mockInlineLinkMarkDef,
  mockLinkRefMarkDef,
  mockPagePost,
  mockPortableTextBlock,
  mockRawHrefMarkDef,
  mockSpan,
} from '@blog/studio/testing/migrations/portable-text-links';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { mockMigrationContext } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';

import { LINK_LABEL_MAX_LENGTH } from '../lib/link-label-max-length';

import {
  applyMarkDefOutcomes,
  buildLinkDocumentFields,
  deriveExternalLabel,
  describeMarkDef,
  findLegacyLinkBlocks,
  resolveInlineLinkDestination,
  resolveRawHrefDestination,
  type TInlineLinkMarkDef,
} from './transform';

faker.seed(6019);

const MOCK_POST = mockPagePost();
const MOCK_CONTENT_FIELD = 'content';

const toLinkRefMarkDef = (key: string, linkId: string) => ({
  _key: key,
  _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
  link: { _type: 'reference', _ref: linkId },
});

describe(deriveExternalLabel, () => {
  const MOCK_NOT_A_URL = faker.lorem.word();

  it.each([
    {
      name: 'joins hostname and pathname',
      url: MOCK_EXTERNAL_URL,
      label: MOCK_EXTERNAL_LABEL,
    },
    {
      name: 'drops a leading www.',
      url: `https://www.${MOCK_EXTERNAL_HOSTNAME}${MOCK_EXTERNAL_PATH}`,
      label: MOCK_EXTERNAL_LABEL,
    },
    {
      name: 'drops a root-only pathname',
      url: `https://${MOCK_EXTERNAL_HOSTNAME}/`,
      label: MOCK_EXTERNAL_HOSTNAME,
    },
    {
      name: 'falls back to the hostname when the full label is too long',
      url: `https://${MOCK_EXTERNAL_HOSTNAME}/${'a'.repeat(LINK_LABEL_MAX_LENGTH)}`,
      label: MOCK_EXTERNAL_HOSTNAME,
    },
    {
      name: 'uses the input itself when it is not a URL',
      url: MOCK_NOT_A_URL,
      label: MOCK_NOT_A_URL,
    },
  ])('$name', ({ url, label }) => {
    expect(deriveExternalLabel(url)).toBe(label);
  });
});

describe(resolveRawHrefDestination, () => {
  const postContext = mockMigrationContext({
    fetch: mockGroqFetch([MOCK_POST]),
  });

  it('resolves a /blog/<slug> href to the matching page_post', async () => {
    const destination = await resolveRawHrefDestination(
      postContext,
      `/blog/${MOCK_POST.slug.current}`,
    );

    expect(destination).toEqual({
      linkType: LINK_TYPE.INTERNAL,
      internalReference: { _ref: MOCK_POST._id },
      title: `Link to ${MOCK_POST.title}`,
      label: MOCK_POST.title,
    });
  });

  it('prefers the published page_post over its draft', async () => {
    const draft = {
      ...MOCK_POST,
      _id: `drafts.${MOCK_POST._id}`,
      title: faker.lorem.words(3),
    };
    const context = mockMigrationContext({
      fetch: mockGroqFetch([draft, MOCK_POST]),
    });

    const destination = await resolveRawHrefDestination(
      context,
      `/blog/${MOCK_POST.slug.current}`,
    );

    expect(destination).toEqual({
      linkType: LINK_TYPE.INTERNAL,
      internalReference: { _ref: MOCK_POST._id },
      title: `Link to ${MOCK_POST.title}`,
      label: MOCK_POST.title,
    });
  });

  it('resolves a full https:// URL to an external destination', async () => {
    const destination = await resolveRawHrefDestination(
      postContext,
      MOCK_EXTERNAL_URL,
    );

    expect(destination).toEqual({
      linkType: LINK_TYPE.EXTERNAL,
      url: MOCK_EXTERNAL_URL,
      title: `Link to ${MOCK_EXTERNAL_URL}`,
      label: MOCK_EXTERNAL_LABEL,
    });
  });

  it.each([
    {
      name: 'a /blog/<slug> href matching no page_post',
      href: `/blog/${faker.lorem.slug(3)}`,
    },
    { name: 'an empty href', href: undefined },
    { name: 'a relative path that is not a blog post', href: '/about' },
  ])('is undefined for $name', async ({ href }) => {
    const destination = await resolveRawHrefDestination(postContext, href);

    expect(destination).toBeUndefined();
  });
});

describe(resolveInlineLinkDestination, () => {
  it('resolves an internal inlineLink, preferring its own label', async () => {
    const label = faker.lorem.words(2);
    const markDef = mockInlineLinkMarkDef({
      label,
      linkType: LINK_TYPE.INTERNAL,
      internalReference: { _ref: MOCK_POST._id },
    }) as TInlineLinkMarkDef;

    const destination = await resolveInlineLinkDestination(
      mockMigrationContext({ fetch: mockGroqFetch([MOCK_POST]) }),
      markDef,
    );

    expect(destination).toEqual({
      linkType: LINK_TYPE.INTERNAL,
      internalReference: { _ref: MOCK_POST._id },
      title: `Link to ${MOCK_POST.title}`,
      label,
    });
  });

  it('resolves an external inlineLink, deriving a label when none is set', async () => {
    const markDef = mockInlineLinkMarkDef({
      linkType: LINK_TYPE.EXTERNAL,
      url: MOCK_EXTERNAL_URL,
    }) as TInlineLinkMarkDef;

    const destination = await resolveInlineLinkDestination(
      mockMigrationContext({ fetch: mockGroqFetch([]) }),
      markDef,
    );

    expect(destination).toEqual({
      linkType: LINK_TYPE.EXTERNAL,
      url: MOCK_EXTERNAL_URL,
      title: `Link to ${MOCK_EXTERNAL_URL}`,
      label: MOCK_EXTERNAL_LABEL,
    });
  });

  it('is undefined for an internal inlineLink with no internalReference', async () => {
    const markDef = mockInlineLinkMarkDef({
      linkType: LINK_TYPE.INTERNAL,
    }) as TInlineLinkMarkDef;

    const destination = await resolveInlineLinkDestination(
      mockMigrationContext({ fetch: mockGroqFetch([]) }),
      markDef,
    );

    expect(destination).toBeUndefined();
  });
});

describe(buildLinkDocumentFields, () => {
  const linkId = faker.string.uuid();
  const internalTitle = `Link to ${MOCK_POST.title}`;
  const externalTitle = `Link to ${MOCK_EXTERNAL_URL}`;

  it.each([
    {
      name: 'carries internalReference for an INTERNAL destination',
      destination: {
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _ref: MOCK_POST._id },
        title: internalTitle,
        label: MOCK_POST.title,
      },
      expected: {
        _id: linkId,
        _type: 'link',
        title: internalTitle,
        label: MOCK_POST.title,
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'reference', _ref: MOCK_POST._id },
      },
    },
    {
      name: 'carries url for an EXTERNAL destination',
      destination: {
        linkType: LINK_TYPE.EXTERNAL,
        url: MOCK_EXTERNAL_URL,
        title: externalTitle,
        label: MOCK_EXTERNAL_LABEL,
      },
      expected: {
        _id: linkId,
        _type: 'link',
        title: externalTitle,
        label: MOCK_EXTERNAL_LABEL,
        linkType: LINK_TYPE.EXTERNAL,
        url: MOCK_EXTERNAL_URL,
      },
    },
  ])('$name', ({ destination, expected }) => {
    expect(buildLinkDocumentFields(linkId, destination)).toEqual(expected);
  });
});

describe(describeMarkDef, () => {
  const internalRef = faker.string.uuid();

  it.each([
    {
      name: 'a raw-href markDef by its href',
      markDef: mockRawHrefMarkDef(MOCK_EXTERNAL_URL),
      description: MOCK_EXTERNAL_URL,
    },
    {
      name: 'an inlineLink markDef by its url',
      markDef: mockInlineLinkMarkDef({ url: MOCK_EXTERNAL_URL }),
      description: MOCK_EXTERNAL_URL,
    },
    {
      name: 'an inlineLink markDef by its internal reference',
      markDef: mockInlineLinkMarkDef({
        internalReference: { _ref: internalRef },
      }),
      description: internalRef,
    },
    {
      name: 'a raw-href markDef with no href',
      markDef: mockRawHrefMarkDef(),
      description: '(no href set)',
    },
    {
      name: 'an inlineLink markDef with no destination',
      markDef: mockInlineLinkMarkDef(),
      description: '(no destination set)',
    },
  ])('describes $name', ({ markDef, description }) => {
    expect(describeMarkDef(markDef)).toBe(description);
  });
});

describe(findLegacyLinkBlocks, () => {
  it('finds a block with a legacy markDef at a top-level field', () => {
    const block = mockPortableTextBlock({ markDefs: [mockRawHrefMarkDef()] });
    const document = { [MOCK_CONTENT_FIELD]: [block] };

    const locations = findLegacyLinkBlocks(document);

    expect(locations).toEqual([
      { path: [MOCK_CONTENT_FIELD, { _key: block._key }], block },
    ]);
  });

  it('finds a block nested inside an aside object', () => {
    const block = mockPortableTextBlock({ markDefs: [mockRawHrefMarkDef()] });
    const asideKey = faker.string.alphanumeric(12);
    const document = {
      [MOCK_CONTENT_FIELD]: [{ _key: asideKey, _type: 'aside', body: [block] }],
    };

    const locations = findLegacyLinkBlocks(document);

    expect(locations).toEqual([
      {
        path: [
          MOCK_CONTENT_FIELD,
          { _key: asideKey },
          'body',
          { _key: block._key },
        ],
        block,
      },
    ]);
  });

  it.each([
    {
      name: 'whose markDefs are already linkRef',
      block: mockPortableTextBlock({
        markDefs: [mockLinkRefMarkDef(faker.string.uuid())],
      }),
    },
    { name: 'with no markDefs', block: mockPortableTextBlock() },
  ])('ignores a block $name', ({ block }) => {
    const locations = findLegacyLinkBlocks({ [MOCK_CONTENT_FIELD]: [block] });

    expect(locations).toEqual([]);
  });
});

describe(applyMarkDefOutcomes, () => {
  const keptMarkDef = mockRawHrefMarkDef();
  const brokenMarkDef = mockRawHrefMarkDef();
  const keptSpan = mockSpan(faker.lorem.word(), [keptMarkDef._key]);
  const brokenSpan = mockSpan(faker.lorem.word(), [brokenMarkDef._key]);
  const sharedSpan = mockSpan(faker.lorem.word(), [
    keptMarkDef._key,
    brokenMarkDef._key,
  ]);
  const block = mockPortableTextBlock({
    markDefs: [keptMarkDef, brokenMarkDef],
    children: [keptSpan, brokenSpan, sharedSpan],
  });
  const keptLinkId = faker.string.uuid();
  const brokenLinkId = faker.string.uuid();

  it('converts a resolved markDef to linkRef, leaving its marks untouched', () => {
    const { markDefs, children } = applyMarkDefOutcomes(block, [
      { outcome: 'CONVERTED', key: keptMarkDef._key, linkId: keptLinkId },
      { outcome: 'CONVERTED', key: brokenMarkDef._key, linkId: brokenLinkId },
    ]);

    expect(markDefs).toEqual([
      toLinkRefMarkDef(keptMarkDef._key, keptLinkId),
      toLinkRefMarkDef(brokenMarkDef._key, brokenLinkId),
    ]);
    expect(children).toEqual(block.children);
  });

  it('removes a stripped markDef and its mark reference from every span', () => {
    const { markDefs, children } = applyMarkDefOutcomes(block, [
      { outcome: 'CONVERTED', key: keptMarkDef._key, linkId: keptLinkId },
      { outcome: 'STRIPPED', key: brokenMarkDef._key },
    ]);

    expect(markDefs).toEqual([toLinkRefMarkDef(keptMarkDef._key, keptLinkId)]);
    expect(children).toEqual([
      keptSpan,
      { ...brokenSpan, marks: [] },
      { ...sharedSpan, marks: [keptMarkDef._key] },
    ]);
  });

  it('leaves a span with no marks array untouched', () => {
    const spanWithoutMarks = {
      _key: faker.string.alphanumeric(12),
      _type: 'span',
      text: faker.lorem.word(),
    };
    const plainBlock = mockPortableTextBlock({ markDefs: [] });

    const { children } = applyMarkDefOutcomes(
      { ...plainBlock, children: [spanWithoutMarks] },
      [],
    );

    expect(children).toEqual([spanWithoutMarks]);
  });
});
