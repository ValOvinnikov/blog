import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  LINK_TYPE,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config';
import {
  mockCtaButtonView,
  mockRawContentBlock,
  mockRawContentMarkDef,
  mockRawCtaButton,
  mockRawCtaModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_LINK_LABEL,
  MOCK_POST_HREF,
  MOCK_POST_SLUG,
  mockRawHeadingBlock,
  mockRawSanityImage,
  mockRawWideLayout,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toCtaModule } from './transformer';

faker.seed(6014);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_AUTHORED_EYEBROW_AND_FOOTNOTE = {
  eyebrow: faker.lorem.words(2),
  footnote: faker.lorem.sentence(),
};

describe(toCtaModule, () => {
  it('maps headingBlock', () => {
    const raw = mockRawCtaModule({
      headingBlock: mockRawHeadingBlock(MOCK_HEADING, {
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    });

    const cta = toCtaModule(raw);

    expect(cta.headingBlock).toEqual({
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    });
  });

  it.each([BRAND_VARIANT.SECONDARY, BRAND_VARIANT.BRAND_PRIMARY])(
    'maps brandVariant %s straight through',
    (brandVariant) => {
      const raw = mockRawCtaModule({ brandVariant });

      const cta = toCtaModule(raw);

      expect(cta.brandVariant).toBe(brandVariant);
    },
  );

  it.each([
    [BRAND_VARIANT.SECONDARY, BRAND_VARIANT.SECONDARY],
    [BRAND_VARIANT.BRAND_PRIMARY, BRAND_VARIANT.BRAND_PRIMARY],
    [null, BRAND_VARIANT.PRIMARY],
  ])('maps bandTone %s to %s', (bandTone, expected) => {
    const raw = mockRawCtaModule({ bandTone });

    const cta = toCtaModule(raw);

    expect(cta.bandTone).toBe(expected);
  });

  it.each([CTA_VARIANT.BANNER, CTA_VARIANT.SPLIT, CTA_VARIANT.CALLOUT])(
    'maps variant %s straight through',
    (variant) => {
      const raw = mockRawCtaModule({ variant });

      const cta = toCtaModule(raw);

      expect(cta.variant).toBe(variant);
    },
  );

  it.each([
    [
      CTA_VARIANT.SPLIT,
      CONTENT_ALIGNMENT.RIGHT,
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.RIGHT,
    ],
    [
      CTA_VARIANT.BANNER,
      CONTENT_ALIGNMENT.RIGHT,
      CONTENT_ALIGNMENT.LEFT,
      CONTENT_ALIGNMENT.LEFT,
    ],
    [
      CTA_VARIANT.CALLOUT,
      CONTENT_ALIGNMENT.RIGHT,
      CONTENT_ALIGNMENT.CENTER,
      undefined,
    ],
    [CTA_VARIANT.SPLIT, null, CONTENT_ALIGNMENT.LEFT, undefined],
    [CTA_VARIANT.BANNER, CONTENT_ALIGNMENT.RIGHT, null, undefined],
  ])(
    'on %s with split %s and banner %s, takes contentPosition %s',
    (variant, contentPositionSplit, contentPositionBanner, expected) => {
      const raw = mockRawCtaModule({
        variant,
        contentPositionSplit,
        contentPositionBanner,
      });

      const cta = toCtaModule(raw);

      expect(cta.contentPosition).toBe(expected);
    },
  );

  it.each([
    [null, undefined],
    [CONTENT_ALIGNMENT.CENTER, CONTENT_ALIGNMENT.CENTER],
  ])('maps contentAlignment %s to %s', (contentAlignment, expected) => {
    const raw = mockRawCtaModule({ contentAlignment });

    const cta = toCtaModule(raw);

    expect(cta.contentAlignment).toBe(expected);
  });

  it.each([
    [
      { eyebrow: null, footnote: null },
      { eyebrow: undefined, footnote: undefined },
    ],
    [MOCK_AUTHORED_EYEBROW_AND_FOOTNOTE, MOCK_AUTHORED_EYEBROW_AND_FOOTNOTE],
  ])('maps eyebrow and footnote %o to %o', (authored, expected) => {
    const raw = mockRawCtaModule(authored);

    const cta = toCtaModule(raw);

    expect(cta).toMatchObject(expected);
  });

  it('leaves content undefined when unset', () => {
    const raw = mockRawCtaModule({ content: null });

    const cta = toCtaModule(raw);

    expect(cta.content).toBeUndefined();
  });

  it('resolves an internal-document link inside content to a real href', () => {
    const markDef = mockRawContentMarkDef({
      link: {
        label: MOCK_LINK_LABEL,
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_post', slug: MOCK_POST_SLUG },
        url: null,
        openInNewTab: null,
      },
    });
    const raw = mockRawCtaModule({
      content: [mockRawContentBlock({ markDefs: [markDef] })],
    });

    const cta = toCtaModule(raw);

    expect(cta.content?.[0]?.markDefs?.[0]).toMatchObject({
      _key: markDef._key,
      _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
      link: { href: MOCK_POST_HREF },
    });
  });

  it('maps image when authored', () => {
    const raw = mockRawCtaModule({ image: mockRawSanityImage() });

    const cta = toCtaModule(raw);

    expect(cta.image).toEqual(mockSanityImageView());
  });

  it('maps a ctaButton to its resolved button', () => {
    const raw = mockRawCtaModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const cta = toCtaModule(raw);

    expect(cta.ctaButtons).toEqual([mockCtaButtonView()]);
  });

  it('maps a fully-authored layout object 1:1', () => {
    const layout = mockRawWideLayout();
    const raw = mockRawCtaModule({ layout });

    const cta = toCtaModule(raw);

    expect(cta.layout).toEqual(layout);
  });
});
