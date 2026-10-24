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

import { toHeroStatementModule } from './transformer';

const STATEMENT_HEADING = 'Ship confidently';
const AUTHORED_SUPPORTING_TEXT = 'Supporting copy.';

describe(toHeroStatementModule, () => {
  it('maps brandVariant, variant and headingBlock straight through', () => {
    const raw = mockRawHeroStatementModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
      variant: HERO_VARIANT.BANNER,
      headingBlock: mockRawHeadingBlock(STATEMENT_HEADING),
    });

    const hero = toHeroStatementModule(raw);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
    expect(hero.variant).toBe(HERO_VARIANT.BANNER);
    expect(hero.headingBlock).toEqual({
      heading: STATEMENT_HEADING,
      supportingText: undefined,
    });
  });

  it.each([
    [null, null, undefined, undefined],
    [
      MOCK_HERO_EYEBROW,
      AUTHORED_SUPPORTING_TEXT,
      MOCK_HERO_EYEBROW,
      AUTHORED_SUPPORTING_TEXT,
    ],
  ])(
    'maps eyebrow %s and supportingText %s to %s and %s',
    (eyebrow, supportingText, expectedEyebrow, expectedSupportingText) => {
      const raw = mockRawHeroStatementModule({
        eyebrow,
        headingBlock: mockRawHeadingBlock(STATEMENT_HEADING, {
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

  it('takes contentPosition and mediaOrder from the Split keys', () => {
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
