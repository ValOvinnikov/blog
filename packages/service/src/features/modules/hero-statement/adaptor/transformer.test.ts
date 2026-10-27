import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@blog/config';
import {
  MOCK_HERO_EYEBROW,
  MOCK_HERO_IMAGE_ALT,
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawHeroStatementModule,
} from '@blog/service/testing/modules/fixtures';
import {
  mockRawHeadingBlock,
  mockRawHeroLayout,
  mockRawSanityImage,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toHeroStatementModule } from './transformer';

faker.seed(8);

const MOCK_STATEMENT_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

describe(toHeroStatementModule, () => {
  it('maps the brand variant, variant and heading block', () => {
    const raw = mockRawHeroStatementModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      variant: HERO_VARIANT.BANNER,
      headingBlock: mockRawHeadingBlock(MOCK_STATEMENT_HEADING),
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
    expect(hero.variant).toBe(HERO_VARIANT.BANNER);
    expect(hero.headingBlock).toEqual({
      heading: MOCK_STATEMENT_HEADING,
      supportingText: undefined,
    });
  });

  it.each([
    [null, null, undefined, undefined],
    [
      MOCK_HERO_EYEBROW,
      MOCK_SUPPORTING_TEXT,
      MOCK_HERO_EYEBROW,
      MOCK_SUPPORTING_TEXT,
    ],
  ])(
    'maps eyebrow %s and supporting text %s to %s and %s',
    (eyebrow, supportingText, expectedEyebrow, expectedSupportingText) => {
      const raw = mockRawHeroStatementModule({
        eyebrow,
        headingBlock: mockRawHeadingBlock(MOCK_STATEMENT_HEADING, {
          supportingText,
        }),
      });

      const hero = toHeroStatementModule(raw);

      expect(hero.eyebrow).toBe(expectedEyebrow);
      expect(hero.headingBlock.supportingText).toBe(expectedSupportingText);
    },
  );

  it('maps an authored image', () => {
    const raw = mockRawHeroStatementModule({
      image: mockRawSanityImage(MOCK_HERO_IMAGE_ALT),
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.sanityImage?.alt).toBe(MOCK_HERO_IMAGE_ALT);
  });

  it('maps an authored cta button', () => {
    const raw = mockRawHeroStatementModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.ctaButtons).toEqual([mockCtaButtonView()]);
  });

  it('takes content position and media order from the Split variant', () => {
    const raw = mockRawHeroStatementModule({
      variant: HERO_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
      mediaOrderSplit: MEDIA_ORDER.FIRST,
      mediaOrderStacked: MEDIA_ORDER.LAST,
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
    expect(hero.mediaOrder).toBe(MEDIA_ORDER.FIRST);
  });

  it.each([
    [null, undefined],
    [CONTENT_ALIGNMENT.CENTER, CONTENT_ALIGNMENT.CENTER],
  ])('maps contentAlignment %s to %s', (contentAlignment, expected) => {
    const raw = mockRawHeroStatementModule({ contentAlignment });

    const hero = toHeroStatementModule(raw);

    expect(hero.contentAlignment).toBe(expected);
  });

  it('maps a fully-authored layout object', () => {
    const layout = mockRawHeroLayout();
    const raw = mockRawHeroStatementModule({ layout });

    const hero = toHeroStatementModule(raw);

    expect(hero.layout).toEqual({ ...layout, containerWidth: undefined });
  });
});
